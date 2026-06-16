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
image: string | null
}

export type CurrentUser = Omit<User, 'password_hash'>

type ApiErrorBody = {
error?: unknown
message?: unknown
}

const CURRENT_USER_STORAGE_KEY = 'phish-trap-current-user'

function toCurrentUser(user: User): CurrentUser {
const { password_hash: _passwordHash, ...currentUser } = user
return currentUser
}

export function saveCurrentUser(user: User): CurrentUser {
const currentUser = toCurrentUser(user)

if (typeof localStorage !== 'undefined') {
  localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(currentUser))
}

return currentUser
}

export function getCurrentUser(): CurrentUser | null {
if (typeof localStorage === 'undefined') {
  return null
}

const rawUser = localStorage.getItem(CURRENT_USER_STORAGE_KEY)

if (!rawUser) {
  return null
}

try {
  const user = JSON.parse(rawUser) as Partial<CurrentUser>

  if (
    typeof user.id !== 'string' ||
    typeof user.email !== 'string' ||
    typeof user.created_at !== 'string'
  ) {
    return null
  }

  return {
    id: user.id,
    name: typeof user.name === 'string' ? user.name : '',
    email: user.email,
    role: user.role === 'admin' ? 'admin' : 'learner',
    current_scenario: user.current_scenario ?? null,
    created_at: user.created_at,
    last_active_at: user.last_active_at ?? null,
    is_active: user.is_active !== false,
    image: typeof user.image === 'string' ? user.image : null,
  }
} catch {
  return null
}
}

export function clearCurrentUser() {
if (typeof localStorage !== 'undefined') {
  localStorage.removeItem(CURRENT_USER_STORAGE_KEY)
}
}

export type UpdateCurrentUserProfileInput = {
id: string
name: string
email: string
}

const MAX_USER_IMAGE_BYTES = 2 * 1024 * 1024
const ALLOWED_USER_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

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

function readFileAsDataUrl(file: File): Promise<string> {
return new Promise((resolve, reject) => {
  const reader = new FileReader()

  reader.addEventListener('load', () => {
    if (typeof reader.result === 'string') {
      resolve(reader.result)
      return
    }

    reject(new Error('画像ファイルの読み込みに失敗しました'))
  })

  reader.addEventListener('error', () => {
    reject(new Error('画像ファイルの読み込みに失敗しました'))
  })

  reader.readAsDataURL(file)
})
}

export function validateUserImageFile(file: File): string | null {
if (!ALLOWED_USER_IMAGE_TYPES.includes(file.type)) {
  return '画像は JPEG / PNG / WebP / GIF を選択してください'
}

if (file.size > MAX_USER_IMAGE_BYTES) {
  return '画像は 2MB 以下にしてください'
}

return null
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

const user = (await res.json()) as User
saveCurrentUser(user)

return user
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

const user = (await res.json()) as User
saveCurrentUser(user)

return user
}

export async function fetchCurrentUserById(id: string): Promise<CurrentUser> {
const res = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(id)}`)

if (!res.ok) {
  return throwApiError(res, 'ユーザー情報の取得に失敗しました')
}

const user = (await res.json()) as User
return saveCurrentUser(user)
}

export async function updateCurrentUserImage(id: string, file: File): Promise<CurrentUser> {
const validationError = validateUserImageFile(file)

if (validationError) {
  throw new Error(validationError)
}

const dataUrl = await readFileAsDataUrl(file)
const res = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(id)}/image`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    contentType: file.type,
    dataUrl,
  }),
})

if (!res.ok) {
  return throwApiError(res, 'アイコン画像のアップロードに失敗しました')
}

const user = (await res.json()) as User
return saveCurrentUser(user)
}

export async function updateCurrentUserProfile({
id,
name,
email,
}: UpdateCurrentUserProfileInput): Promise<CurrentUser> {
const res = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(id)}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ name, email }),
})

if (!res.ok) {
  return throwApiError(res, 'アカウント情報の更新に失敗しました')
}

const user = (await res.json()) as User
return saveCurrentUser(user)
}
