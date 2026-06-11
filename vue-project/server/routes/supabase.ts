import { randomUUID } from 'node:crypto'

import { Router } from 'express'
import type { Response } from 'express'

import { supabaseAdmin } from '../lib/supabase'

const router = Router()

function validateDisplayName(displayName: unknown, res: Response): displayName is string {
  if (!displayName || typeof displayName !== 'string') {
    res.status(400).json({ error: 'display_name is required' })
    return false
  }

  return true
}

router.get('/', async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, display_name, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.json(data)
})

router.get('/:id', async (req, res) => {
  const userId = req.params.id

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, display_name, created_at')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) {
    return res.status(404).json({ error: error?.message ?? 'Profile not found' })
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)
  if (authError) {
    return res.status(500).json({ error: authError.message })
  }

  return res.json({
    ...data,
    last_sign_in_at: authData.user?.last_sign_in_at ?? null,
  })
})

router.post('/', async (req, res) => {
  const { display_name } = req.body

  if (!validateDisplayName(display_name, res)) {
    return
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: `profile-test-${randomUUID()}@example.com`,
    password: `${randomUUID()}${randomUUID()}`,
    email_confirm: true,
    user_metadata: {
      display_name,
    },
  })

  if (authError || !authData.user) {
    return res.status(500).json({ error: authError?.message ?? 'Failed to create test user' })
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .upsert(
      {
        id: authData.user.id,
        display_name,
      },
      { onConflict: 'id' },
    )
    .select('id, display_name, created_at')
    .single()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.status(201).json(data)
})

router.put('/:id', async (req, res) => {
  const { display_name } = req.body

  if (!validateDisplayName(display_name, res)) {
    return
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ display_name })
    .eq('id', req.params.id)
    .select('id, display_name, created_at')
    .single()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.json(data)
})

router.delete('/:id', async (req, res) => {
  const { data: authData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(req.params.id)
  const email = authData.user?.email ?? ''

  if (!getUserError && email.startsWith('profile-test-')) {
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(req.params.id)

    if (deleteUserError) {
      return res.status(500).json({ error: deleteUserError.message })
    }

    return res.json({ ok: true })
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .delete()
    .eq('id', req.params.id)

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.json({ ok: true })
})

export default router
