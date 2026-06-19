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

type SettingKey = 'soundEnabled' | 'notificationsEnabled' | 'fearEffectEnabled'

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

<style src="../../Main.css"></style>
<style lang="css" scoped src="../css/Setting.css"></style>
