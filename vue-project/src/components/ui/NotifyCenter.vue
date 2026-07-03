<template>
  <Teleport to="body">
    <div
      v-if="notifications.length > 0"
      class="app-notification-stack"
      aria-live="polite"
      aria-atomic="false"
    >
      <article
        v-for="notification in notifications"
        :key="notification.id"
        :class="['app-notification', `app-notification--${notification.level}`]"
      >
        <v-icon :icon="iconFor(notification.level)" class="app-notification__icon" />

        <div class="app-notification__content">
          <strong>{{ notification.title }}</strong>
          <p v-if="notification.body">{{ notification.body }}</p>
        </div>

        <button
          class="app-notification__close"
          type="button"
          aria-label="通知を閉じる"
          title="通知を閉じる"
          @click="dismiss(notification.id)"
        >
          <v-icon icon="mdi-close" />
        </button>
      </article>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

import {
  APP_NOTIFICATION_EVENT,
  type AppNotificationEvent,
  type AppNotificationLevel,
} from '@/lib/notifications'

type ActiveNotification = {
  id: number
  title: string
  body?: string
  level: AppNotificationLevel
  timeoutId: number
}

const notifications = ref<ActiveNotification[]>([])
let nextId = 1

function iconFor(level: AppNotificationLevel): string {
  switch (level) {
    case 'success':
      return 'mdi-check-circle-outline'
    case 'warning':
      return 'mdi-alert-outline'
    case 'error':
      return 'mdi-alert-circle-outline'
    default:
      return 'mdi-bell-outline'
  }
}

function dismiss(id: number) {
  const notification = notifications.value.find((item) => item.id === id)

  if (notification) {
    window.clearTimeout(notification.timeoutId)
  }

  notifications.value = notifications.value.filter((item) => item.id !== id)
}

function addNotification(event: Event) {
  const { title, body, level = 'info' } = (event as AppNotificationEvent).detail
  const id = nextId++
  const timeoutId = window.setTimeout(() => dismiss(id), 6000)
  const nextNotifications = [
    {
      id,
      title,
      body,
      level,
      timeoutId,
    },
    ...notifications.value,
  ]
  const visibleNotifications = nextNotifications.slice(0, 4)
  const droppedNotifications = nextNotifications.slice(4)

  droppedNotifications.forEach((notification) => window.clearTimeout(notification.timeoutId))
  notifications.value = visibleNotifications
}

onMounted(() => {
  window.addEventListener(APP_NOTIFICATION_EVENT, addNotification)
})

onBeforeUnmount(() => {
  window.removeEventListener(APP_NOTIFICATION_EVENT, addNotification)
  notifications.value.forEach((notification) => window.clearTimeout(notification.timeoutId))
})
</script>

<style scoped>
.app-notification-stack {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 3000;
  display: grid;
  width: min(360px, calc(100vw - 32px));
  gap: 10px;
  pointer-events: none;
}

.app-notification {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) 28px;
  gap: 10px;
  align-items: start;
  min-height: 72px;
  padding: 14px;
  border: 1px solid var(--panel-border);
  border-left: 4px solid var(--accent-strong);
  border-radius: 8px;
  background: var(--panel-bg);
  color: var(--page-text);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.26);
  pointer-events: auto;
}

.app-notification--success {
  border-left-color: var(--success);
}

.app-notification--warning {
  border-left-color: #ffd400;
}

.app-notification--error {
  border-left-color: var(--danger);
}

.app-notification__icon {
  margin-top: 1px;
  color: var(--accent-strong);
  font-size: 24px;
}

.app-notification--success .app-notification__icon {
  color: var(--success);
}

.app-notification--warning .app-notification__icon {
  color: #ffd400;
}

.app-notification--error .app-notification__icon {
  color: var(--danger);
}

.app-notification__content {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.app-notification__content strong {
  overflow-wrap: anywhere;
  color: var(--heading-text);
  font-size: 14px;
  font-weight: 900;
  line-height: 1.25;
}

.app-notification__content p {
  margin: 0;
  overflow-wrap: anywhere;
  color: var(--muted);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.35;
}

.app-notification__close {
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  transition:
    border-color 160ms ease,
    color 160ms ease;
}

.app-notification__close:hover,
.app-notification__close:focus-visible {
  border-color: var(--panel-border);
  color: var(--heading-text);
  outline: none;
}

.app-notification__close :deep(.v-icon) {
  font-size: 18px;
}

@media (max-width: 640px) {
  .app-notification-stack {
    right: 12px;
    bottom: 12px;
    width: calc(100vw - 24px);
  }
}
</style>
