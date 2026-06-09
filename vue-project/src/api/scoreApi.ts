const API_BASE = import.meta.env.VITE_API_URL ?? ''
const API_BASE_URL = `${API_BASE}/api/score`

export type ScoreSummary = {
  total_correct: number
  total_wrong: number
  total_unanswered: number
  total_questions: number
  accuracy: number
  session_count: number
}

async function throwApiError(res: Response, fallbackMessage: string): Promise<never> {
  const body = await res.json().catch(() => null)
  throw new Error(body?.error ?? fallbackMessage)
}

export async function fetchScore(userId: string): Promise<ScoreSummary> {
  const res = await fetch(`${API_BASE_URL}?userId=${userId}`)

  if (!res.ok) {
    return throwApiError(res, 'Failed to fetch score')
  }

  return await res.json()
}
