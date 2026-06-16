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

export type AverageScoreUserSummary = ScoreSummary & {
  rank: number
  label: string
}

export type AverageScoreDistribution = {
  excellent: number
  good: number
  needs_review: number
}

export type AverageScoreSummary = ScoreSummary & {
  total_users: number
  average_user_accuracy: number
  distribution: AverageScoreDistribution
  users: AverageScoreUserSummary[]
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

export async function fetchAverageScoreStats(): Promise<AverageScoreSummary> {
  const res = await fetch(`${API_BASE_URL}/average`)

  if (!res.ok) {
    return throwApiError(res, 'Failed to fetch average score stats')
  }

  return await res.json()
}
