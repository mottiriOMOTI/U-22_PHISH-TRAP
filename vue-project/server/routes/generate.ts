import { randomUUID } from 'node:crypto'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { Router } from 'express'

import { supabaseAdmin } from '../lib/supabase'

const router = Router()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PYTHON_SCRIPT = path.resolve(__dirname, '../ai/python/generate_question_explanation.py')
const PYTHON_COMMAND = process.env.PYTHON_COMMAND ?? 'python'
const QUESTION_IMAGE_BUCKET = 'questions_image'
const QUESTION_IMAGE_CONTENT_TYPE = 'image/jpeg'
const MAX_QUESTION_IMAGE_BYTES = 8 * 1024 * 1024

type CloudflareImageModel = {
  id: string
  requestType: 'json' | 'multipart'
}

const CLOUDFLARE_IMAGE_MODELS: CloudflareImageModel[] = [
  {
    id: '@cf/black-forest-labs/flux-2-klein-4b',
    requestType: 'multipart',
  },
  {
    id: '@cf/black-forest-labs/flux-1-schnell',
    requestType: 'json',
  },
  {
    id: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
    requestType: 'json',
  },
]

type GenerateCategory = 'student' | 'company' | 'general'

type GenerateRequestBody = {
  category?: GenerateCategory
  count?: number
  isPhishing?: boolean
  includeImage?: boolean
}

type GeneratedQuestionExplanation = {
  why_dangerous?: unknown
  warning_signals?: unknown
  correct_action?: unknown
}

type GeneratedQuestion = {
  category: GenerateCategory
  title: string
  sender_name: string
  sender_email: string
  body: string
  is_phishing: boolean
  phishing_type: string | null
  has_link: boolean
  dangerous_links?: unknown
  has_attachment: boolean
  dangerous_attachments?: unknown
  is_decoy?: boolean
  is_active?: boolean
  safe_attachments?: unknown
  explanation: {
    why_dangerous: string
    warning_signals: string[]
    correct_action: string
  }
  question_image_url?: string | null
  question_image_data_url?: string | null
}

type SaveGeneratedQuestionBody = {
  category?: unknown
  title?: unknown
  sender_name?: unknown
  sender_email?: unknown
  body?: unknown
  is_phishing?: unknown
  phishing_type?: unknown
  has_link?: unknown
  dangerous_links?: unknown
  has_attachment?: unknown
  dangerous_attachments?: unknown
  is_decoy?: unknown
  is_active?: unknown
  safe_attachments?: unknown
  question_image_data_url?: unknown
  question_image_url?: unknown
  explanation?: GeneratedQuestionExplanation
}

