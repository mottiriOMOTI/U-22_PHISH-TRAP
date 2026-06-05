const API_BASE = import.meta.env.VITE_API_URL ?? ''
const API_BASE_URL = `${API_BASE}/api/generate`

export type GenerateQuestionExplanationPayload = {
  questionText: string
}

export type GeneratedQuestionExplanation = {
  title: string
  why_dangerous: string
  warning_signals: string[]
  correct_action: string
}

async function throwApiError(res: Response, fallbackMessage: string): Promise<never> {
  const body = await res.json().catch(() => null)
  throw new Error(body?.error ?? fallbackMessage)
}

export async function generateQuestionExplanation(
  payload: GenerateQuestionExplanationPayload,
): Promise<GeneratedQuestionExplanation> {
  const res = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    return throwApiError(res, 'Failed to generate question explanation')
  }

  return await res.json()
}
