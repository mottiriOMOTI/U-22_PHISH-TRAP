import { Router } from 'express'

import { getAccountSummary } from '../services/accountStore'
import { getSettings, resetLearningHistory, updateSettings } from '../services/settingsStore'

const router = Router()

router.get('/jsonget', async (_req, res) => {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/users', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
    const data = await response.json()
    return res.json(data)
  } catch (error) {
    console.error('jsonget server error:', error)
    return res.status(500).json({ ok: false, error: 'Failed to fetch external data' })
  }
})

router.get('/settings', async (_req, res) => {
  try {
    const settings = await getSettings()
    return res.json({ ok: true, settings })
  } catch (error) {
    console.error('settings get server error:', error)
    return res.status(500).json({ ok: false, error: 'Failed to fetch settings' })
  }
})

router.get('/account', async (_req, res) => {
  try {
    const account = await getAccountSummary()
    return res.json({ ok: true, account })
  } catch (error) {
    console.error('account get server error:', error)
    return res.status(500).json({ ok: false, error: 'Failed to fetch account' })
  }
})

router.put('/settings', async (req, res) => {
  try {
    const settings = await updateSettings(req.body)
    return res.json({ ok: true, settings })
  } catch (error) {
    console.error('settings update server error:', error)
    return res.status(500).json({ ok: false, error: 'Failed to save settings' })
  }
})

router.post('/settings/reset-learning', async (_req, res) => {
  try {
    const result = await resetLearningHistory()
    return res.json({ ok: true, ...result })
  } catch (error) {
    console.error('learning reset server error:', error)
    return res.status(500).json({ ok: false, error: 'Failed to reset learning history' })
  }
})

router.get('/supabase/ping', async (_req, res) => {
  try {
    const { supabaseAdmin } = await import('../lib/supabase')
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, created_at')
      .limit(10)

    if (error) {
      return res.status(500).json({ ok: false, error: error.message })
    }

    return res.json({ ok: true, count: data.length, rows: data })
  } catch (error) {
    console.error('supabase ping server error:', error)
    return res.status(500).json({ ok: false, error: 'Failed to connect to Supabase' })
  }
})

export default router
