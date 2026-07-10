const API_BASE = import.meta.env.VITE_API_URL ?? ''
const API_BASE_URL = `${API_BASE}/api/supabasetest/user-answers`
const ANSWER_STATE_CACHE_TTL_MS = 10_000

const answerStateCache = new Map<string, { expiresAt: number; data: UserAnswerSummary[] }>()
const pendingAnswerStateRequests = new Map<string, Promise<UserAnswerSummary[]>>()

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
  const cached = answerStateCache.get(userId)
  if (cached && cached.expiresAt > Date.now()) {
    if (questionIds.length === 0) return cached.data
    const requestedIds = new Set(questionIds)
    return cached.data.filter((answer) => requestedIds.has(answer.question_id))
  }

  if (questionIds.length === 0) {
    const pending = pendingAnswerStateRequests.get(userId)
    if (pending) return pending
  }

  const params = new URLSearchParams({ user_id: userId })

  if (questionIds.length > 0) {
    params.set('question_ids', questionIds.join(','))
  }

  const request = (async () => {
    const res = await fetch(`${API_BASE_URL}?${params.toString()}`)

    if (!res.ok) {
      return throwApiError(res, 'Failed to fetch user answer states')
    }

    const data = (await res.json()) as UserAnswerSummary[]
    if (questionIds.length === 0) {
      answerStateCache.set(userId, {
        expiresAt: Date.now() + ANSWER_STATE_CACHE_TTL_MS,
        data,
      })
    }
    return data
  })()

  if (questionIds.length === 0) pendingAnswerStateRequests.set(userId, request)
  try {
    return await request
  } finally {
    if (questionIds.length === 0) pendingAnswerStateRequests.delete(userId)
  }
}

export function invalidateUserAnswerStateCache(userId?: string): void {
  if (userId) {
    answerStateCache.delete(userId)
    return
  }
  answerStateCache.clear()
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

  invalidateUserAnswerStateCache(payload.user_id)
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

  invalidateUserAnswerStateCache(userId)
  return (await res.json()) as { ok: boolean; data: UserAnswerResponse[] }
}
