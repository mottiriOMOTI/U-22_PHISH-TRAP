const API_BASE = import.meta.env.VITE_API_URL ?? ''
const API_BASE_URL = `${API_BASE}/api/mail`

export type Scenario = 'business' | 'school' | 'daily'
export type Category = 'student' | 'company' | 'general'

export type MailListItem = {
  id: string
  category: Category
  title: string
  sender_name: string
  sender_email: string
  body: string
  is_phishing: boolean
  phishing_type: string | null
  has_link: boolean
  has_attachment: boolean
  created_at: string
}

export type DangerousLink = {
  url: string
  reason: string
}

export type DangerousAttachment = {
  filename: string
  reason: string
}

export type SafeAttachment = {
  filename: string
}

export type MailDetail = MailListItem & {
  dangerous_links: DangerousLink[] | null
  dangerous_attachments: DangerousAttachment[] | null
  safe_attachments: SafeAttachment[] | null
  is_decoy: boolean
  is_active: boolean
  updated_at: string
}

export type UpdateMailPayload = {
  title: string
  sender_name: string
  sender_email: string
  body: string
  is_phishing: boolean
  phishing_type: string | null
  has_link: boolean
  has_attachment: boolean
}

export type QuestionExplanation = {
  id: string
  question_id: string
  why_dangerous: string
  warning_signals: string[]
  correct_action: string
  created_at: string | null
  updated_at: string | null
}

export type SaveQuestionExplanationPayload = {
  why_dangerous: string
  warning_signals: string[]
  correct_action: string
}

async function throwApiError(res: Response, fallbackMessage: string): Promise<never> {
  const body = await res.json().catch(() => null)
  throw new Error(body?.error ?? fallbackMessage)
}

export async function fetchMails(scenario?: Scenario): Promise<MailListItem[]> {
  const url = scenario ? `${API_BASE_URL}?scenario=${scenario}` : API_BASE_URL
  const res = await fetch(url)

  if (!res.ok) {
    return throwApiError(res, 'Failed to fetch mails')
  }

  return await res.json()
}

export async function fetchMail(id: string): Promise<MailDetail> {
  const res = await fetch(`${API_BASE_URL}/${id}`)

  if (!res.ok) {
    return throwApiError(res, 'Failed to fetch mail')
  }

  return await res.json()
}

export async function updateMailQuestion(
  id: string,
  payload: UpdateMailPayload,
): Promise<MailListItem> {
  const res = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    return throwApiError(res, 'Failed to update mail')
  }

  return await res.json()
}

export async function deleteMailQuestion(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
  })

  if (!res.ok) {
    return throwApiError(res, 'Failed to delete mail')
  }
}

export async function fetchQuestionExplanation(
  questionId: string,
): Promise<QuestionExplanation | null> {
  const res = await fetch(`${API_BASE_URL}/${questionId}/explanation`)

  if (!res.ok) {
    return throwApiError(res, 'Failed to fetch explanation')
  }

  return await res.json()
}

export async function saveQuestionExplanation(
  questionId: string,
  payload: SaveQuestionExplanationPayload,
): Promise<QuestionExplanation> {
  const res = await fetch(`${API_BASE_URL}/${questionId}/explanation`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    return throwApiError(res, 'Failed to save explanation')
  }

  return await res.json()
}
