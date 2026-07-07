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

function isRequiredString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

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
