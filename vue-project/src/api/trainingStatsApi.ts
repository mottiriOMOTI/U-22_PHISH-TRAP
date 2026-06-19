const API_BASE = import.meta.env.VITE_API_URL ?? ''
const API_BASE_URL = `${API_BASE}/api/trainingStats`

export type Scenario = 'business' | 'school' | 'daily'
export type QuestionAccuracy = {
  question: string
  accuracy: number
}

async function throwApiError(res: Response, fallbackMessage: string): Promise<never> {
  const body = await res.json().catch(() => null)
  throw new Error(body?.error ?? fallbackMessage)
}

export async function fetchAverageAccuracy(scenario?: Scenario): Promise<number> {
  const url = scenario ? `${API_BASE_URL}/averageAccuracy?scenario=${scenario}` : `${API_BASE_URL}/averageAccuracy`
  const res = await fetch(url)

  if (!res.ok) {
    return throwApiError(res, 'Failed to fetch average accuracy')
  }

  const body = await res.json()
  return body.accuracy ?? 0
}

export async function fetchQuestionAccuracy(scenario?: Scenario): Promise<QuestionAccuracy[]> {
  const url = scenario ? `${API_BASE_URL}/questionAccuracy?scenario=${scenario}` : `${API_BASE_URL}/questionAccuracy`
  const res = await fetch(url)

  if (!res.ok) {
    return throwApiError(res, 'Failed to fetch question accuracy')
  }

  const body = await res.json()
  return body.accuracies ?? []
}
