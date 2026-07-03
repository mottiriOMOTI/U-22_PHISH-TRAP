import { fetchAppSettings } from '@/api/settings'

export type AppNotificationLevel = 'info' | 'success' | 'warning' | 'error'

export type AppNotificationPayload = {
  title: string
  body?: string
  level?: AppNotificationLevel
  tag?: string
}

export type BrowserNotificationPermissionResult = NotificationPermission | 'unsupported'

export const APP_NOTIFICATION_EVENT = 'phish-trap:notification'

export type AppNotificationEvent = CustomEvent<AppNotificationPayload>

function hasWindow(): boolean {
  return typeof window !== 'undefined'
}

function hasBrowserNotification(): boolean {
  return hasWindow() && 'Notification' in window
}

function emitInAppNotification(payload: AppNotificationPayload) {
  if (!hasWindow()) return

  window.dispatchEvent(
    new CustomEvent<AppNotificationPayload>(APP_NOTIFICATION_EVENT, {
      detail: {
        level: 'info',
        ...payload,
      },
    }),
  )
}

function showBrowserNotification(payload: AppNotificationPayload) {
  if (!hasBrowserNotification() || Notification.permission !== 'granted') return

  const notification = new Notification(payload.title, {
    body: payload.body,
    tag: payload.tag,
  })

  window.setTimeout(() => {
    notification.close()
  }, 6000)
}

export async function ensureBrowserNotificationPermission(): Promise<BrowserNotificationPermissionResult> {
  if (!hasBrowserNotification()) {
    return 'unsupported'
  }

  if (Notification.permission !== 'default') {
    return Notification.permission
  }

  return await Notification.requestPermission()
}

export async function notifyWhenEnabled(payload: AppNotificationPayload): Promise<void> {
  try {
    const settings = await fetchAppSettings()

    if (!settings.notificationsEnabled) {
      return
    }

    emitInAppNotification(payload)
    showBrowserNotification(payload)
  } catch (error) {
    console.error('notification error:', error)
  }
}
