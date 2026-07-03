<template>
  <main class="settings-page" :aria-busy="isLoading ? 'true' : 'false'">
    <header class="settings-hero">
      <v-icon icon="mdi-cog-outline" class="settings-hero__icon" />
      <div>
        <h1>設定</h1>
        <p>アプリケーション設定</p>
      </div>
    </header>

    <section class="settings-panel">
      <div class="settings-panel__header">
        <h2>アプリケーション設定</h2>
        <p>トレーニング体験をカスタマイズします</p>
      </div>

      <div class="settings-list">
        <article v-for="item in settingItems" :key="item.key" class="setting-row">
          <div class="setting-row__content">
            <v-icon :icon="item.icon" :class="['setting-row__icon', item.iconClass]" />
            <div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.description }}</p>
            </div>
          </div>

          <button
            class="setting-toggle"
            type="button"
            :class="{ 'setting-toggle--active': settings[item.key] }"
            :disabled="isLoading || savingKey === item.key || savingThemeColor"
            :aria-pressed="settings[item.key]"
            :aria-label="`${item.title}を${settings[item.key] ? '無効' : '有効'}にする`"
            @click="toggleSetting(item.key)"
          >
            <span />
          </button>
        </article>

        <article class="setting-row setting-row--theme">
          <div class="setting-row__content">
            <v-icon icon="mdi-palette-outline" class="setting-row__icon setting-row__icon--theme" />
            <div>
              <h3>テーマカラー</h3>
              <p>画面の配色を選択します</p>
            </div>
          </div>

          <div class="theme-accordion">
            <button
              class="theme-accordion__trigger"
              type="button"
              :aria-expanded="isThemeSelectorOpen"
              aria-controls="theme-color-options"
              :disabled="isLoading || savingKey !== null || savingThemeColor"
              @click="toggleThemeSelector"
            >
              <span
                :class="['theme-option__swatch', selectedThemeColorOption.swatchClass]"
                aria-hidden="true"
              />
              <span class="theme-option__text">
                <span class="theme-option__label">{{ selectedThemeColorOption.label }}</span>
                <span class="theme-option__description">
                  {{ selectedThemeColorOption.description }}
                </span>
              </span>
              <v-icon
                :icon="isThemeSelectorOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                class="theme-accordion__chevron"
              />
            </button>

            <div
              v-if="isThemeSelectorOpen"
              id="theme-color-options"
              class="theme-selector"
              role="radiogroup"
              aria-label="テーマカラー"
            >
              <button
                v-for="option in themeColorOptions"
                :key="option.value"
                class="theme-option"
                type="button"
                role="radio"
                :class="{ 'theme-option--active': settings.themeColor === option.value }"
                :aria-checked="settings.themeColor === option.value"
                :disabled="isLoading || savingKey !== null || savingThemeColor"
                @click="selectThemeColor(option.value)"
              >
                <span :class="['theme-option__swatch', option.swatchClass]" aria-hidden="true" />
                <span class="theme-option__text">
                  <span class="theme-option__label">{{ option.label }}</span>
                  <span class="theme-option__description">{{ option.description }}</span>
                </span>
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section class="settings-panel settings-panel--data">
      <div class="settings-panel__header">
        <h2>データ管理</h2>
        <p>学習データの管理</p>
      </div>

      <button
        class="reset-button"
        type="button"
        :disabled="isResetting"
        @click="handleResetLearningHistory"
      >
        <v-icon icon="mdi-trash-can-outline" />
        <span>{{ isResetting ? 'リセット中...' : '学習履歴をリセット' }}</span>
      </button>
    </section>

    <p v-if="errorMessage" class="settings-message settings-message--error" role="alert">
      {{ errorMessage }}
    </p>
    <p v-else-if="successMessage" class="settings-message settings-message--success" role="status">
      {{ successMessage }}
    </p>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import {
  fetchAppSettings,
  resetLearningHistory,
  saveAppSettings,
  type AppSettings,
} from '@/api/settings'
import {
  ensureBrowserNotificationPermission,
  type BrowserNotificationPermissionResult,
} from '@/lib/notifications'
import { applyThemeColor, normalizeThemeColor, type ThemeColor } from '@/lib/themeColor'

type SettingKey = 'soundEnabled' | 'notificationsEnabled' | 'fearEffectEnabled'

type SettingItem = {
  key: SettingKey
  icon: string
  iconClass: string
  title: string
  description: string
}

type ThemeColorOption = {
  value: ThemeColor
  label: string
  description: string
  swatchClass: string
}

const settings = reactive<AppSettings>({
  soundEnabled: true,
  notificationsEnabled: true,
  fearEffectEnabled: true,
  themeColor: 0,
})

