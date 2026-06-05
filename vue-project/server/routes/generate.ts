import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { Router } from 'express'

const router = Router()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PYTHON_SCRIPT = path.resolve(__dirname, '../python/generate_question_explanation.py')
const PYTHON_COMMAND = process.env.PYTHON_COMMAND ?? 'python'

type GenerateRequestBody = {
  questionText?: string
}

router.post('/', async (req, res) => {
  const { questionText } = req.body as GenerateRequestBody

  if (typeof questionText !== 'string' || questionText.trim().length === 0) {
    return res.status(400).json({ error: 'questionText is required' })
  }

  const child = spawn(PYTHON_COMMAND, [PYTHON_SCRIPT], {
    env: {
      ...process.env,
      PYTHONIOENCODING: 'utf-8',
    },
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  let stdout = ''
  let stderr = ''

  child.stdout.setEncoding('utf8')
  child.stderr.setEncoding('utf8')

  child.stdout.on('data', (chunk) => {
    stdout += chunk
  })

  child.stderr.on('data', (chunk) => {
    stderr += chunk
  })

  child.stdin.write(JSON.stringify({ questionText: questionText.trim() }))
  child.stdin.end()

  child.on('error', (error) => {
    return res.status(500).json({ error: error.message })
  })

  child.on('close', (code) => {
    if (code !== 0) {
      const message = stderr.trim() || `Python process exited with code ${code}`
      return res.status(500).json({ error: message })
    }

    try {
      return res.json(JSON.parse(stdout))
    } catch {
      return res.status(500).json({ error: 'Failed to parse generator output' })
    }
  })
})

export default router
