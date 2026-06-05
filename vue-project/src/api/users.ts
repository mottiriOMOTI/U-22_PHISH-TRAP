const API_BASE_URL = '/api/supabasetest'

export type user_role = 'admin' | 'learner'
export type scenario = 'school' | 'student' | 'business' | 'general'

export type User = {
  id: string
  name: string
  email: string
  password_hash: string
  role: user_role
  current_scenario: scenario | null
  created_at: string
  last_active_at: string | null
  is_active: boolean
}

type ApiErrorBody = {
  error?: unknown
  message?: unknown
}

async function throwApiError(res: Response, fallbackMessage: string): Promise<never> {
  const textBody = await res
    .clone()
    .text()
    .catch(() => '')
  const body = (await res.json().catch(() => null)) as ApiErrorBody | null
  const nonJsonMessage = textBody.trim().slice(0, 200)
  const message =
    typeof body?.error === 'string'
      ? body.error
      : typeof body?.message === 'string'
        ? body.message
        : nonJsonMessage
          ? `${fallbackMessage}: ${nonJsonMessage}`
          : `${fallbackMessage} (${res.status} ${res.statusText})`

  throw new Error(message)
}

async function hashPassword(rawPassword: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(rawPassword)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))

  return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function loginUser(email: string, password: string): Promise<User> {
  const password_hash = await hashPassword(password)
  const res = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password_hash }),
  })

  if (!res.ok) {
    return throwApiError(res, 'ログインに失敗しました')
  }

  return await res.json()
}

export async function registerUser(name: string, email: string, password: string): Promise<User> {
  const password_hash = await hashPassword(password)
  const res = await fetch(`${API_BASE_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, password_hash }),
  })

  if (!res.ok) {
    return throwApiError(res, 'アカウントの作成に失敗しました')
  }

  return await res.json()
}
