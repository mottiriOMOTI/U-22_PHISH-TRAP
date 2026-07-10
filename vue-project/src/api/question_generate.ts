import { invalidateMailListCache } from '@/api/mailApi'

const API_BASE = import.meta.env.VITE_API_URL ?? ''
const API_BASE_URL = `${API_BASE}/api/generate`

export type GenerateCategory = 'student' | 'company' | 'general'

export type GenerateQuestionPayload = {
  category: GenerateCategory
  count: number
  isPhishing: boolean
  includeImage: boolean
}

export type GeneratedDangerousLink = {
  url: string
  reason: string
}

export type GeneratedAttachment = {
  filename: string
  reason: string
}

export type GeneratedQuestionExplanation = {
  why_dangerous: string
  warning_signals: string[]
  correct_action: string
}

export type GeneratedQuestion = {
  id?: string
  category: GenerateCategory
  title: string
  sender_name: string
  sender_email: string
  body: string
  is_phishing: boolean
  phishing_type: 'credential_theft' | 'account_takeover' | 'malware_attachment' | null
  has_link: boolean
  dangerous_links: GeneratedDangerousLink[]
  has_attachment: boolean
  dangerous_attachments: GeneratedAttachment[]
  is_decoy: boolean
  is_active: boolean
  safe_attachments: GeneratedAttachment[]
  question_image_url?: string | null
  question_image_data_url?: string | null
  explanation: GeneratedQuestionExplanation
}

export type GeneratedQuestionSet = {
  questions: GeneratedQuestion[]
}

export type SavedGeneratedQuestion = {
  question: GeneratedQuestion & {
    id: string
    created_at: string | null
    updated_at?: string | null
  }
  explanation: GeneratedQuestionExplanation & {
    id: string
    question_id: string
    created_at: string | null
    updated_at: string | null
  }
}

async function throwApiError(res: Response, fallbackMessage: string): Promise<never> {
  const body = await res.json().catch(() => null)
  throw new Error(body?.error ?? fallbackMessage)
}

export async function generateQuestionExplanation(
  payload: GenerateQuestionPayload,
): Promise<GeneratedQuestionSet> {
  const res = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    return throwApiError(res, 'Failed to generate questions')
  }

  return await res.json()
}

export async function saveGeneratedQuestion(
  payload: GeneratedQuestion,
): Promise<SavedGeneratedQuestion> {
  const res = await fetch(`${API_BASE_URL}/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    return throwApiError(res, 'Failed to save generated question')
  }

  invalidateMailListCache()
  return await res.json()
}
