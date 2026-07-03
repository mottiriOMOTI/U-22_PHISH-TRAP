import type { ThemeColor } from '@/api/settings'

export type { ThemeColor }

export const DEFAULT_THEME_COLOR: ThemeColor = 0

export function normalizeThemeColor(value: unknown): ThemeColor {
  return value === 1 || value === 2 ? value : DEFAULT_THEME_COLOR
}

export function applyThemeColor(value: unknown) {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.dataset.appThemeColor = String(normalizeThemeColor(value))
}
