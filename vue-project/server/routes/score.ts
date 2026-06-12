import { Router } from 'express'

import { supabaseAdmin } from '../lib/supabase'

const router = Router()

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
