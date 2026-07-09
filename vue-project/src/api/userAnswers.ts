const API_BASE = import.meta.env.VITE_API_URL ?? ''
const API_BASE_URL = `${API_BASE}/api/supabasetest/user-answers`

export type ActionType = 'reported' | 'clicked_link' | 'downloaded_attachment' | 'replied' | 'ignored'

export type SaveAnswerPayload = {
  user_id: string
  question_id: string
  action_type: ActionType
  is_correct: boolean
}

export type UserAnswerResponse = {
  id?: string
  user_id: string
  question_id: string
  action_type: ActionType
  is_correct: boolean
  answered_at?: string
  effect_flag?: boolean
}

export type UserAnswerSummary = {
  question_id: string
  effect_flag: boolean | null
  is_correct: boolean | null
}

async function throwApiError(res: Response, fallbackMessage: string): Promise<never> {
  const body = await res.json().catch(() => null)
  throw new Error(body?.error ?? `${fallbackMessage} (${res.status})`)
}

export async function fetchUserAnswerStates(
  userId: string,
  questionIds: string[] = [],
): Promise<UserAnswerSummary[]> {
  const params = new URLSearchParams({ user_id: userId })

  if (questionIds.length > 0) {
    params.set('question_ids', questionIds.join(','))
  }

  const res = await fetch(`${API_BASE_URL}?${params.toString()}`)

  if (!res.ok) {
    return throwApiError(res, 'Failed to fetch user answer states')
  }

  return (await res.json()) as UserAnswerSummary[]
}

export async function saveUserAnswer(payload: SaveAnswerPayload): Promise<UserAnswerResponse> {
  const res = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    return throwApiError(res, 'Failed to save user answer')
  }

  return (await res.json()) as UserAnswerResponse
}

export async function markEffectAsPlayed(
  questionId: string,
  userId: string,
): Promise<{ ok: boolean; data: UserAnswerResponse[] }> {
  const res = await fetch(`${API_BASE_URL}/effect-flag`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question_id: questionId, user_id: userId, effect_flag: true }),
  })

  if (!res.ok) {
    return throwApiError(res, 'Failed to update effect flag')
  }

  return (await res.json()) as { ok: boolean; data: UserAnswerResponse[] }
}
