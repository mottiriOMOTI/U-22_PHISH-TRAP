import { Router } from 'express'

import { supabaseAdmin } from '../lib/supabase'

const router = Router()

type Scenario = 'business' | 'school' | 'daily'
const SCENARIOS: Scenario[] = ['business', 'school', 'daily']

// GET /api/users?scenario=business  → ユーザー一覧（最新セッションのスコア付き）
router.get('/', async (req, res) => {
  const scenario = req.query.scenario as Scenario | undefined

  let usersQuery = supabaseAdmin
    .from('users')
    .select('id, email, name, role, current_scenario, last_active_at, is_active')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (scenario && SCENARIOS.includes(scenario)) {
    usersQuery = usersQuery.eq('current_scenario', scenario)
  }

  const { data: users, error: usersErr } = await usersQuery

  if (usersErr) {
    return res.status(500).json({ error: usersErr.message })
  }

  if (!users || users.length === 0) {
    return res.json([])
  }

  const userIds = users.map(u => u.id)

  const { data: sessions, error: sessErr } = await supabaseAdmin
    .from('training_sessions')
    .select('user_id, scenario, correct_count, total_questions, started_at')
    .in('user_id', userIds)
    .order('started_at', { ascending: false })

  if (sessErr) {
    return res.status(500).json({ error: sessErr.message })
  }

  const latestByUser = new Map<string, typeof sessions[number]>()
  for (const s of sessions ?? []) {
    if (!latestByUser.has(s.user_id)) {
      latestByUser.set(s.user_id, s)
    }
  }

  const result = users.map(u => {
    const latest = latestByUser.get(u.id)
    return {
      ...u,
      latest_correct_count: latest?.correct_count ?? null,
      latest_total_questions: latest?.total_questions ?? null,
    }
  })

  return res.json(result)
})

export default router
 