import { Router } from 'express'

import { supabaseAdmin } from '../lib/supabase'

const router = Router()

type Scenario = 'business' | 'school' | 'daily'

const SCENARIO_TO_CATEGORY: Record<Scenario, string> = {
  business: 'company',
  school: 'student',
  daily: 'general',
}

const QUESTION_LIST_SELECT =
  'id, category, title, sender_name, sender_email, body, is_phishing, phishing_type, has_link, has_attachment, created_at'

type UpdateQuestionPayload = {
  title?: string
  sender_name?: string
  sender_email?: string
  body?: string
  is_phishing?: boolean
  phishing_type?: string | null
  has_link?: boolean
  has_attachment?: boolean
}

type ExplanationPayload = {
  why_dangerous?: string
  warning_signals?: string[]
  correct_action?: string
}

function pickQuestionUpdates(body: UpdateQuestionPayload) {
  const updates: UpdateQuestionPayload & { updated_at?: string } = {}

  if (typeof body.title === 'string') updates.title = body.title
  if (typeof body.sender_name === 'string') updates.sender_name = body.sender_name
  if (typeof body.sender_email === 'string') updates.sender_email = body.sender_email
  if (typeof body.body === 'string') updates.body = body.body
  if (typeof body.is_phishing === 'boolean') updates.is_phishing = body.is_phishing
  if (typeof body.has_link === 'boolean') updates.has_link = body.has_link
  if (typeof body.has_attachment === 'boolean') updates.has_attachment = body.has_attachment
  if (typeof body.phishing_type === 'string' || body.phishing_type === null) {
    updates.phishing_type = body.phishing_type
  }

  updates.updated_at = new Date().toISOString()
  return updates
}

function parseExplanationPayload(body: ExplanationPayload) {
  if (
    typeof body.why_dangerous !== 'string' ||
    !Array.isArray(body.warning_signals) ||
    typeof body.correct_action !== 'string'
  ) {
    return null
  }

  return {
    why_dangerous: body.why_dangerous,
    warning_signals: body.warning_signals.filter((signal) => typeof signal === 'string'),
    correct_action: body.correct_action,
    updated_at: new Date().toISOString(),
  }
}

router.get('/', async (req, res) => {
  const scenario = req.query.scenario as Scenario | undefined

  let query = supabaseAdmin
    .from('questions')
    .select(QUESTION_LIST_SELECT)
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

router.patch('/:id', async (req, res) => {
  const updates = pickQuestionUpdates(req.body)

  const { data, error } = await supabaseAdmin
    .from('questions')
    .update(updates)
    .eq('id', req.params.id)
    .select(QUESTION_LIST_SELECT)
    .maybeSingle()

  if (error || !data) {
    return res.status(404).json({ error: error?.message ?? 'Question not found' })
  }

  return res.json(data)
})

router.delete('/:id', async (req, res) => {
  const { error } = await supabaseAdmin
    .from('questions')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', req.params.id)

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.sendStatus(204)
})

router.get('/:id/explanation', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('question_explanations')
    .select('*')
    .eq('question_id', req.params.id)
    .maybeSingle()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.json(data)
})

router.put('/:id/explanation', async (req, res) => {
  const payload = parseExplanationPayload(req.body)

  if (!payload) {
    return res.status(400).json({ error: 'Invalid explanation payload' })
  }

  const { data: existing, error: findError } = await supabaseAdmin
    .from('question_explanations')
    .select('id')
    .eq('question_id', req.params.id)
    .maybeSingle()

  if (findError) {
    return res.status(500).json({ error: findError.message })
  }

  const query = existing
    ? supabaseAdmin
        .from('question_explanations')
        .update(payload)
        .eq('id', existing.id)
        .select('*')
        .maybeSingle()
    : supabaseAdmin
        .from('question_explanations')
        .insert({
          ...payload,
          question_id: req.params.id,
        })
        .select('*')
        .maybeSingle()

  const { data, error } = await query

  if (error || !data) {
    return res.status(500).json({ error: error?.message ?? 'Failed to save explanation' })
  }

  return res.json(data)
})

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
