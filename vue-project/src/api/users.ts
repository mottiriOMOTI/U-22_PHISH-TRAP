const API_BASE_URL = '/api/supabasetest'

export type user_role = 'admin' | 'learner'
<<<<<<< HEAD
export type scenario = 'student' | 'adult' | 'general'

export type User = {
  id: string                      //ユーザーID
  user_name: string               //名前
  email: string                   //メールアドレス
  password_hash: string           //パスワードのハッシュ値
  role: user_role                 //管理者判定
  current_scenario: scenario      //シチュエーション設定
  created_at: string              //アカウント作成日時  
  last_active_at: string | null   //最後のアクティブ日時
  is_active: boolean              //アカウント有効性確認
}

async function throwApiError(res: Response, fallbackMessage: string): Promise<never> {
  const body = await res.json().catch(() => null)
  throw new Error(body?.error ?? fallbackMessage)
}

export async function fetchItems(): Promise<User[]> {
  const res = await fetch(API_BASE_URL)

  if (!res.ok) {
    return throwApiError(res, 'Failed to fetch profiles')
  }

  return await res.json()
}

export async function fetchItem(id: string): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/${id}`)

  if (!res.ok) {
    return throwApiError(res, 'Failed to fetch profile')
  }

  return await res.json()
}

export async function createItem(user_name: string): Promise<User> {
  const res = await fetch(API_BASE_URL, {
=======
export type scenario = 'school' | 'student' | 'adult' | 'general'

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
>>>>>>> yuta
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
<<<<<<< HEAD
    body: JSON.stringify({ user_name }),
  })

  if (!res.ok) {
    return throwApiError(res, 'Failed to create profile')
  }

  return await res.json()
}

export async function updateItem(id: string, user_name: string): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_name }),
  })

  if (!res.ok) {
    return throwApiError(res, 'Failed to update profile')
  }

  return await res.json()
}

export async function deleteItem(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
  })

  if (!res.ok) {
    return throwApiError(res, 'Failed to delete profile')
  }
}

// ログインをお願いする関数
export async function loginUser(email: string, password_hash: string): Promise<User> {
  const res = await fetch(`https://ijluptjauhyhdswzrojk.supabase.co/rest/v1/users/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    // メールアドレスとパスワードをウェイターに渡す
=======
>>>>>>> yuta
    body: JSON.stringify({ email, password_hash }),
  })

  if (!res.ok) {
    return throwApiError(res, 'ログインに失敗しました')
  }

<<<<<<< HEAD
  // 成功したら、ユーザー情報が返ってくる
  return await res.json()
}

// 新規アカウントを作成する関数
export async function registerUser(name: string, email: string, password: string): Promise<User> {
  // 新規登録用のURL（ /register や /users）
  const res = await fetch(`https://ijluptjauhyhdswzrojk.supabase.co/rest/v1/users/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    // 名前、メール、パスワードをバックエンド（ウェイター）に渡す
    body: JSON.stringify({ user_name: name, email, password_hash: password }),
=======
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
>>>>>>> yuta
  })

  if (!res.ok) {
    return throwApiError(res, 'アカウントの作成に失敗しました')
  }

  return await res.json()
<<<<<<< HEAD
}
=======
}
>>>>>>> yuta
