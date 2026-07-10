import { invalidateUserAnswerStateCache } from '@/api/userAnswers'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

export type ThemeColor = 0 | 1 | 2

export type AppSettings = {
  soundEnabled: boolean
  notificationsEnabled: boolean
  fearEffectEnabled: boolean
  themeColor: ThemeColor
  autoGenerateEnabled?: boolean
  dataCollectionEnabled?: boolean
}

type SettingsResponse = {
  ok: boolean
  settings: AppSettings
}

type ResetLearningHistoryResponse = {
  ok: boolean
  resetAt: string
  scenario: LearningScenario
}

export type LearningScenario = 'business' | 'school' | 'daily'

export const LEARNING_HISTORY_RESET_EVENT = 'phish-trap-learning-history-reset'
const SETTINGS_CACHE_TTL_MS = 15_000

let cachedSettings: AppSettings | null = null
let cachedSettingsAt = 0
let pendingSettingsRequest: Promise<AppSettings> | null = null

async function throwApiError(res: Response, fallbackMessage: string): Promise<never> {
  const body = await res.json().catch(() => null)
  throw new Error(body?.error ?? fallbackMessage)
}

export async function fetchAppSettings(): Promise<AppSettings> {
  if (cachedSettings && Date.now() - cachedSettingsAt < SETTINGS_CACHE_TTL_MS) {
    return cachedSettings
  }

  if (pendingSettingsRequest) return pendingSettingsRequest

  pendingSettingsRequest = (async () => {
    const res = await fetch(`${API_BASE}/api/settings`)

    if (!res.ok) {
      return throwApiError(res, 'Failed to fetch settings')
    }

    const body = (await res.json()) as SettingsResponse
    cachedSettings = body.settings
    cachedSettingsAt = Date.now()
    return body.settings
  })()

  try {
    return await pendingSettingsRequest
  } finally {
    pendingSettingsRequest = null
  }
}

export async function saveAppSettings(settings: AppSettings): Promise<AppSettings> {
  const res = await fetch(`${API_BASE}/api/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  })

  if (!res.ok) {
    return throwApiError(res, 'Failed to save settings')
  }

  const body = (await res.json()) as SettingsResponse
  cachedSettings = body.settings
  cachedSettingsAt = Date.now()
  return body.settings
}

export async function resetLearningHistory(
  userId: string,
  scenario: LearningScenario,
): Promise<ResetLearningHistoryResponse> {
  const res = await fetch(`${API_BASE}/api/settings/reset-learning`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, scenario }),
  })

  if (!res.ok) {
    return throwApiError(res, 'Failed to reset learning history')
  }

  const result = (await res.json()) as ResetLearningHistoryResponse
  invalidateUserAnswerStateCache(userId)

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(LEARNING_HISTORY_RESET_EVENT, { detail: { scenario } }))
  }

  return result
}
