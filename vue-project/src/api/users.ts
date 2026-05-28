const API_BASE_URL = '/api/supabasetest'

export type user_role = 'admin' | 'learner'

export type User = {
  id: string
  user_name: string | null
  email: string 
  passwordhash: string 
  role: user_role
  created_at: string
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
