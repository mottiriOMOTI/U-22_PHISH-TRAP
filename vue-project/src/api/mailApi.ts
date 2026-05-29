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
  phishing_type: string | null
  dangerous_links: DangerousLink[] | null
  dangerous_attachments: DangerousAttachment[] | null
  safe_attachments: SafeAttachment[] | null
  is_decoy: boolean
  is_active: boolean
  updated_at: string
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
