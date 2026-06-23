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
        <p>管理者への通知を管理します</p>
      </div>

      <SettingToggleRow
        icon="mdi-bell-outline"
        icon-class="setting-row__icon--notice"
        title="メール通知"
        description="ユーザー活動の通知を受け取る"
        :model-value="settings.notificationsEnabled"
        :disabled="isLoading || savingKey !== null"
        :loading="savingKey === 'notificationsEnabled'"
        @update:model-value="toggleSetting('notificationsEnabled', $event)"
      />
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
          :disabled="isLoading || savingKey !== null"
          :loading="savingKey === 'fearEffectEnabled'"
          @update:model-value="toggleSetting('fearEffectEnabled', $event)"
        />

        <SettingToggleRow
          icon="mdi-email-outline"
          icon-class="setting-row__icon--generate"
          title="自動問題生成"
          description="週次で新しい問題を自動生成"
          :model-value="settings.autoGenerateEnabled"
          :disabled="isLoading || savingKey !== null"
          :loading="savingKey === 'autoGenerateEnabled'"
          @update:model-value="toggleSetting('autoGenerateEnabled', $event)"
        />
      </div>
    </section>

    <section class="setting-panel setting-panel--data">
      <div class="setting-panel__header">
        <h2>データ管理</h2>
        <p>学習データの収集と管理</p>
      </div>

      <div class="setting-panel__rows">
        <SettingToggleRow
          icon="mdi-database-outline"
          icon-class="setting-row__icon--data"
          title="学習データ収集"
          description="ユーザーの学習履歴を記録"
          :model-value="settings.dataCollectionEnabled"
          :disabled="isLoading || savingKey !== null"
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
import { defineComponent, h, onMounted, reactive, ref } from 'vue'

import { fetchAppSettings, saveAppSettings, type AppSettings } from '@/api/settings'

type AdminSettings = Required<AppSettings>
type AdminSettingKey = Exclude<keyof AdminSettings, 'themeColor'>

const settings = reactive<AdminSettings>({
  soundEnabled: true,
  notificationsEnabled: true,
  fearEffectEnabled: true,
  themeColor: 0,
  autoGenerateEnabled: false,
  dataCollectionEnabled: true,
})

const isLoading = ref(true)
const savingKey = ref<AdminSettingKey | null>(null)
const errorMessage = ref('')
const successMessage = ref('')

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
  settings.themeColor = nextSettings.themeColor ?? 0
  settings.autoGenerateEnabled = nextSettings.autoGenerateEnabled ?? false
  settings.dataCollectionEnabled = nextSettings.dataCollectionEnabled ?? true
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
  if (isLoading.value || savingKey.value) return

  const previousValue = settings[key]
  settings[key] = nextValue
  savingKey.value = key

  try {
    applySettings(await saveAppSettings(currentSettings()))
    showSuccess('設定を保存しました。')
  } catch (error) {
    console.error(error)
    settings[key] = previousValue
    showError('設定の保存に失敗しました。')
  } finally {
    savingKey.value = null
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
  background: #172337;
  color: #ffffff;
}

.admin-setting-hero {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 32px;
}

.admin-setting-hero__icon {
  color: #b34aff;
  font-size: 48px;
  margin-top: -1px;
}

.admin-setting-hero h1 {
  margin: 0;
  color: #ffffff;
  font-size: 40px;
  font-weight: 900;
  letter-spacing: 0;
  line-height: 1;
}

.admin-setting-hero p {
  margin: 9px 0 0;
  color: #98b3d6;
  font-size: 18px;
  font-weight: 500;
}

.setting-panel {
  width: 100%;
  max-width: 1020px;
  padding: 29px 30px 30px;
  border: 1px solid #31425e;
  border-radius: 17px;
  background: #1b2a40;
}

.setting-panel + .setting-panel {
  margin-top: 30px;
}

.setting-panel__header h2 {
  margin: 0;
  color: #ffffff;
  font-size: 22px;
  font-weight: 900;
  letter-spacing: 0;
}

.setting-panel__header p {
  margin: 10px 0 0;
  color: #9bb4d2;
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
  border-radius: 10px;
  background: #121d31;
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

.setting-row__icon--fear {
  color: #ff5b6c;
}

.setting-row__icon--generate {
  color: #c56cff;
}

.setting-row__icon--data {
  color: #40d684;
}

.setting-row__text {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.setting-row__text strong {
  color: #ffffff;
  font-size: 18px;
  font-weight: 900;
  line-height: 1.2;
}

.setting-row__text span {
  color: #9bb4d2;
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
  background: #aab4c3;
  cursor: pointer;
  transition:
    background 160ms ease,
    opacity 160ms ease;
  box-sizing: border-box;
}

.setting-switch--on {
  background: #0b1020;
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

.export-button {
  display: inline-flex;
  min-height: 46px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 0;
  padding: 0 16px;
  border: 1px solid #465a77;
  border-radius: 9px;
  background: #121d31;
  color: #d7e4fb;
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
  border-color: rgba(179, 74, 255, 0.74);
  color: #ffffff;
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
  border: 1px solid rgba(255, 92, 112, 0.42);
  background: rgba(255, 92, 112, 0.12);
  color: #ffd4dc;
}

.setting-message--success {
  border: 1px solid rgba(64, 214, 132, 0.42);
  background: rgba(64, 214, 132, 0.12);
  color: #d2ffe4;
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
  background: #ffffff;
  color: #111827;
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

  .setting-switch {
    align-self: flex-end;
  }
}
</style>
