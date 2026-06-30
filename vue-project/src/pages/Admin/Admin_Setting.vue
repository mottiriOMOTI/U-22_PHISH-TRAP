<template>
  <main class="admin-setting-page" :aria-busy="isLoading ? 'true' : 'false'">
    <header class="admin-setting-hero">
      <v-icon icon="mdi-cog-outline" class="admin-setting-hero__icon" />
      <div>
        <h1>設定</h1>
        <p>システム管理設定</p>
      </div>
    </header>

    <section class="setting-panel">
      <div class="setting-panel__header">
        <h2>通知設定</h2>
        <p>管理者向けの通知を管理します</p>
      </div>

      <SettingToggleRow
        icon="mdi-bell-outline"
        icon-class="setting-row__icon--notice"
        title="メール通知"
        description="ユーザー活動の通知を受け取る"
        :model-value="settings.notificationsEnabled"
        :disabled="isLoading || savingKey !== null || savingThemeColor"
        :loading="savingKey === 'notificationsEnabled'"
        @update:model-value="toggleSetting('notificationsEnabled', $event)"
      />
    </section>

    <section class="setting-panel">
      <div class="setting-panel__header">
        <h2>表示設定</h2>
        <p>管理画面とアプリ全体の配色を設定します</p>
      </div>

      <article class="setting-row setting-row--theme">
        <div class="setting-row__content">
          <v-icon icon="mdi-palette-outline" class="setting-row__icon setting-row__icon--theme" />
          <div class="setting-row__text">
            <strong>テーマカラー</strong>
            <span>画面の配色を選択します</span>
          </div>
        </div>

        <div class="theme-accordion">
          <button
            class="theme-accordion__trigger"
            type="button"
            :aria-expanded="isThemeSelectorOpen"
            aria-controls="admin-theme-color-options"
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
            id="admin-theme-color-options"
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
    </section>

    <section class="setting-panel">
      <div class="setting-panel__header">
        <h2>トレーニング設定</h2>
        <p>学習者向けのトレーニング機能を設定します</p>
      </div>

      <div class="setting-panel__rows">
        <SettingToggleRow
          icon="mdi-shield-outline"
          icon-class="setting-row__icon--fear"
          title="恐怖演出"
          description="フィッシング攻撃時の演出を有効にする"
          :model-value="settings.fearEffectEnabled"
          :disabled="isLoading || savingKey !== null || savingThemeColor"
          :loading="savingKey === 'fearEffectEnabled'"
          @update:model-value="toggleSetting('fearEffectEnabled', $event)"
        />

        <SettingToggleRow
          icon="mdi-email-outline"
          icon-class="setting-row__icon--generate"
          title="自動問題生成"
          description="週次で新しい問題を自動生成する"
          :model-value="settings.autoGenerateEnabled"
          :disabled="isLoading || savingKey !== null || savingThemeColor"
          :loading="savingKey === 'autoGenerateEnabled'"
          @update:model-value="toggleSetting('autoGenerateEnabled', $event)"
        />
      </div>
    </section>

    <section class="setting-panel setting-panel--data">
      <div class="setting-panel__header">
        <h2>データ管理</h2>
        <p>学習データの収集と管理を設定します</p>
      </div>

      <div class="setting-panel__rows">
        <SettingToggleRow
          icon="mdi-database-outline"
          icon-class="setting-row__icon--data"
          title="学習データ収集"
          description="ユーザーの学習履歴を記録する"
          :model-value="settings.dataCollectionEnabled"
          :disabled="isLoading || savingKey !== null || savingThemeColor"
          :loading="savingKey === 'dataCollectionEnabled'"
          @update:model-value="toggleSetting('dataCollectionEnabled', $event)"
        />

        <button class="export-button" type="button" :disabled="isLoading" @click="exportSettings">
          <v-icon icon="mdi-download-outline" />
          <span>全データをエクスポート</span>
        </button>
      </div>
    </section>

    <p v-if="errorMessage" class="setting-message setting-message--error" role="alert">
      {{ errorMessage }}
    </p>
    <p v-else-if="successMessage" class="setting-message setting-message--success" role="status">
      {{ successMessage }}
    </p>

    <button class="help-button" type="button" aria-label="ヘルプ">
      ?
    </button>
  </main>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, reactive, ref } from 'vue'

