const API_BASE = import.meta.env.VITE_API_URL ?? ''
const API_BASE_URL = `${API_BASE}/api/usersList`

export type Scenario = 'business' | 'school' | 'daily'
export type Role = 'learner' | 'admin'

export type UserListItem = {
  id: string
  email: string
  name: string
  role: Role
  current_scenario: Scenario
  last_active_at: string | null
  is_active: boolean
  latest_correct_count: number | null
  latest_total_questions: number | null
}

async function throwApiError(res: Response, fallbackMessage: string): Promise<never> {
  const body = await res.json().catch(() => null)
  throw new Error(body?.error ?? fallbackMessage)
}

export async function fetchUsers(scenario?: Scenario): Promise<UserListItem[]> {
  const url = scenario ? `${API_BASE_URL}?scenario=${scenario}` : API_BASE_URL
  const res = await fetch(url)

  if (!res.ok) {
    return throwApiError(res, 'Failed to fetch users')
  }

  return await res.json()
}

