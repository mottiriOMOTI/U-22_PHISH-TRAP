import { Router } from 'express'

import { supabaseAdmin } from '../lib/supabase'

const router = Router()
const ACTION_TYPES = new Set([
  'reported',
  'clicked_link',
  'downloaded_attachment',
  'replied',
  'ignored',
])
const SCENARIOS = new Set(['business', 'school', 'daily'])

type AnswerDelta = {
  total: number
  correct: number
  wrong: number
}

function isRequiredString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function calculateAnswerDelta(previousIsCorrect: boolean | null, nextIsCorrect: boolean): AnswerDelta {
  if (previousIsCorrect === null) {
    return {
      total: 1,
      correct: nextIsCorrect ? 1 : 0,
      wrong: nextIsCorrect ? 0 : 1,
    }
  }

  if (previousIsCorrect === nextIsCorrect) {
    return { total: 0, correct: 0, wrong: 0 }
  }

  return nextIsCorrect
    ? { total: 0, correct: 1, wrong: -1 }
    : { total: 0, correct: -1, wrong: 1 }
}

function calculateScore(correctCount: number, totalQuestions: number) {
  return totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0
}

async function updateTrainingSession(userId: string, isCorrect: boolean, previousIsCorrect: boolean | null) {
  const delta = calculateAnswerDelta(previousIsCorrect, isCorrect)

  if (delta.total === 0 && delta.correct === 0 && delta.wrong === 0) {
    return
  }

  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('current_scenario')
    .eq('id', userId)
    .maybeSingle()

  if (userError) {
    throw userError
  }

  const scenario = typeof user?.current_scenario === 'string' && SCENARIOS.has(user.current_scenario)
    ? user.current_scenario
    : 'school'

  const { data: session, error: sessionError } = await supabaseAdmin
    .from('training_sessions')
    .select('id, total_questions, correct_count, wrong_count')
    .eq('user_id', userId)
    .eq('scenario', scenario)
    .eq('is_completed', false)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (sessionError) {
    throw sessionError
  }

  const nextTotalQuestions = Math.max(Number(session?.total_questions ?? 0) + delta.total, 1)
  const nextCorrectCount = Math.max(Number(session?.correct_count ?? 0) + delta.correct, 0)
  const nextWrongCount = Math.max(Number(session?.wrong_count ?? 0) + delta.wrong, 0)
  const nextScore = calculateScore(nextCorrectCount, nextTotalQuestions)

  if (session?.id) {
    const { error } = await supabaseAdmin
      .from('training_sessions')
      .update({
        total_questions: nextTotalQuestions,
        correct_count: nextCorrectCount,
        wrong_count: nextWrongCount,
        score: nextScore,
      })
      .eq('id', session.id)

    if (error) {
      throw error
    }

    return
  }

  const { error } = await supabaseAdmin.from('training_sessions').insert({
    user_id: userId,
    scenario,
    total_questions: nextTotalQuestions,
    correct_count: nextCorrectCount,
    wrong_count: nextWrongCount,
    score: nextScore,
  })

  if (error) {
    throw error
  }
}

router.get('/', async (req, res) => {
  const userId = typeof req.query.user_id === 'string' ? req.query.user_id.trim() : ''
  const rawQuestionIds = req.query.question_ids
  const questionIds = Array.isArray(rawQuestionIds)
    ? rawQuestionIds.filter((value): value is string => typeof value === 'string' && value.trim().length > 0).map((value) => value.trim())
    : typeof rawQuestionIds === 'string'
      ? rawQuestionIds.split(',').map((value) => value.trim()).filter(Boolean)
      : []

  if (!isRequiredString(userId)) {
    return res.status(400).json({ error: 'user_id is required' })
  }

  let query = supabaseAdmin
    .from('user_answers')
    .select('question_id, effect_flag, is_correct')
    .eq('user_id', userId)

  if (questionIds.length > 0) {
    query = query.in('question_id', questionIds)
  }

  const { data, error } = await query

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.json(data ?? [])
})

router.post('/', async (req, res) => {
  const { user_id, question_id, action_type, is_correct } = req.body ?? {}

  if (!isRequiredString(user_id) || !isRequiredString(question_id)) {
    return res.status(400).json({ error: 'user_id and question_id are required' })
  }

  if (!isRequiredString(action_type) || !ACTION_TYPES.has(action_type)) {
    return res.status(400).json({ error: 'action_type is invalid' })
  }

  if (typeof is_correct !== 'boolean') {
    return res.status(400).json({ error: 'is_correct must be boolean' })
  }

  const answerPayload = {
    action_type,
    is_correct,
    answered_at: new Date().toISOString(),
  }
  const normalizedUserId = user_id.trim()
  const normalizedQuestionId = question_id.trim()
  const { data: previousAnswer, error: previousAnswerError } = await supabaseAdmin
    .from('user_answers')
    .select('is_correct')
    .eq('user_id', normalizedUserId)
    .eq('question_id', normalizedQuestionId)
    .order('answered_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (previousAnswerError) {
    return res.status(500).json({ error: previousAnswerError.message })
  }

  const { data: updatedRows, error: updateError } = await supabaseAdmin
    .from('user_answers')
    .update(answerPayload)
    .eq('user_id', normalizedUserId)
    .eq('question_id', normalizedQuestionId)
    .select()

  if (updateError) {
    return res.status(500).json({ error: updateError.message })
  }

  if (updatedRows && updatedRows.length > 0) {
    try {
      await updateTrainingSession(normalizedUserId, is_correct, previousAnswer?.is_correct ?? null)
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to update training session',
      })
    }

    return res.json(updatedRows[0])
  }

  const { data, error } = await supabaseAdmin
    .from('user_answers')
    .insert({
      user_id: normalizedUserId,
      question_id: normalizedQuestionId,
      ...answerPayload,
      effect_flag: !is_correct,
    })
    .select()
    .single()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  try {
    await updateTrainingSession(normalizedUserId, is_correct, null)
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to update training session',
    })
  }

  return res.status(201).json(data)
})

router.patch('/effect-flag', async (req, res) => {
  const { user_id, question_id, effect_flag } = req.body ?? {}

  if (!isRequiredString(user_id) || !isRequiredString(question_id)) {
    return res.status(400).json({ error: 'user_id and question_id are required' })
  }

  if (typeof effect_flag !== 'boolean') {
    return res.status(400).json({ error: 'effect_flag must be boolean' })
  }

  const { data, error } = await supabaseAdmin
    .from('user_answers')
    .update({ effect_flag })
    .eq('user_id', user_id.trim())
    .eq('question_id', question_id.trim())
    .select()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.json({ ok: true, data })
})

export default router
