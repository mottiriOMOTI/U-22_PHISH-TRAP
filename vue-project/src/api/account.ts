const API_BASE = import.meta.env.VITE_API_URL ?? ''

export type AccountProfile = {
  email: string
  joinedAt: string
  rank: string
}

export type AccountStats = {
  completedTrainings: number
  totalLearningMinutes: number | null
  averageAccuracy: number | null
}

export type AccountSummary = {
  profile: AccountProfile
  stats: AccountStats
}

type AccountSummaryResponse = {
  ok: boolean
  account: AccountSummary
}

async function throwApiError(res: Response, fallbackMessage: string): Promise<never> {
  const body = await res.json().catch(() => null)
  throw new Error(body?.error ?? fallbackMessage)
}

export async function fetchAccountSummary(): Promise<AccountSummary> {
  const res = await fetch(`${API_BASE}/api/account`)

  if (!res.ok) {
    return throwApiError(res, 'Failed to fetch account')
  }

  const body = (await res.json()) as AccountSummaryResponse
  return body.account
}
