import { Router } from 'express'

import { supabaseAdmin } from '../lib/supabase'
import { calculateScoreTotals } from '../services/scoreCalculations'

const router = Router()

type TrainingSessionScore = {
  user_id: string | null
  scenario: string | null
  correct_count: number | null
  wrong_count: number | null
  total_questions: number | null
}

type Scenario = 'business' | 'school' | 'daily'
type AnswerAction = 'link' | 'attachment' | 'reply' | 'report'

const SCENARIOS = new Set<Scenario>(['business', 'school', 'daily'])
const ACTIONS = new Set<AnswerAction>(['link', 'attachment', 'reply', 'report'])
const SCENARIO_TO_CATEGORY: Record<Scenario, string> = {
  business: 'company',
  school: 'student',
  daily: 'general',
}
const CATEGORY_TO_SCENARIO: Record<string, Scenario> = {
  company: 'business',
  student: 'school',
  general: 'daily',
}
const MAX_TRAINING_DURATION_MS = 4 * 60 * 60 * 1000

type UserScoreAccumulator = {
  userId: string
  totalCorrect: number
  totalWrong: number
  totalUnanswered: number
  totalQuestions: number
  sessionCount: number
}

type ScoreUserProfile = {
  id: string
  name: string | null
  email: string | null
  current_scenario: string | null
}

function toScoreCounts(session: TrainingSessionScore) {
  const correct = session.correct_count ?? 0
  const wrong = session.wrong_count ?? 0
  const total = session.total_questions ?? 0

  return {
    correct,
    wrong,
    total,
    unanswered: Math.max(total - correct - wrong, 0),
  }
}

function formatUserLabel(user: ScoreUserProfile) {
  return user.name?.trim() || user.email?.trim() || 'Unknown user'
}

function isCorrectAnswer(isPhishing: boolean, action: AnswerAction) {
  return isPhishing ? action === 'report' : action !== 'report'
}

function resolveStartedAt(value: unknown, completedAt: string): string {
  if (typeof value !== 'string') {
    return completedAt
  }

  const startedAtMs = new Date(value).getTime()
  const completedAtMs = new Date(completedAt).getTime()
  const durationMs = completedAtMs - startedAtMs

  if (
    Number.isNaN(startedAtMs) ||
    durationMs < 0 ||
    durationMs > MAX_TRAINING_DURATION_MS
  ) {
    return completedAt
  }

  return new Date(startedAtMs).toISOString()
}

