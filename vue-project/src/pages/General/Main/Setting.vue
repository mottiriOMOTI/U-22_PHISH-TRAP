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
            <v-icon :icon="item.icon" :class="['setting-row__icon', item.iconClass]"/>
            <div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.description }}</p>
            </div>
          </div>

          <button
            class="setting-toggle"
            type="button"
            :class="{ 'setting-toggle--active': settings[item.key] }"
            :disabled="isLoading || savingKey === item.key"
            :aria-pressed="settings[item.key]"
            :aria-label="`${item.title}を${settings[item.key] ? '無効' : '有効'}にする`"
            @click="toggleSetting(item.key)"
          >
            <span />
          </button>
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
import { onMounted, reactive, ref } from 'vue'

import {
  fetchAppSettings,
  resetLearningHistory,
  saveAppSettings,
  type AppSettings,
} from '@/api/settings'

type SettingKey = keyof AppSettings

type SettingItem = {
  key: SettingKey
  icon: string
  iconClass: string
  title: string
  description: string
}

const settings = reactive<AppSettings>({
  soundEnabled: true,
  notificationsEnabled: true,
  fearEffectEnabled: true,
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

const isLoading = ref(true)
const isResetting = ref(false)
const savingKey = ref<SettingKey | null>(null)
const errorMessage = ref('')
const successMessage = ref('')

function applySettings(nextSettings: AppSettings) {
  settings.soundEnabled = nextSettings.soundEnabled
  settings.notificationsEnabled = nextSettings.notificationsEnabled
  settings.fearEffectEnabled = nextSettings.fearEffectEnabled
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
  if (isLoading.value || savingKey.value) return

  const previousValue = settings[key]
  settings[key] = !previousValue
  savingKey.value = key

  try {
    const nextSettings = await saveAppSettings({ ...settings })
    applySettings(nextSettings)
    showSuccess('設定を保存しました')
  } catch (error) {
    console.error(error)
    settings[key] = previousValue
    showError('設定の保存に失敗しました')
  } finally {
    savingKey.value = null
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

<style lang="css" scoped>
.settings-page {
  position: relative;
  box-sizing: border-box;
  min-height: 100vh;
  padding: 18px 22px 14px;
  background: #172337;
  color: #ffffff;
}

.settings-hero {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-bottom: 14px;
}

.settings-hero__icon {
  color: #b449ff;
  font-size: 36px;
}

.settings-hero h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  line-height: 1.1;
}

.settings-hero p,
.settings-panel__header p,
.setting-row p {
  margin: 0;
  color: #9fbbe0;
}

.settings-hero p {
  margin-top: 5px;
  font-size: 15px;
}

.settings-panel {
  width: min(100%, 1040px);
  padding: 16px 20px;
  border: 1px solid #34465f;
  border-radius: 12px;
  background: #172337;
}

.settings-panel + .settings-panel {
  margin-top: 12px;
}

.settings-panel__header h2 {
  margin: 0 0 4px;
  font-size: 17px;
  font-weight: 800;
  line-height: 1.3;
}

.settings-panel__header p {
  font-size: 14px;
}

.settings-list {
  display: grid;
  gap: 12px;
  margin-top: 14px;
}

.setting-row {
  display: flex;
  min-height: 50px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 14px;
  border-radius: 8px;
  background: #111a2f;
}

.setting-row__content {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
}

.setting-row__icon {
  flex: 0 0 auto;
  font-size: 22px;
}

.setting-row__icon--sound {
  color: #45a4ff;
}

.setting-row__icon--notice {
  color: #ffd400;
}

.setting-row__icon--fear {
  color: #ff4559;
}

.setting-row h3 {
  margin: 0 0 2px;
  font-size: 15px;
  font-weight: 800;
  line-height: 1.25;
}

.setting-row p {
  font-size: 13px;
  line-height: 1.3;
}

.setting-toggle {
  position: relative;
  flex: 0 0 auto;
  width: 38px;
  height: 22px;
  border: 0;
  border-radius: 999px;
  background: #26334a;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    opacity 160ms ease;
}

.setting-toggle span {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ffffff;
  transition: transform 160ms ease;
}

.setting-toggle--active {
  background: #050617;
}

.setting-toggle--active span {
  transform: translateX(16px);
}

.setting-toggle:disabled,
.reset-button:disabled {
  cursor: wait;
  opacity: 0.7;
}

.settings-panel--data {
  padding-bottom: 16px;
}

.reset-button {
  display: flex;
  width: 100%;
  min-height: 34px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 14px;
  border: 2px solid #ff3048;
  border-radius: 8px;
  background: #ffffff;
  color: #ff3048;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    color 160ms ease;
}

.reset-button:hover:not(:disabled) {
  background: #fff5f6;
}

.settings-message {
  width: min(100%, 1040px);
  margin: 8px 0 0;
  font-size: 13px;
  font-weight: 700;
}

.settings-message--error {
  color: #ff7382;
}

.settings-message--success {
  color: #77d99a;
}

.help-button {
  position: fixed;
  right: 14px;
  bottom: 12px;
  width: 34px;
  height: 34px;
  border: 1px solid #d7dce7;
  border-radius: 50%;
  background: #ffffff;
  color: #1e2430;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}

@media (max-width: 900px) {
  .settings-page {
    padding: 18px 14px 16px;
  }

  .settings-hero h1 {
    font-size: 28px;
  }

  .settings-panel {
    padding: 16px;
  }

  .setting-row {
    padding: 14px;
  }
}

@media (max-width: 640px) {
  .settings-hero {
    align-items: flex-start;
  }

  .setting-row {
    align-items: flex-start;
  }

  .setting-row__content {
    align-items: flex-start;
  }
}
</style>