import { fetchAppSettings, saveAppSettings, type AppSettings } from '@/api/settings'
import {
  ensureBrowserNotificationPermission,
  type BrowserNotificationPermissionResult,
} from '@/lib/notifications'
import { applyThemeColor, normalizeThemeColor, type ThemeColor } from '@/lib/themeColor'

type AdminSettings = Required<AppSettings>
type AdminSettingKey = Exclude<keyof AdminSettings, 'themeColor'>

type ThemeColorOption = {
  value: ThemeColor
  label: string
  description: string
  swatchClass: string
}

const settings = reactive<AdminSettings>({
  soundEnabled: true,
  notificationsEnabled: true,
  fearEffectEnabled: true,
  themeColor: 0,
  autoGenerateEnabled: false,
  dataCollectionEnabled: true,
})

const themeColorOptions: ThemeColorOption[] = [
  {
    value: 0,
    label: 'デフォルト',
    description: '現在の標準配色',
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
const savingKey = ref<AdminSettingKey | null>(null)
const savingThemeColor = ref(false)
const isThemeSelectorOpen = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const selectedThemeColorOption = computed<ThemeColorOption>(
  () =>
    themeColorOptions.find((option) => option.value === settings.themeColor) ??
    defaultThemeColorOption,
)

const SettingToggleRow = defineComponent({
  name: 'SettingToggleRow',
  props: {
    icon: { type: String, required: true },
    iconClass: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    modelValue: { type: Boolean, required: true },
    disabled: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
  },
  emits: {
    'update:modelValue': (_value: boolean) => true,
  },
  setup(props, { emit }) {
    return () =>
      h('div', { class: 'setting-row' }, [
        h('div', { class: 'setting-row__content' }, [
          h('i', {
            class: ['mdi', props.icon, 'setting-row__icon', props.iconClass],
            'aria-hidden': 'true',
          }),
          h('div', { class: 'setting-row__text' }, [
            h('strong', props.title),
            h('span', props.description),
          ]),
        ]),
        h(
          'button',
          {
            class: ['setting-switch', { 'setting-switch--on': props.modelValue }],
            type: 'button',
            role: 'switch',
            'aria-checked': props.modelValue ? 'true' : 'false',
            disabled: props.disabled,
            onClick: () => emit('update:modelValue', !props.modelValue),
          },
          [h('span', { class: 'setting-switch__thumb' }, props.loading ? ' ' : '')],
        ),
      ])
  },
})

function applySettings(nextSettings: AppSettings) {
  settings.soundEnabled = nextSettings.soundEnabled
  settings.notificationsEnabled = nextSettings.notificationsEnabled
  settings.fearEffectEnabled = nextSettings.fearEffectEnabled
  settings.themeColor = normalizeThemeColor(nextSettings.themeColor)
  settings.autoGenerateEnabled = nextSettings.autoGenerateEnabled ?? false
  settings.dataCollectionEnabled = nextSettings.dataCollectionEnabled ?? true
  applyThemeColor(settings.themeColor)
}

function currentSettings(): AdminSettings {
  return {
    soundEnabled: settings.soundEnabled,
    notificationsEnabled: settings.notificationsEnabled,
    fearEffectEnabled: settings.fearEffectEnabled,
    themeColor: settings.themeColor,
    autoGenerateEnabled: settings.autoGenerateEnabled,
    dataCollectionEnabled: settings.dataCollectionEnabled,
  }
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
  key: AdminSettingKey,
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
      return '設定を保存しました。'
  }
}

async function loadSettings() {
  isLoading.value = true

  try {
    applySettings(await fetchAppSettings())
  } catch (error) {
    console.error(error)
    showError('設定の読み込みに失敗しました。')
  } finally {
    isLoading.value = false
  }
}

async function toggleSetting(key: AdminSettingKey, nextValue: boolean) {
  if (isLoading.value || savingKey.value || savingThemeColor.value) return

  const previousValue = settings[key]
  settings[key] = nextValue
  savingKey.value = key

  try {
    const permission = await requestBrowserPermissionForNotifications(key, nextValue)
    applySettings(await saveAppSettings(currentSettings()))
    showSuccess(settingsSavedMessage(permission))
  } catch (error) {
    console.error(error)
    settings[key] = previousValue
    showError('設定の保存に失敗しました。')
  } finally {
    savingKey.value = null
  }
}

function toggleThemeSelector() {
  if (isLoading.value || savingKey.value || savingThemeColor.value) return
  isThemeSelectorOpen.value = !isThemeSelectorOpen.value
}

async function selectThemeColor(themeColor: ThemeColor) {
  if (isLoading.value || savingKey.value || savingThemeColor.value) return

  if (settings.themeColor === themeColor) {
    isThemeSelectorOpen.value = false
    return
  }

  const previousThemeColor = settings.themeColor
  settings.themeColor = themeColor
  applyThemeColor(themeColor)
  savingThemeColor.value = true

  try {
    applySettings(await saveAppSettings(currentSettings()))
    isThemeSelectorOpen.value = false
    showSuccess('テーマカラーを保存しました。')
  } catch (error) {
    console.error(error)
    settings.themeColor = previousThemeColor
    applyThemeColor(previousThemeColor)
    showError('テーマカラーの保存に失敗しました。')
  } finally {
    savingThemeColor.value = false
  }
}

function exportSettings() {
  const blob = new Blob([JSON.stringify(currentSettings(), null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `phish-trap-settings-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}

onMounted(loadSettings)
</script>

<style lang="css">
.admin-setting-page {
  min-height: 100vh;
  padding: 38px 30px 64px;
  background: var(--page-bg);
  color: var(--page-text);
}

.admin-setting-hero {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 32px;
}

.admin-setting-hero__icon {
  color: var(--accent);
  font-size: 48px;
  margin-top: -1px;
}

.admin-setting-hero h1 {
  margin: 0;
  color: var(--heading-text);
  font-size: 40px;
  font-weight: 900;
  letter-spacing: 0;
  line-height: 1;
}

.admin-setting-hero p {
  margin: 9px 0 0;
  color: var(--muted);
  font-size: 18px;
  font-weight: 500;
}

.setting-panel {
  width: 100%;
  max-width: 1020px;
  padding: 29px 30px 30px;
  border: 1px solid var(--panel-border);
  border-radius: 17px;
  background: var(--panel-bg);
}

.setting-panel + .setting-panel {
  margin-top: 30px;
}

.setting-panel__header h2 {
  margin: 0;
  color: var(--heading-text);
  font-size: 22px;
  font-weight: 900;
  letter-spacing: 0;
}

.setting-panel__header p {
  margin: 10px 0 0;
  color: var(--muted);
  font-size: 18px;
  font-weight: 500;
}

.setting-panel__rows {
  display: grid;
  gap: 30px;
}

.setting-row {
  display: flex;
  min-height: 82px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-top: 32px;
  padding: 18px 20px;
  border: 1px solid color-mix(in srgb, var(--surface-border) 70%, transparent);
  border-radius: 10px;
  background: var(--surface-bg);
}

.setting-panel__rows .setting-row {
  margin-top: 0;
}

.setting-row__content {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 18px;
}

.setting-row__icon {
  flex: 0 0 auto;
  font-size: 25px;
  line-height: 1;
}

.setting-row__icon--notice {
  color: #5aa2ff;
}

.setting-row__icon--theme {
  color: var(--accent);
}

.setting-row__icon--fear {
  color: var(--danger);
}

.setting-row__icon--generate {
  color: #c56cff;
}

.setting-row__icon--data {
  color: var(--success);
}

.setting-row__text {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.setting-row__text strong {
  color: var(--heading-text);
  font-size: 18px;
  font-weight: 900;
  line-height: 1.2;
}

.setting-row__text span {
  color: var(--muted);
  font-size: 16px;
  font-weight: 500;
  line-height: 1.25;
}

.setting-switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 41px;
  height: 24px;
  flex: 0 0 auto;
  border: 0;
  border-radius: 999px;
  background: var(--toggle-bg);
  cursor: pointer;
  transition:
    background 160ms ease,
    opacity 160ms ease;
  box-sizing: border-box;
}

.setting-switch--on {
  background: var(--toggle-active-bg);
}

.setting-switch:disabled {
  cursor: default;
  opacity: 0.75;
}

.setting-switch__thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
  transition: transform 160ms ease;
}

.setting-switch--on .setting-switch__thumb {
  transform: translateX(17px);
}

.setting-row--theme {
  align-items: stretch;
  min-height: 78px;
  padding: 12px 14px;
}

.theme-accordion {
  display: grid;
  width: min(100%, 300px);
  flex: 0 0 300px;
  gap: 8px;
}

.theme-accordion__trigger {
  display: flex;
  width: 100%;
  min-height: 54px;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  background: var(--panel-bg);
  color: var(--page-text);
  cursor: pointer;
  font: inherit;
  text-align: left;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    opacity 160ms ease;
}

.theme-accordion__trigger:hover:not(:disabled),
.theme-accordion__trigger[aria-expanded='true'] {
  border-color: var(--accent-strong);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-strong) 28%, transparent);
}

.theme-accordion__trigger:disabled {
  cursor: wait;
  opacity: 0.72;
}

.theme-accordion__chevron {
  margin-left: auto;
  color: var(--muted);
  font-size: 20px;
}

.theme-selector {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.theme-option {
  display: flex;
  width: 100%;
  min-width: 0;
  min-height: 54px;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  background: var(--panel-bg);
  color: var(--page-text);
  cursor: pointer;
  font: inherit;
  text-align: left;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    opacity 160ms ease;
}

.theme-option:hover:not(:disabled),
.theme-option--active {
  border-color: var(--accent-strong);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-strong) 28%, transparent);
}

.theme-option:disabled {
  cursor: wait;
  opacity: 0.72;
}

.theme-option__swatch {
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  border: 1px solid var(--panel-border);
  border-radius: 50%;
}

.theme-option__swatch--default {
  background: linear-gradient(135deg, #172337 0 50%, #b449ff 50% 100%);
}

.theme-option__swatch--white {
  background: linear-gradient(135deg, #ffffff 0 50%, #1f66e5 50% 100%);
}

.theme-option__swatch--dark {
  background: linear-gradient(135deg, #050617 0 50%, #8b5cf6 50% 100%);
}

.theme-option__text {
  display: grid;
  min-width: 0;
  gap: 2px;
  text-align: left;
}

.theme-option__label {
  overflow: hidden;
  color: var(--heading-text);
  font-size: 13px;
  font-weight: 800;
  line-height: 1.1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.theme-option__description {
  overflow: hidden;
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
  line-height: 1.1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.export-button {
  display: inline-flex;
  min-height: 46px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 0;
  padding: 0 16px;
  border: 1px solid var(--surface-border);
  border-radius: 9px;
  background: var(--surface-bg);
  color: var(--page-text);
  cursor: pointer;
  font: inherit;
  font-size: 16px;
  font-weight: 900;
  transition:
    border-color 160ms ease,
    color 160ms ease,
    transform 160ms ease;
}

.export-button:hover:not(:disabled),
.export-button:focus-visible {
  border-color: var(--accent);
  color: var(--heading-text);
  outline: none;
  transform: translateY(-1px);
}

.export-button:disabled {
  cursor: default;
  opacity: 0.65;
  transform: none;
}

.export-button :deep(.v-icon) {
  font-size: 21px;
}

.setting-message {
  width: 100%;
  max-width: 1020px;
  margin: 18px 0 0;
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 800;
}

.setting-message--error {
  border: 1px solid color-mix(in srgb, var(--danger) 42%, transparent);
  background: color-mix(in srgb, var(--danger) 12%, transparent);
  color: var(--danger);
}

.setting-message--success {
  border: 1px solid color-mix(in srgb, var(--success) 42%, transparent);
  background: color-mix(in srgb, var(--success) 12%, transparent);
  color: var(--success);
}

.help-button {
  position: fixed;
  right: 15px;
  bottom: 14px;
  display: inline-flex;
  width: 41px;
  height: 41px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  background: var(--button-bg);
  color: var(--button-text);
  cursor: pointer;
  font-size: 27px;
  line-height: 1;
}

@media (max-width: 900px) {
  .admin-setting-page {
    padding: 28px 18px 48px;
  }

  .admin-setting-hero h1 {
    font-size: 34px;
  }

  .setting-panel {
    padding: 24px 20px;
  }

  .setting-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .setting-row--theme {
    align-items: flex-start;
  }

  .setting-switch {
    align-self: flex-end;
  }

  .theme-selector {
    width: 100%;
  }

  .theme-accordion {
    width: 100%;
    flex-basis: auto;
  }
}

@media (max-width: 640px) {
  .theme-selector {
    grid-template-columns: 1fr;
  }
}
</style>
