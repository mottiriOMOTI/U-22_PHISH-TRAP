import { Router } from 'express'

import { supabaseAdmin } from '../lib/supabase'

const router = Router()

type TrainingSessionScore = {
  user_id: string | null
  correct_count: number | null
  wrong_count: number | null
  total_questions: number | null
}

type UserScoreAccumulator = {
  totalCorrect: number
  totalWrong: number
  totalUnanswered: number
  totalQuestions: number
  sessionCount: number
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

// GET /api/score/average
router.get('/average', async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('training_sessions')
    .select('user_id, correct_count, wrong_count, total_questions')
    .eq('is_completed', true)

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  const sessions = data ?? []
  const users = new Map<string, UserScoreAccumulator>()

  let totalCorrect = 0
  let totalWrong = 0
  let totalUnanswered = 0
  let totalQuestions = 0

  for (const session of sessions) {
    const counts = toScoreCounts(session)

    totalCorrect += counts.correct
    totalWrong += counts.wrong
    totalUnanswered += counts.unanswered
    totalQuestions += counts.total

    if (!session.user_id) {
      continue
    }

    const current = users.get(session.user_id) ?? {
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
    .map((user) => ({
      total_correct: user.totalCorrect,
      total_wrong: user.totalWrong,
      total_unanswered: user.totalUnanswered,
      total_questions: user.totalQuestions,
      session_count: user.sessionCount,
      accuracy: user.totalQuestions > 0 ? user.totalCorrect / user.totalQuestions : 0,
    }))
    .sort((a, b) => b.accuracy - a.accuracy || b.total_questions - a.total_questions)
    .map((user, index) => ({
      rank: index + 1,
      label: `User ${index + 1}`,
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

  return res.json({
    total_users: userSummaries.length,
    session_count: sessions.length,
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

  const { data, error } = await supabaseAdmin
    .from('training_sessions')
    .select('correct_count, wrong_count, total_questions')
    .eq('user_id', userId)
    .eq('is_completed', true)

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  const sessions = data ?? []
  const totalCorrect = sessions.reduce((sum, s) => sum + (s.correct_count ?? 0), 0)
  const totalWrong = sessions.reduce((sum, s) => sum + (s.wrong_count ?? 0), 0)
  const totalQuestions = sessions.reduce((sum, s) => sum + (s.total_questions ?? 0), 0)
  const totalUnanswered = Math.max(totalQuestions - totalCorrect - totalWrong, 0)
  const accuracy = totalQuestions > 0 ? totalCorrect / totalQuestions : 0

  return res.json({
    total_correct: totalCorrect,
    total_wrong: totalWrong,
    total_unanswered: totalUnanswered,
    total_questions: totalQuestions,
    accuracy,
    session_count: sessions.length,
  })
})

export default router
