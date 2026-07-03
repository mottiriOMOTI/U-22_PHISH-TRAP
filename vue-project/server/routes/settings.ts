import { Router } from 'express'

import {
  getSettings,
  resetLearningHistory,
  updateSettings,
  type AppSettings,
} from '../services/settingsStore'

const router = Router()

router.get('/', async (_req, res) => {
  try {
    const settings = await getSettings()
    return res.json({ ok: true, settings })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Failed to fetch settings' })
  }
})

router.put('/', async (req, res) => {
  try {
    const settings = await updateSettings(req.body as Partial<AppSettings>)
    return res.json({ ok: true, settings })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Failed to save settings' })
  }
})

router.post('/reset-learning', async (_req, res) => {
  try {
    const { resetAt } = await resetLearningHistory()
    return res.json({ ok: true, resetAt })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Failed to reset learning history' })
  }
})

export default router
