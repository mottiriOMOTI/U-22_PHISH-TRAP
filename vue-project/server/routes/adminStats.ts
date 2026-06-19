import { Router } from 'express'

import { supabaseAdmin } from '../lib/supabase'

const router = Router()

type Scenario = 'business' | 'school' | 'daily'
const SCENARIOS: Scenario[] = ['business', 'school', 'daily']

// GET /api/adminStats/learnerCount?scenario=business  → 学習者数集計
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

  const { data, error, count } = await query

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.json({ total: count ?? 0 })
})

export default router