const categories: GenerateCategory[] = ['student', 'company', 'general']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function parseJsonArray(value: unknown) {
  return Array.isArray(value) ? value : []
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function buildImagePrompt(question: GeneratedQuestion) {
  const mailType = question.is_phishing ? 'phishing awareness training' : 'safe email training'
  const bodyPreview = stripHtml(question.body).slice(0, 360)

  return [
    'A realistic educational cybersecurity training illustration.',
    `Theme: ${mailType}.`,
    `Email subject context: ${question.title}.`,
    `Sender context: ${question.sender_name}.`,
    `Email body context: ${bodyPreview}.`,
    'Show a modern inbox or security training scene, no real brands, no logos, no readable text, no real people.',
    'Clean composition, professional UI training material, 1024x1024.',
  ].join(' ')
}

class CloudflareImageGenerationError extends Error {
  status: number
  body: string
  modelId: string

  constructor(modelId: string, status: number, body: string) {
    super(`Cloudflare image generation failed for ${modelId} (${status}): ${body.slice(0, 300)}`)
    this.status = status
    this.body = body
    this.modelId = modelId
  }
}

function isCloudflareLimitError(error: unknown): error is CloudflareImageGenerationError {
  if (!(error instanceof CloudflareImageGenerationError)) return false

  const body = error.body.toLowerCase()
  const fallbackStatuses = new Set([402, 403, 408, 409, 425, 429, 500, 502, 503, 504])
  return (
    fallbackStatuses.has(error.status) ||
    body.includes('limit') ||
    body.includes('quota') ||
    body.includes('rate') ||
    body.includes('throttl') ||
    body.includes('capacity') ||
    body.includes('too many') ||
    body.includes('exceed') ||
    body.includes('unavailable') ||
    body.includes('overload') ||
    body.includes('temporarily') ||
    body.includes('try again') ||
    body.includes('resource')
  )
}

function parseQuestionImageDataUrl(value: unknown) {
  if (typeof value !== 'string' || value.length === 0) {
    return null
  }

  const prefix = `data:${QUESTION_IMAGE_CONTENT_TYPE};base64,`
  if (!value.startsWith(prefix)) {
    throw new Error('question image must be a jpeg data URL')
  }

  const fileBuffer = Buffer.from(value.slice(prefix.length), 'base64')
  if (fileBuffer.length === 0 || fileBuffer.length > MAX_QUESTION_IMAGE_BYTES) {
    throw new Error('question image size is invalid')
  }

  return fileBuffer
}

async function ensureQuestionImageBucket() {
  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets()

  if (listError) {
    return listError
  }

  const exists = buckets?.some((bucket) => bucket.name === QUESTION_IMAGE_BUCKET)

  if (exists) {
    const { error } = await supabaseAdmin.storage.updateBucket(QUESTION_IMAGE_BUCKET, {
      public: true,
    })
    return error
  }

  const { error } = await supabaseAdmin.storage.createBucket(QUESTION_IMAGE_BUCKET, {
    public: true,
    fileSizeLimit: MAX_QUESTION_IMAGE_BYTES,
    allowedMimeTypes: [QUESTION_IMAGE_CONTENT_TYPE],
  })

  return error
}

async function uploadQuestionImage(dataUrl: unknown) {
  const fileBuffer = parseQuestionImageDataUrl(dataUrl)
  if (!fileBuffer) return null

  const bucketError = await ensureQuestionImageBucket()
  if (bucketError) {
    throw new Error(bucketError.message)
  }

  const filePath = `generated-questions/${randomUUID()}.jpg`
  const { error: uploadError } = await supabaseAdmin.storage
    .from(QUESTION_IMAGE_BUCKET)
    .upload(filePath, fileBuffer, {
      contentType: QUESTION_IMAGE_CONTENT_TYPE,
      upsert: false,
    })

  if (uploadError) {
    throw new Error(uploadError.message)
  }

  const { data: publicUrlData } = supabaseAdmin.storage
    .from(QUESTION_IMAGE_BUCKET)
    .getPublicUrl(filePath)

  return publicUrlData.publicUrl
}

function buildCloudflareRequestBody(
  model: CloudflareImageModel,
  prompt: string,
): { body: BodyInit; headers: Record<string, string> } {
  if (model.requestType === 'multipart') {
    const form = new FormData()
    form.set('prompt', prompt)
    form.set('width', '1024')
    form.set('height', '1024')
    form.set('steps', '25')

    return {
      body: form,
      headers: {},
    }
  }

  const isFluxSchnell = model.id.includes('flux-1-schnell')
  return {
    body: JSON.stringify(
      isFluxSchnell
        ? {
            prompt,
            steps: 4,
          }
        : {
            prompt,
            negative_prompt: 'real logos, brand names, readable text, watermark, signature, real person, distorted UI',
            width: 1024,
            height: 1024,
            num_steps: 20,
            guidance: 7.5,
          },
    ),
    headers: {
      'Content-Type': 'application/json',
    },
  }
}

function getCloudflareAcceptHeader(model: CloudflareImageModel) {
  return model.id.includes('stable-diffusion-xl-base-1.0') ? QUESTION_IMAGE_CONTENT_TYPE : 'application/json'
}

function readBase64Image(value: unknown): Buffer | null {
  if (typeof value !== 'string' || value.length === 0) return null

  const base64 = value.includes(',') ? value.split(',').at(-1) : value
  if (!base64) return null

  const buffer = Buffer.from(base64, 'base64')
  return buffer.length > 0 ? buffer : null
}

function extractImageFromJson(value: unknown): Buffer | null {
  if (!isRecord(value)) return null

  const direct = readBase64Image(value.image)
  if (direct) return direct

  if (isRecord(value.result)) {
    const resultImage = readBase64Image(value.result.image)
    if (resultImage) return resultImage
  }

  return null
}

async function readCloudflareImageResponse(response: Response, modelId: string) {
  const contentType = response.headers.get('content-type') ?? ''

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new CloudflareImageGenerationError(modelId, response.status, body)
  }

  if (contentType.includes('image/')) {
    return Buffer.from(await response.arrayBuffer())
  }

  const text = await response.text()
  const data = JSON.parse(text) as unknown
  const buffer = extractImageFromJson(data)

  if (!buffer) {
    throw new CloudflareImageGenerationError(modelId, 502, text)
  }

  return buffer
}

