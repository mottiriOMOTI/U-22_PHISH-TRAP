import { Router } from 'express'

import { supabaseAdmin } from '../lib/supabase'

const router = Router()

type Scenario = 'business' | 'school' | 'daily'
const SCENARIOS: Scenario[] = ['business', 'school', 'daily']

// GET /api/trainingStats/averageAccuracy?scenario=business  → 平均正答率
router.get('/averageAccuracy', async (req, res) => {
  const scenario = req.query.scenario as Scenario | undefined

  let query = supabaseAdmin
    .from('training_sessions')
    .select('correct_count, total_questions')

  if (scenario && SCENARIOS.includes(scenario)) {
    query = query.eq('scenario', scenario)
  }

  const { data: sessions, error } = await query

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  if (!sessions || sessions.length === 0) {
    return res.json({ accuracy: 0 })
  }

  const totalCorrect = sessions.reduce((sum, s) => sum + (s.correct_count ?? 0), 0)
  const totalQuestions = sessions.reduce((sum, s) => sum + (s.total_questions ?? 0), 0)

  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 1000) / 10 : 0

  return res.json({ accuracy })
})

// GET /api/trainingStats/questionAccuracy?scenario=business → 問題別正答率
router.get('/questionAccuracy', async (req, res) => {
  const scenario = req.query.scenario as Scenario | undefined

  let query = supabaseAdmin.from('training_sessions').select('*')

  if (scenario && SCENARIOS.includes(scenario)) {
    query = query.eq('scenario', scenario)
  }

  const { data: sessions, error } = await query

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  if (!sessions || sessions.length === 0) {
    return res.json({ accuracies: [] })
  }

  const sample = sessions[0] as Record<string, unknown>
  const questionField = sample.question_type
    ? 'question_type'
    : sample.question_name
    ? 'question_name'
    : sample.question_id
    ? 'question_id'
    : null

  if (!questionField) {
    return res.json({ accuracies: [] })
  }

  type SessionItem = Record<string, unknown> & {
    correct_count?: number | null
    total_questions?: number | null
  }

  const grouped = new Map<string, { totalCorrect: number; totalQuestions: number }>()

  for (const row of sessions as SessionItem[]) {
    const key = String(row[questionField] ?? 'unknown')
    const totalCorrect = row.correct_count ?? 0
    const totalQuestions = row.total_questions ?? 0

    const existing = grouped.get(key)
    if (existing) {
      existing.totalCorrect += totalCorrect
      existing.totalQuestions += totalQuestions
    } else {
      grouped.set(key, { totalCorrect, totalQuestions })
    }
  }

  const accuracies = Array.from(grouped.entries()).map(([question, totals]) => {
    const accuracy = totals.totalQuestions > 0
      ? Math.round((totals.totalCorrect / totals.totalQuestions) * 1000) / 10
      : 0
    return { question, accuracy }
  })

  return res.json({ accuracies })
})

export default router
