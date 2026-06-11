<template>
  <main class="account-setting-page" :aria-busy="isLoading || isSaving ? 'true' : 'false'">
    <header class="account-setting-hero">
      <v-icon icon="mdi-account-cog-outline" class="account-setting-hero__icon" />
      <div>
        <h1>アカウント変更</h1>
        <p>プロフィール情報の変更</p>
      </div>
    </header>

    <section class="account-setting-panel">
      <div class="account-setting-panel__header">
        <h2>プロフィール編集</h2>
        <p>アカウント画面に表示される情報を更新します</p>
      </div>

      <div class="profile-preview">
        <div class="profile-avatar">{{ avatarInitial }}</div>
        <div class="profile-summary">
          <strong>{{ form.name || 'ユーザー' }}</strong>
          <span>
            <v-icon icon="mdi-email-outline" />
            {{ form.email || 'メールアドレス未設定' }}
          </span>
        </div>
      </div>

      <form class="account-form" @submit.prevent="handleSave">
        <div class="form-grid">
          <label class="form-field" for="name">
            <span>ユーザーネーム</span>
            <input
              id="name"
              v-model.trim="form.name"
              type="text"
              required
              maxlength="40"
              placeholder="ユーザーネーム"
              :disabled="isLoading || isSaving"
            />
          </label>

          <label class="form-field" for="email">
            <span>メールアドレス</span>
            <input
              id="email"
              v-model.trim="form.email"
              type="email"
              required
              placeholder="user@example.com"
              :disabled="isLoading || isSaving"
            />
          </label>
        </div>

        <div class="readonly-grid">
          <article class="readonly-card">
            <span>
              <v-icon icon="mdi-calendar-outline" />
              登録日
            </span>
            <strong>{{ formattedJoinedAt }}</strong>
          </article>

          <article class="readonly-card">
            <span>
              <v-icon icon="mdi-medal-outline" />
              ランク
            </span>
            <strong>{{ profile.rank }}</strong>
          </article>
        </div>

        <div class="form-actions">
          <button
            class="secondary-button"
            type="button"
            :disabled="isLoading || isSaving"
            @click="handleCancel"
          >
            元に戻す
          </button>
          <button class="primary-button" type="submit" :disabled="isLoading || isSaving || !hasChanges">
            {{ isSaving ? '保存中...' : '保存する' }}
          </button>
        </div>
      </form>
    </section>

    <p v-if="errorMessage" class="account-setting-message account-setting-message--error" role="alert">
      {{ errorMessage }}
    </p>
    <p v-else-if="successMessage" class="account-setting-message account-setting-message--success" role="status">
      {{ successMessage }}
    </p>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { fetchAccountSummary } from '@/api/account'
import {
  getCurrentUser,
  updateCurrentUserProfile,
  type CurrentUser,
} from '@/api/users'

const router = useRouter()

const form = reactive({
  name: '',
  email: '',
})

const original = reactive({
  name: '',
  email: '',
})

const profile = reactive({
  joinedAt: '',
  rank: '初心者',
})

const currentUser = ref<CurrentUser | null>(null)
const isLoading = ref(true)
const isSaving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const avatarInitial = computed(() => {
  const initial = form.name.trim().charAt(0) || form.email.trim().charAt(0)
  return initial ? initial.toUpperCase() : 'U'
})

const formattedJoinedAt = computed(() => {
  if (!profile.joinedAt) {
    return '--'
  }

  const date = new Date(profile.joinedAt)

  if (Number.isNaN(date.getTime())) {
    return profile.joinedAt
  }

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
})

const hasChanges = computed(() => {
  return form.name.trim() !== original.name || form.email.trim() !== original.email
})

function applyUser(user: CurrentUser) {
  currentUser.value = user
  form.name = user.name.trim() || 'ユーザー'
  form.email = user.email
  original.name = form.name
  original.email = form.email
  profile.joinedAt = user.created_at
}

function showSuccess(message: string) {
  successMessage.value = message
  errorMessage.value = ''
}

function showError(message: string) {
  errorMessage.value = message
  successMessage.value = ''
}

async function handleCancel() {
  await router.push({ name: 'Account' })
}

function validateForm() {
  if (!form.name.trim()) {
    showError('ユーザーネームを入力してください')
    return false
  }

  if (!form.email.trim()) {
    showError('メールアドレスを入力してください')
    return false
  }

  return true
}

async function loadAccountSetting() {
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const account = await fetchAccountSummary()
    profile.rank = account.profile.rank
    profile.joinedAt = account.profile.joinedAt
  } catch (error) {
    console.error(error)
  }

  const user = getCurrentUser()

  if (user) {
    applyUser(user)
  } else {
    showError('ログイン中のユーザー情報が見つかりません')
  }

  isLoading.value = false
}

