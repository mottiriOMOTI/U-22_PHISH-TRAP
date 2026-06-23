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
}

async function throwApiError(res: Response, fallbackMessage: string): Promise<never> {
  const body = await res.json().catch(() => null)
  throw new Error(body?.error ?? fallbackMessage)
}

export async function fetchAppSettings(): Promise<AppSettings> {
  const res = await fetch(`${API_BASE}/api/settings`)

  if (!res.ok) {
    return throwApiError(res, 'Failed to fetch settings')
  }

  const body = (await res.json()) as SettingsResponse
  return body.settings
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
  return body.settings
}

export async function resetLearningHistory(): Promise<ResetLearningHistoryResponse> {
  const res = await fetch(`${API_BASE}/api/settings/reset-learning`, {
    method: 'POST',
  })

  if (!res.ok) {
    return throwApiError(res, 'Failed to reset learning history')
  }

  return (await res.json()) as ResetLearningHistoryResponse
}