const settingItems: SettingItem[] = [
  {
    key: 'soundEnabled',
    icon: 'mdi-volume-high',
    iconClass: 'setting-row__icon--sound',
    title: '音声効果',
    description: '効果音を有効にする',
  },
  {
    key: 'notificationsEnabled',
    icon: 'mdi-bell-outline',
    iconClass: 'setting-row__icon--notice',
    title: '通知',
    description: '進捗通知を受け取る',
  },
  {
    key: 'fearEffectEnabled',
    icon: 'mdi-eye-outline',
    iconClass: 'setting-row__icon--fear',
    title: '恐怖演出',
    description: 'フィッシング攻撃時の演出を有効にする',
  },
]

const themeColorOptions: ThemeColorOption[] = [
  {
    value: 0,
    label: 'デフォルト',
    description: '現在の配色',
    swatchClass: 'theme-option__swatch--default',
  },
  {
    value: 1,
    label: 'ホワイト',
    description: '明るい配色',
    swatchClass: 'theme-option__swatch--white',
  },
  {
    value: 2,
    label: 'ダーク',
    description: '暗い配色',
    swatchClass: 'theme-option__swatch--dark',
  },
]
const defaultThemeColorOption = themeColorOptions.find((option) => option.value === 0)!

const isLoading = ref(true)
const isResetting = ref(false)
const savingKey = ref<SettingKey | null>(null)
const savingThemeColor = ref(false)
const isThemeSelectorOpen = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const selectedThemeColorOption = computed<ThemeColorOption>(
  () =>
    themeColorOptions.find((option) => option.value === settings.themeColor) ??
    defaultThemeColorOption,
)

function applySettings(nextSettings: AppSettings) {
  settings.soundEnabled = nextSettings.soundEnabled
  settings.notificationsEnabled = nextSettings.notificationsEnabled
  settings.fearEffectEnabled = nextSettings.fearEffectEnabled
  settings.themeColor = normalizeThemeColor(nextSettings.themeColor)
  applyThemeColor(settings.themeColor)
}

function showSuccess(message: string) {
  successMessage.value = message
  errorMessage.value = ''
}

function showError(message: string) {
  errorMessage.value = message
  successMessage.value = ''
}

async function requestBrowserPermissionForNotifications(
  key: SettingKey,
  nextValue: boolean,
): Promise<BrowserNotificationPermissionResult | null> {
  if (key !== 'notificationsEnabled' || !nextValue) {
    return null
  }

  return await ensureBrowserNotificationPermission()
}

function settingsSavedMessage(permission: BrowserNotificationPermissionResult | null): string {
  switch (permission) {
    case 'denied':
      return '設定を保存しました。ブラウザ通知は許可されていません。'
    case 'unsupported':
      return '設定を保存しました。このブラウザではブラウザ通知を使用できません。'
    case 'default':
      return '設定を保存しました。ブラウザ通知は許可待ちです。'
    default:
      return '設定を保存しました'
  }
}

async function loadSettings() {
  isLoading.value = true
  try {
    const nextSettings = await fetchAppSettings()
    applySettings(nextSettings)
  } catch (error) {
    console.error(error)
    showError('設定の読み込みに失敗しました')
  } finally {
    isLoading.value = false
  }
}

async function toggleSetting(key: SettingKey) {
  if (isLoading.value || savingKey.value || savingThemeColor.value) return

  const previousValue = settings[key]
  const nextValue = !previousValue
  settings[key] = nextValue
  savingKey.value = key

  try {
    const permission = await requestBrowserPermissionForNotifications(key, nextValue)
    const nextSettings = await saveAppSettings({ ...settings })
    applySettings(nextSettings)
    showSuccess(settingsSavedMessage(permission))
  } catch (error) {
    console.error(error)
    settings[key] = previousValue
    showError('設定の保存に失敗しました')
  } finally {
    savingKey.value = null
  }
}

function toggleThemeSelector() {
  if (isLoading.value || savingKey.value || savingThemeColor.value) return
  isThemeSelectorOpen.value = !isThemeSelectorOpen.value
}

async function selectThemeColor(themeColor: ThemeColor) {
  if (isLoading.value || savingKey.value || savingThemeColor.value) {
    return
  }

  if (settings.themeColor === themeColor) {
    isThemeSelectorOpen.value = false
    return
  }

  const previousThemeColor = settings.themeColor
  settings.themeColor = themeColor
  applyThemeColor(themeColor)
  savingThemeColor.value = true

  try {
    const nextSettings = await saveAppSettings({ ...settings })
    applySettings(nextSettings)
    isThemeSelectorOpen.value = false
    showSuccess('テーマカラーを保存しました')
  } catch (error) {
    console.error(error)
    settings.themeColor = previousThemeColor
    applyThemeColor(previousThemeColor)
    showError('テーマカラーの保存に失敗しました')
  } finally {
    savingThemeColor.value = false
  }
}

async function handleResetLearningHistory() {
  if (isResetting.value) return

  isResetting.value = true
  try {
    await resetLearningHistory()
    showSuccess('学習履歴をリセットしました')
  } catch (error) {
    console.error(error)
    showError('学習履歴のリセットに失敗しました')
  } finally {
    isResetting.value = false
  }
}

onMounted(loadSettings)
</script>

<style src="../../Main.css"></style>
<style lang="css" scoped src="../css/Setting.css"></style>
