const API_BASE_URL = '/api/supabasetest'

export type user_role = 'admin' | 'learner'
export type scenario = 'business' | 'school' | 'daily'

export type User = {
  id: string
  name: string
  email: string
  role: user_role
  current_scenario: scenario | null
  created_at: string
  last_active_at: string | null
  is_active: boolean
  image: string | null
}

export type CurrentUser = User

export type PasswordResetRequestResponse = {
  ok: boolean
  message: string
}

export type PasswordResetConfirmResponse = {
  ok: boolean
}

type ApiErrorBody = {
  error?: unknown
  message?: unknown
}

const CURRENT_USER_STORAGE_KEY = 'phish-trap-current-user'

function toCurrentUser(user: User): CurrentUser {
  return user
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

export type UpdateCurrentUserPasswordInput = {
  id: string
  currentPassword: string
  newPassword: string
}

export type CreateAdminUserInput = {
  name: string
  email: string
  password: string
  creatorUserId: string
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

async function loginWithRole(role: user_role, email: string, password: string): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/login/${role}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    return throwApiError(res, 'ログインに失敗しました')
  }

  const user = (await res.json()) as User
  saveCurrentUser(user)

  return user
}

export async function loginLearner(email: string, password: string): Promise<User> {
  return loginWithRole('learner', email, password)
}

export async function loginAdmin(email: string, password: string): Promise<User> {
  return loginWithRole('admin', email, password)
}

export async function loginUser(email: string, password: string): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    return throwApiError(res, 'ログインに失敗しました')
  }

  const user = (await res.json()) as User
  saveCurrentUser(user)

  return user
}

export async function registerUser(name: string, email: string, password: string): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, password }),
  })

  if (!res.ok) {
    return throwApiError(res, 'アカウントの作成に失敗しました')
  }

  const user = (await res.json()) as User
  saveCurrentUser(user)

  return user
}

export async function createAdminUser(input: CreateAdminUserInput): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    return throwApiError(res, '管理者アカウントの作成に失敗しました')
  }

  return (await res.json()) as User
}

export function validateNewPassword(
  password: string,
  context: { email?: string; name?: string } = {},
): string | null {
  if (password.length < 12) {
    return 'パスワードは12文字以上にしてください。'
  }

  if (password.length > 128) {
    return 'パスワードは128文字以内にしてください。'
  }

  if (/\s/.test(password)) {
    return 'パスワードに空白文字は使用できません。'
  }

  if (
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[^A-Za-z0-9]/.test(password)
  ) {
    return 'パスワードには英大文字・英小文字・数字・記号をすべて含めてください。'
  }

  const lowerPassword = password.toLowerCase()
  const emailLocalPart = context.email?.split('@')[0]?.trim().toLowerCase()
  const name = context.name?.trim().toLowerCase()

  if (
    ['password', 'password1', 'password123', 'qwerty123', 'admin123', '123456789'].includes(
      lowerPassword,
    )
  ) {
    return '推測されやすいパスワードは使用できません。'
  }

  if (emailLocalPart && emailLocalPart.length >= 4 && lowerPassword.includes(emailLocalPart)) {
    return 'メールアドレスに含まれる文字列をパスワードに含めないでください。'
  }

  if (name && name.length >= 4 && lowerPassword.includes(name)) {
    return '名前に含まれる文字列をパスワードに含めないでください。'
  }

  return null
}

export async function requestPasswordReset(email: string): Promise<PasswordResetRequestResponse> {
  const res = await fetch(`${API_BASE_URL}/password-reset/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  })

  if (!res.ok) {
    return throwApiError(res, 'パスワード再設定の受付に失敗しました')
  }

  return (await res.json()) as PasswordResetRequestResponse
}

export async function confirmPasswordReset(
  token: string,
  password: string,
): Promise<PasswordResetConfirmResponse> {
  const res = await fetch(`${API_BASE_URL}/password-reset/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, password }),
  })

  if (!res.ok) {
    return throwApiError(res, 'パスワードの再設定に失敗しました')
  }

  return (await res.json()) as PasswordResetConfirmResponse
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

export async function updateCurrentUserPassword({
  id,
  currentPassword,
  newPassword,
}: UpdateCurrentUserPasswordInput): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(id)}/password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  })

  if (!res.ok) {
    return throwApiError(res, 'パスワードの変更に失敗しました')
  }
}

export async function updateCurrentUserScenario(
  id: string,
  current_scenario: scenario,
): Promise<CurrentUser> {
  const res = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(id)}/scenario`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ current_scenario }),
  })

  if (!res.ok) {
    return throwApiError(res, 'シチュエーションの更新に失敗しました')
  }

  const user = (await res.json()) as User
  return saveCurrentUser(user)
}
