import { Router } from 'express'

import { AccountNotFoundError, getAccountSummary } from '../services/accountStore'

const router = Router()

// GET /api/account?userId=xxx
router.get('/', async (req, res) => {
  const userId = typeof req.query.userId === 'string' ? req.query.userId.trim() : ''

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' })
  }

  try {
    const account = await getAccountSummary(userId)
    return res.json({ ok: true, account })
  } catch (error) {
    if (error instanceof AccountNotFoundError) {
      return res.status(404).json({ error: error.message })
    }

    console.error(error)
    return res.status(500).json({ error: 'Failed to fetch account statistics' })
  }
})

export default router
