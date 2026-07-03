import { Router } from 'express'

import { supabaseAdmin } from '../lib/supabase'

const router = Router()

type Scenario = 'business' | 'school' | 'daily'
const SCENARIOS: Scenario[] = ['business', 'school', 'daily']

type LearnerCounts = Record<Scenario | 'total', number>
type AccuracyBuckets = Record<Scenario | 'total', { correct: number; questions: number }>

type UserRow = {
  id: string
  email: string
  name: string
  role: string
  current_scenario: Scenario | string
  last_active_at: string | null
  is_active: boolean
  created_at: string
}

type TrainingSessionRow = {
  user_id: string
  scenario: Scenario | string | null
  correct_count: number | null
  total_questions: number | null
  started_at: string | null
}

function createLearnerCounts(): LearnerCounts {
  return {
    total: 0,
    business: 0,
    school: 0,
    daily: 0,
  }
}

function createAccuracyBuckets(): AccuracyBuckets {
  return {
    total: { correct: 0, questions: 0 },
    business: { correct: 0, questions: 0 },
    school: { correct: 0, questions: 0 },
    daily: { correct: 0, questions: 0 },
  }
}

function isScenario(value: unknown): value is Scenario {
  return typeof value === 'string' && SCENARIOS.includes(value as Scenario)
}

function toAccuracyPercent(bucket: { correct: number; questions: number }) {
  return bucket.questions > 0 ? Math.round((bucket.correct / bucket.questions) * 1000) / 10 : 0
}

router.get('/learnerCount', async (req, res) => {
  const scenario = req.query.scenario as Scenario | undefined

  let query = supabaseAdmin
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'learner')
    .eq('is_active', true)

  if (scenario && SCENARIOS.includes(scenario)) {
    query = query.eq('current_scenario', scenario)
  }

  const { error, count } = await query

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.json({ total: count ?? 0 })
})

router.get('/overview', async (_req, res) => {
  const { data: users, error: usersError } = await supabaseAdmin
    .from('users')
    .select('id, email, name, role, current_scenario, last_active_at, is_active, created_at')
    .eq('role', 'learner')
    .order('created_at', { ascending: false })

  if (usersError) {
    return res.status(500).json({ error: usersError.message })
  }

  const learnerRows = (users ?? []) as UserRow[]
  const learnerCounts = createLearnerCounts()

  for (const user of learnerRows) {
    if (!user.is_active) continue

    learnerCounts.total += 1
    if (isScenario(user.current_scenario)) {
      learnerCounts[user.current_scenario] += 1
    }
  }

  if (learnerRows.length === 0) {
    return res.json({
      learnerCounts,
      averageAccuracies: {
        total: 0,
        business: 0,
        school: 0,
        daily: 0,
      },
      users: [],
    })
  }

  const userIds = learnerRows.map((user) => user.id)

  const { data: sessions, error: sessionsError } = await supabaseAdmin
    .from('training_sessions')
    .select('user_id, scenario, correct_count, total_questions, started_at')
    .in('user_id', userIds)
    .eq('is_completed', true)
    .order('started_at', { ascending: false })

  if (sessionsError) {
    return res.status(500).json({ error: sessionsError.message })
  }

  const latestByUser = new Map<string, TrainingSessionRow>()
  const accuracyBuckets = createAccuracyBuckets()

  for (const session of (sessions ?? []) as TrainingSessionRow[]) {
    if (!latestByUser.has(session.user_id)) {
      latestByUser.set(session.user_id, session)
    }

    const correct = session.correct_count ?? 0
    const questions = session.total_questions ?? 0

    accuracyBuckets.total.correct += correct
    accuracyBuckets.total.questions += questions

    if (isScenario(session.scenario)) {
      accuracyBuckets[session.scenario].correct += correct
      accuracyBuckets[session.scenario].questions += questions
    }
  }

  const overviewUsers = learnerRows.map((user) => {
    const latest = latestByUser.get(user.id)

    return {
      ...user,
      latest_correct_count: latest?.correct_count ?? null,
      latest_total_questions: latest?.total_questions ?? null,
    }
  })

  return res.json({
    learnerCounts,
    averageAccuracies: {
      total: toAccuracyPercent(accuracyBuckets.total),
      business: toAccuracyPercent(accuracyBuckets.business),
      school: toAccuracyPercent(accuracyBuckets.school),
      daily: toAccuracyPercent(accuracyBuckets.daily),
    },
    users: overviewUsers,
  })
})

export default router
