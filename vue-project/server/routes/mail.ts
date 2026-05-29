import { Router } from 'express'

import { supabaseAdmin } from '../lib/supabase'

const router = Router()

type Scenario = 'business' | 'school' | 'daily'

const SCENARIO_TO_CATEGORY: Record<Scenario, string> = {
  business: 'company',
  school: 'student',
  daily: 'general',
}

// GET /api/mail?scenario=daily  → メール一覧
router.get('/', async (req, res) => {
  const scenario = req.query.scenario as Scenario | undefined

  let query = supabaseAdmin
    .from('questions')
    .select('id, category, title, sender_name, sender_email, body, is_phishing, has_link, has_attachment, created_at')
    .eq('is_active', true)
    .eq('is_decoy', false)
    .order('created_at', { ascending: false })

  if (scenario && SCENARIO_TO_CATEGORY[scenario]) {
    query = query.eq('category', SCENARIO_TO_CATEGORY[scenario])
  }

  const { data, error } = await query

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.json(data)
})

// GET /api/mail/:id  → 単一メール取得（本文・危険リンク等のフル情報）
router.get('/:id', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('questions')
    .select('*')
    .eq('id', req.params.id)
    .maybeSingle()

  if (error || !data) {
    return res.status(404).json({ error: error?.message ?? 'Mail not found' })
  }

  return res.json(data)
})

export default router