// POST /api/score/answer
// 1問ごとの回答を保存する。同じユーザー・問題の再回答は既存結果を更新する。
router.post('/answer', async (req, res) => {
  const { userId, questionId, action, startedAt } = req.body ?? {}

  if (
    typeof userId !== 'string' ||
    typeof questionId !== 'string' ||
    typeof action !== 'string' ||
    !ACTIONS.has(action as AnswerAction)
  ) {
    return res.status(400).json({ error: 'userId, questionId and a valid action are required' })
  }

  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, role, is_active')
    .eq('id', userId)
    .maybeSingle()

  if (userError) {
    return res.status(500).json({ error: userError.message })
  }

  if (!user || user.role !== 'learner' || user.is_active === false) {
    return res.status(404).json({ error: 'Active learner not found' })
  }

  const { data: question, error: questionError } = await supabaseAdmin
    .from('questions')
    .select('id, category, is_phishing')
    .eq('id', questionId)
    .eq('is_active', true)
    .eq('is_decoy', false)
    .maybeSingle()

  if (questionError) {
    return res.status(500).json({ error: questionError.message })
  }

  const scenario = question ? CATEGORY_TO_SCENARIO[question.category] : undefined

  if (!question || !scenario) {
    return res.status(404).json({ error: 'Active training question not found' })
  }

  const correct = isCorrectAnswer(Boolean(question.is_phishing), action as AnswerAction)
  const now = new Date().toISOString()
  const values = {
    user_id: userId,
    question_id: questionId,
    scenario,
    total_questions: 1,
    correct_count: correct ? 1 : 0,
    wrong_count: correct ? 0 : 1,
    score: correct ? 100 : 0,
    started_at: resolveStartedAt(startedAt, now),
    completed_at: now,
    is_completed: true,
  }

  const { data: existing, error: existingError } = await supabaseAdmin
    .from('training_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .maybeSingle()

  if (existingError) {
    return res.status(500).json({ error: existingError.message })
  }

  const saveQuery = existing
    ? supabaseAdmin
        .from('training_sessions')
        .update(values)
        .eq('id', existing.id)
        .select('id')
        .maybeSingle()
    : supabaseAdmin
        .from('training_sessions')
        .insert(values)
        .select('id')
        .maybeSingle()

  const { data: saved, error: saveError } = await saveQuery

  if (saveError || !saved) {
    return res.status(500).json({ error: saveError?.message ?? 'Failed to save answer' })
  }

  return res.json({
    ok: true,
    is_correct: correct,
  })
})

// GET /api/score/average
router.get('/average', async (req, res) => {
  const requestedScenario =
    typeof req.query.scenario === 'string' ? (req.query.scenario as Scenario) : undefined

  if (requestedScenario && !SCENARIOS.has(requestedScenario)) {
    return res.status(400).json({ error: 'scenario is invalid' })
  }

  let sessionsQuery = supabaseAdmin
    .from('training_sessions')
    .select('user_id, scenario, correct_count, wrong_count, total_questions')
    .eq('is_completed', true)

  let questionsQuery = supabaseAdmin
    .from('questions')
    .select('category')
    .eq('is_active', true)
    .eq('is_decoy', false)

  if (requestedScenario) {
    sessionsQuery = sessionsQuery.eq('scenario', requestedScenario)
    questionsQuery = questionsQuery.eq('category', SCENARIO_TO_CATEGORY[requestedScenario])
  }

  const [sessionsResult, questionsResult] = await Promise.all([
    sessionsQuery,
    questionsQuery,
  ])

  const { data, error } = sessionsResult
  const { data: activeQuestions, error: questionsError } = questionsResult

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  if (questionsError) {
    return res.status(500).json({ error: questionsError.message })
  }

  const sessions = data ?? []
  const sessionUserIds = Array.from(
    new Set(sessions.map((session) => session.user_id).filter((userId): userId is string => Boolean(userId))),
  )

  const { data: scoreUsers, error: usersError } =
    sessionUserIds.length > 0
      ? await supabaseAdmin
          .from('users')
          .select('id, name, email, current_scenario')
          .in('id', sessionUserIds)
          .eq('role', 'learner')
          .eq('is_active', true)
      : { data: [], error: null }

  if (usersError) {
    return res.status(500).json({ error: usersError.message })
  }

  const userProfiles = new Map((scoreUsers ?? []).map((user) => [user.id, user]))
  const users = new Map<string, UserScoreAccumulator>()

  const questionCounts: Record<Scenario, number> = {
    business: 0,
    school: 0,
    daily: 0,
  }

  for (const question of activeQuestions ?? []) {
    const scenario = CATEGORY_TO_SCENARIO[question.category]
    if (scenario) {
      questionCounts[scenario] += 1
    }
  }

  for (const session of sessions) {
    if (!session.user_id) {
      continue
    }

    const profile = userProfiles.get(session.user_id)

    if (!profile) {
      continue
    }

    const profileScenario = requestedScenario ?? (
      SCENARIOS.has(profile.current_scenario as Scenario)
        ? (profile.current_scenario as Scenario)
        : 'school'
    )

    // マージ前に作成された回答には scenario が入っていないため、
    // それらまで除外すると既存ユーザーのスコアが突然 0 件になる。
    // scenario が保存されている回答だけを現在のシナリオで絞り込む。
    if (session.scenario && session.scenario !== profileScenario) {
      continue
    }

    const counts = toScoreCounts(session)

    const current = users.get(session.user_id) ?? {
      userId: session.user_id,
      totalCorrect: 0,
      totalWrong: 0,
      totalUnanswered: 0,
      totalQuestions: 0,
      sessionCount: 0,
    }

    current.totalCorrect += counts.correct
    current.totalWrong += counts.wrong
    current.totalUnanswered += counts.unanswered
    current.totalQuestions += counts.total
    current.sessionCount += 1
    users.set(session.user_id, current)
  }

  const userSummaries = Array.from(users.values())
    .map((user) => {
      const profile = userProfiles.get(user.userId)!
      const scenario = requestedScenario ?? (
        SCENARIOS.has(profile.current_scenario as Scenario)
          ? (profile.current_scenario as Scenario)
          : 'school'
      )
      const totals = calculateScoreTotals(
        user.totalCorrect,
        user.totalWrong,
        user.totalQuestions,
        questionCounts[scenario],
      )

      return {
        userId: user.userId,
        label: formatUserLabel(profile),
        total_correct: user.totalCorrect,
        total_wrong: user.totalWrong,
        total_unanswered: totals.totalUnanswered,
        total_questions: totals.totalQuestions,
        session_count: user.sessionCount,
        accuracy: totals.accuracy,
      }
    })
    .sort((a, b) => b.accuracy - a.accuracy || b.total_questions - a.total_questions)
    .map((user, index) => ({
      rank: index + 1,
      ...user,
    }))

  const averageUserAccuracy =
    userSummaries.length > 0
      ? userSummaries.reduce((sum, user) => sum + user.accuracy, 0) / userSummaries.length
      : 0

  const distribution = userSummaries.reduce(
    (summary, user) => {
      if (user.accuracy >= 0.8) {
        summary.excellent += 1
      } else if (user.accuracy >= 0.6) {
        summary.good += 1
      } else {
        summary.needs_review += 1
      }

      return summary
    },
    { excellent: 0, good: 0, needs_review: 0 },
  )

  const totalCorrect = userSummaries.reduce((sum, user) => sum + user.total_correct, 0)
  const totalWrong = userSummaries.reduce((sum, user) => sum + user.total_wrong, 0)
  const totalUnanswered = userSummaries.reduce((sum, user) => sum + user.total_unanswered, 0)
  const totalQuestions = userSummaries.reduce((sum, user) => sum + user.total_questions, 0)
  const sessionCount = userSummaries.reduce((sum, user) => sum + user.session_count, 0)

  return res.json({
    total_users: userSummaries.length,
    session_count: sessionCount,
    total_correct: totalCorrect,
    total_wrong: totalWrong,
    total_unanswered: totalUnanswered,
    total_questions: totalQuestions,
    accuracy: totalQuestions > 0 ? totalCorrect / totalQuestions : 0,
    average_user_accuracy: averageUserAccuracy,
    distribution,
    users: userSummaries,
  })
})

// GET /api/score?userId=xxx  → 完了済みセッションの合計スコア
router.get('/', async (req, res) => {
  const userId = req.query.userId as string | undefined

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' })
  }

  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('current_scenario')
    .eq('id', userId)
    .maybeSingle()

  if (userError) {
    return res.status(500).json({ error: userError.message })
  }

  const scenario = SCENARIOS.has(user?.current_scenario as Scenario)
    ? (user!.current_scenario as Scenario)
    : 'school'

  const [sessionsResult, questionCountResult] = await Promise.all([
    supabaseAdmin
      .from('training_sessions')
      .select('correct_count, wrong_count, total_questions')
      .eq('user_id', userId)
      // 旧回答（scenario が null）も引き続きスコアに反映する。
      .or(`scenario.eq.${scenario},scenario.is.null`)
      .eq('is_completed', true),
    supabaseAdmin
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('category', SCENARIO_TO_CATEGORY[scenario])
      .eq('is_active', true)
      .eq('is_decoy', false),
  ])

  const { data, error } = sessionsResult
  const { count: activeQuestionCount, error: questionCountError } = questionCountResult

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  if (questionCountError) {
    return res.status(500).json({ error: questionCountError.message })
  }

  const sessions = data ?? []
  const totalCorrect = sessions.reduce((sum, s) => sum + (s.correct_count ?? 0), 0)
  const totalWrong = sessions.reduce((sum, s) => sum + (s.wrong_count ?? 0), 0)
  const recordedQuestions = sessions.reduce((sum, s) => sum + (s.total_questions ?? 0), 0)
  const totals = calculateScoreTotals(
    totalCorrect,
    totalWrong,
    recordedQuestions,
    activeQuestionCount ?? 0,
  )

  return res.json({
    total_correct: totalCorrect,
    total_wrong: totalWrong,
    total_unanswered: totals.totalUnanswered,
    total_questions: totals.totalQuestions,
    accuracy: totals.accuracy,
    session_count: sessions.length,
  })
})

export default router
