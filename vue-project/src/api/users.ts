const API_BASE_URL = '/api/supabasetest'

export type user_role = 'admin' | 'learner'
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
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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
    body: JSON.stringify({ email, password_hash }),
  })

  if (!res.ok) {
    return throwApiError(res, 'ログインに失敗しました')
  }

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
  })

  if (!res.ok) {
    return throwApiError(res, 'アカウントの作成に失敗しました')
  }

  return await res.json()
}