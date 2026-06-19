const API_BASE = import.meta.env.VITE_API_URL ?? ''
const API_BASE_URL = `${API_BASE}/api/adminStats`

export type Scenario = 'business' | 'school' | 'daily'

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