async function runCloudflareImageModel(model: CloudflareImageModel, prompt: string, apiKey: string, accountId: string) {
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model.id}`
  const requestBody = buildCloudflareRequestBody(model, prompt)
  const headers = new Headers()
  headers.set('Authorization', `Bearer ${apiKey}`)
  headers.set('Accept', getCloudflareAcceptHeader(model))
  for (const [key, value] of Object.entries(requestBody.headers)) {
    headers.set(key, value)
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: requestBody.body,
  })

  return await readCloudflareImageResponse(response, model.id)
}

async function generateQuestionImage(question: GeneratedQuestion) {
  const apiKey = process.env.CLOUDFLARE_API_KEY
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID

  if (!apiKey || !accountId) {
    throw new Error('CLOUDFLARE_API_KEY / CLOUDFLARE_ACCOUNT_ID is not set')
  }

  const prompt = buildImagePrompt(question)
  let lastLimitError: CloudflareImageGenerationError | null = null

  for (const model of CLOUDFLARE_IMAGE_MODELS) {
    try {
      const buffer = await runCloudflareImageModel(model, prompt, apiKey, accountId)

      if (buffer.length === 0 || buffer.length > MAX_QUESTION_IMAGE_BYTES) {
        throw new Error(`Cloudflare image generation returned invalid image size from ${model.id}`)
      }

      return `data:${QUESTION_IMAGE_CONTENT_TYPE};base64,${buffer.toString('base64')}`
    } catch (error) {
      if (!isCloudflareLimitError(error)) {
        throw error
      }

      lastLimitError = error
      console.warn(
        `Cloudflare image model unavailable. Falling back from ${error.modelId} (${error.status}).`,
      )
    }
  }

  throw lastLimitError ?? new Error('Cloudflare image generation failed for all models')
}

async function addGeneratedImages(questions: GeneratedQuestion[], includeImage: boolean) {
  if (!includeImage) {
    return questions.map((question) => ({
      ...question,
      question_image_url: null,
      question_image_data_url: null,
    }))
  }

  const result: GeneratedQuestion[] = []
  for (const question of questions) {
    result.push({
      ...question,
      question_image_url: null,
      question_image_data_url: await generateQuestionImage(question),
    })
  }

  return result
}

function parseSavePayload(body: SaveGeneratedQuestionBody) {
  if (
    typeof body.category !== 'string' ||
    !categories.includes(body.category as GenerateCategory) ||
    typeof body.title !== 'string' ||
    typeof body.sender_name !== 'string' ||
    typeof body.sender_email !== 'string' ||
    typeof body.body !== 'string' ||
    typeof body.is_phishing !== 'boolean' ||
    typeof body.has_link !== 'boolean' ||
    typeof body.has_attachment !== 'boolean' ||
    !isRecord(body.explanation) ||
    typeof body.explanation.why_dangerous !== 'string' ||
    !isStringArray(body.explanation.warning_signals) ||
    typeof body.explanation.correct_action !== 'string'
  ) {
    return null
  }

  const phishingType =
    typeof body.phishing_type === 'string' || body.phishing_type === null
      ? body.phishing_type
      : null

  return {
    question: {
      category: body.category,
      title: body.title,
      sender_name: body.sender_name,
      sender_email: body.sender_email,
      body: body.body,
      is_phishing: body.is_phishing,
      phishing_type: body.is_phishing ? phishingType : null,
      has_link: body.has_link,
      dangerous_links: parseJsonArray(body.dangerous_links),
      has_attachment: body.has_attachment,
      dangerous_attachments: parseJsonArray(body.dangerous_attachments),
      is_decoy: typeof body.is_decoy === 'boolean' ? body.is_decoy : false,
      is_active: typeof body.is_active === 'boolean' ? body.is_active : true,
      safe_attachments: parseJsonArray(body.safe_attachments),
      question_image_url: typeof body.question_image_url === 'string' ? body.question_image_url : null,
    },
    questionImageDataUrl: body.question_image_data_url,
    explanation: {
      why_dangerous: body.explanation.why_dangerous,
      warning_signals: body.explanation.warning_signals,
      correct_action: body.explanation.correct_action,
    },
  }
}

router.post('/', async (req, res) => {
  const { category, count, isPhishing, includeImage } = req.body as GenerateRequestBody

  if (!category || !categories.includes(category)) {
    return res.status(400).json({ error: 'category must be student, company, or general' })
  }

  if (typeof count !== 'number' || !Number.isInteger(count) || count < 1 || count > 10) {
    return res.status(400).json({ error: 'count must be an integer from 1 to 10' })
  }

  if (typeof isPhishing !== 'boolean') {
    return res.status(400).json({ error: 'isPhishing must be boolean' })
  }

  if (typeof includeImage !== 'boolean') {
    return res.status(400).json({ error: 'includeImage must be boolean' })
  }

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
  }, 180_000)

  child.stdout.setEncoding('utf8')
  child.stderr.setEncoding('utf8')

  child.stdout.on('data', (chunk) => {
    stdout += chunk
  })

  child.stderr.on('data', (chunk) => {
    stderr += chunk
  })

  child.stdin.write(JSON.stringify({ category, count, isPhishing }))
  child.stdin.end()

  child.on('error', (error) => {
    if (responded) return
    responded = true
    clearTimeout(timeout)
    return res.status(500).json({ error: error.message })
  })

  child.on('close', async (code) => {
    if (responded) return
    responded = true
    clearTimeout(timeout)

    if (code !== 0) {
      const message = stderr.trim() || `Python process exited with code ${code}`
      return res.status(500).json({ error: message })
    }

    try {
      const generated = JSON.parse(stdout) as { questions?: GeneratedQuestion[] }
      if (!Array.isArray(generated.questions)) {
        return res.status(500).json({ error: 'Generator output must include questions' })
      }

      const questions = await addGeneratedImages(generated.questions, includeImage)
      return res.json({ questions })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to parse generator output'
      return res.status(500).json({ error: message })
    }
  })
})

router.post('/save', async (req, res) => {
  const payload = parseSavePayload(req.body as SaveGeneratedQuestionBody)

  if (!payload) {
    return res.status(400).json({ error: 'Invalid generated question payload' })
  }

  try {
    payload.question.question_image_url = await uploadQuestionImage(payload.questionImageDataUrl)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upload question image'
    return res.status(500).json({ error: message })
  }

  const { data: question, error: questionError } = await supabaseAdmin
    .from('questions')
    .insert(payload.question)
    .select('*')
    .single()

  if (questionError || !question) {
    return res.status(500).json({ error: questionError?.message ?? 'Failed to save question' })
  }

  const { data: explanation, error: explanationError } = await supabaseAdmin
    .from('question_explanations')
    .insert({
      ...payload.explanation,
      question_id: question.id,
    })
    .select('*')
    .single()

  if (explanationError || !explanation) {
    await supabaseAdmin
      .from('questions')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', question.id)

    return res
      .status(500)
      .json({ error: explanationError?.message ?? 'Failed to save explanation' })
  }

  return res.status(201).json({ question, explanation })
})

export default router
