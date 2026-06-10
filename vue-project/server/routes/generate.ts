import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { Router } from 'express'

const router = Router()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PYTHON_SCRIPT = path.resolve(__dirname, '../ai/python/generate_question_explanation.py')
const PYTHON_COMMAND = process.env.PYTHON_COMMAND ?? 'python'

type GenerateCategory = 'student' | 'company' | 'general'

type GenerateRequestBody = {
  category?: GenerateCategory
  count?: number
}

const categories: GenerateCategory[] = ['student', 'company', 'general']

router.post('/', async (req, res) => {
  const { category, count } = req.body as GenerateRequestBody

  if (!category || !categories.includes(category)) {
    return res.status(400).json({ error: 'category must be student, company, or general' })
  }

  if (count !== 1) {
    return res.status(400).json({ error: 'count must be 1' })
  }

  const generationCount = count

  const child = spawn(PYTHON_COMMAND, [PYTHON_SCRIPT], {
    env: {
      ...process.env,
      PYTHONIOENCODING: 'utf-8',
    },
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  let responded = false
  let stdout = ''
  let stderr = ''

  const timeout = setTimeout(() => {
    if (responded) return
    responded = true
    child.kill()
    res.status(504).json({ error: 'AI generation timed out' })
  }, 120_000)

  child.stdout.setEncoding('utf8')
  child.stderr.setEncoding('utf8')

  child.stdout.on('data', (chunk) => {
    stdout += chunk
  })

  child.stderr.on('data', (chunk) => {
    stderr += chunk
  })

  child.stdin.write(JSON.stringify({ category, count: generationCount }))
  child.stdin.end()

  child.on('error', (error) => {
    if (responded) return
    responded = true
    clearTimeout(timeout)
    return res.status(500).json({ error: error.message })
  })

  child.on('close', (code) => {
    if (responded) return
    responded = true
    clearTimeout(timeout)

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
