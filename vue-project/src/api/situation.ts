const API_BASE = import.meta.env.VITE_API_URL ?? ''

export type SituationId = 'business' | 'school' | 'daily'

export type SituationOption = {
  id: SituationId
  title: string
  icon: string
  description: string
  examples: string[]
  fearEffect: string
  wrongJudgement: string
}

export type SituationState = {
  selectedScenarioId: SituationId
}

type SituationResponse = {
  ok: boolean
  situation: SituationState
}

async function throwApiError(res: Response, fallbackMessage: string): Promise<never> {
  const body = await res.json().catch(() => null)
  throw new Error(body?.error ?? fallbackMessage)
}

export async function fetchSituation(): Promise<SituationState> {
  const res = await fetch(`${API_BASE}/api/situation`)

  if (!res.ok) {
    return throwApiError(res, 'Failed to fetch situation')
  }

  const body = (await res.json()) as SituationResponse
  return body.situation
}

export async function saveSituation(selectedScenarioId: SituationId): Promise<SituationState> {
  const res = await fetch(`${API_BASE}/api/situation`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ selectedScenarioId }),
  })

  if (!res.ok) {
    return throwApiError(res, 'Failed to save situation')
  }

  const body = (await res.json()) as SituationResponse
  return body.situation
}
