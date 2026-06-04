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

export default router
