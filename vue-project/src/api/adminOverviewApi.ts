const API_BASE = import.meta.env.VITE_API_URL ?? ''
const API_BASE_URL = `${API_BASE}/api/adminStats`

export type Scenario = 'business' | 'school' | 'daily'
export type Role = 'learner' | 'admin'

export type LearnerCounts = Record<Scenario | 'total', number>
export type AverageAccuracies = Record<Scenario | 'total', number>

export type AdminOverviewUser = {
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

export type AdminOverviewSummary = {
  learnerCounts: LearnerCounts
  averageAccuracies: AverageAccuracies
  users: AdminOverviewUser[]
}

async function throwApiError(res: Response, fallbackMessage: string): Promise<never> {
  const body = await res.json().catch(() => null)
  throw new Error(body?.error ?? fallbackMessage)
}

export async function fetchLearnerCount(scenario?: Scenario): Promise<number> {
  const url = scenario ? `${API_BASE_URL}/learnerCount?scenario=${scenario}` : `${API_BASE_URL}/learnerCount`
  const res = await fetch(url)

  if (!res.ok) {
    return throwApiError(res, 'Failed to fetch learner count')
  }

  const body = await res.json()
  return body.total ?? 0
}

export async function fetchAdminOverviewSummary(): Promise<AdminOverviewSummary> {
  const res = await fetch(`${API_BASE_URL}/overview`)

  if (!res.ok) {
    return throwApiError(res, 'Failed to fetch admin overview')
  }

  return await res.json()
}