async function handleSave() {
  if (isLoading.value || isSaving.value || !currentUser.value || !validateForm()) {
    return
  }

  isSaving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const updatedUser = await updateCurrentUserProfile({
      id: currentUser.value.id,
      name: form.name.trim(),
      email: form.email.trim(),
    })

    applyUser(updatedUser)
    showSuccess('アカウント情報を保存しました')
    await router.push({ name: 'Account' })
  } catch (error) {
    console.error(error)
    showError(error instanceof Error ? error.message : 'アカウント情報の保存に失敗しました')
  } finally {
    isSaving.value = false
  }
}

onMounted(loadAccountSetting)
</script>

<style lang="css" scoped>
.account-setting-page {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  min-height: 100vh;
  padding: 18px 22px 14px;
  background: #172337;
  color: #ffffff;
}

.account-setting-hero {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.account-setting-hero__icon {
  color: #45a4ff;
  font-size: 40px;
}

.account-setting-hero h1 {
  margin: 0;
  font-size: 30px;
  font-weight: 800;
  line-height: 1.1;
}

.account-setting-hero p,
.account-setting-panel__header p,
.profile-summary span,
.readonly-card span {
  margin: 0;
  color: #9fbbe0;
}

.account-setting-hero p {
  margin-top: 6px;
  font-size: 16px;
}

.account-setting-panel {
  width: 100%;
  padding: 18px 22px 20px;
  border: 1px solid #34465f;
  border-radius: 12px;
  background: #172337;
}

.account-setting-panel__header h2 {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 800;
  line-height: 1.3;
}

.account-setting-panel__header p {
  font-size: 14px;
}

.profile-preview {
  display: flex;
  min-height: 82px;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  padding: 0 16px;
  border-radius: 8px;
  background: #111a2f;
}

.profile-avatar {
  display: grid;
  width: 58px;
  height: 58px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  background: #00bf56;
  color: #ffffff;
  font-size: 24px;
  font-weight: 800;
}

.profile-summary {
  display: grid;
  gap: 5px;
  min-width: 0;
}

.profile-summary strong {
  overflow-wrap: anywhere;
  font-size: 19px;
  font-weight: 800;
  line-height: 1.2;
}

.profile-summary span,
.readonly-card span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  line-height: 1.3;
}

.profile-summary :deep(.v-icon),
.readonly-card :deep(.v-icon) {
  font-size: 18px;
}

.account-form {
  display: grid;
  gap: 16px;
  margin-top: 16px;
}

.form-grid,
.readonly-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.form-field {
  display: grid;
  gap: 8px;
}

.form-field span {
  color: #ffffff;
  font-size: 14px;
  font-weight: 800;
}

.form-field input {
  width: 100%;
  min-height: 44px;
  padding: 0 14px;
  border: 1px solid #4d6079;
  border-radius: 8px;
  background: #111a2f;
  color: #ffffff;
  font-size: 16px;
  outline: none;
}

.form-field input::placeholder {
  color: #7f94b1;
}

.form-field input:focus {
  border-color: #45a4ff;
  box-shadow: 0 0 0 3px rgba(69, 164, 255, 0.18);
}

.form-field input:disabled {
  cursor: wait;
  opacity: 0.72;
}

.readonly-card {
  display: grid;
  min-height: 68px;
  align-content: center;
  gap: 8px;
  padding: 0 16px;
  border-radius: 8px;
  background: #111a2f;
}

.readonly-card strong {
  font-size: 17px;
  font-weight: 800;
  line-height: 1.2;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.primary-button,
.secondary-button {
  min-height: 40px;
  padding: 0 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
}

.primary-button {
  border: 0;
  background: #2265f4;
  color: #ffffff;
}

.primary-button:hover:not(:disabled) {
  background: #1f55ca;
}

.secondary-button {
  border: 1px solid #4d6079;
  background: transparent;
  color: #ffffff;
}

.secondary-button:hover:not(:disabled) {
  background: #111a2f;
}

.primary-button:disabled,
.secondary-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.account-setting-message {
  width: 100%;
  margin: 8px 0 0;
  font-size: 13px;
  font-weight: 700;
}

.account-setting-message--error {
  color: #ff7382;
}

.account-setting-message--success {
  color: #77d99a;
}

@media (max-width: 900px) {
  .account-setting-page {
    padding: 18px 14px 16px;
  }

  .account-setting-panel {
    padding: 16px;
  }

  .form-grid,
  .readonly-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .account-setting-hero {
    align-items: flex-start;
  }

  .account-setting-hero h1 {
    font-size: 28px;
  }

  .profile-preview {
    align-items: flex-start;
    padding: 18px;
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .primary-button,
  .secondary-button {
    width: 100%;
  }
}
</style>
