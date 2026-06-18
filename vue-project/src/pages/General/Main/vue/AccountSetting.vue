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
        <button
          class="profile-avatar profile-avatar--button"
          type="button"
          aria-label="アイコン画像を変更"
          :disabled="isLoading || isSaving"
          @click="openAvatarFilePicker"
        >
          <img
            v-if="profileImageUrl"
            :src="profileImageUrl"
            alt=""
            class="profile-avatar__image"
            @error="handleAvatarImageError"
          />
          <span v-else>{{ avatarInitial }}</span>
          <span class="profile-avatar__overlay" aria-hidden="true">
            <v-icon icon="mdi-camera-outline" />
          </span>
        </button>
        <input
          ref="avatarFileInput"
          class="avatar-file-input"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          :disabled="isLoading || isSaving"
          @change="handleAvatarFileChange"
        />
        <div class="profile-summary">
          <strong>{{ form.name || 'ユーザー' }}</strong>
          <span>
            <v-icon icon="mdi-email-outline" />
            {{ form.email || 'メールアドレス未設定' }}
          </span>
          <div v-if="selectedAvatarFile" class="profile-image-actions">
            <span class="selected-image-name">
              {{ selectedAvatarFile.name }}
            </span>
          </div>
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
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { fetchAccountSummary } from '@/api/account'
import {
  fetchCurrentUserById,
  getCurrentUser,
  updateCurrentUserImage,
  updateCurrentUserProfile,
  validateUserImageFile,
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
const avatarImageError = ref(false)
const avatarFileInput = ref<HTMLInputElement | null>(null)
const selectedAvatarFile = ref<File | null>(null)
const selectedAvatarPreview = ref('')

const profileImageUrl = computed(() => {
  if (selectedAvatarPreview.value) {
    return selectedAvatarPreview.value
  }

  const image = currentUser.value?.image?.trim()
  return image && !avatarImageError.value ? image : ''
})

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

const hasProfileChanges = computed(() => {
  return form.name.trim() !== original.name || form.email.trim() !== original.email
})

const hasChanges = computed(() => hasProfileChanges.value || selectedAvatarFile.value !== null)

function applyUser(user: CurrentUser) {
  currentUser.value = user
  avatarImageError.value = false
  form.name = user.name.trim() || 'ユーザー'
  form.email = user.email
  original.name = form.name
  original.email = form.email
  profile.joinedAt = user.created_at
}

function handleAvatarImageError() {
  avatarImageError.value = true
}

function openAvatarFilePicker() {
  avatarFileInput.value?.click()
}

function clearSelectedAvatarFile() {
  if (selectedAvatarPreview.value) {
    URL.revokeObjectURL(selectedAvatarPreview.value)
  }

  selectedAvatarFile.value = null
  selectedAvatarPreview.value = ''

  if (avatarFileInput.value) {
    avatarFileInput.value.value = ''
  }
}

function handleAvatarFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  const validationError = validateUserImageFile(file)

  if (validationError) {
    showError(validationError)
    input.value = ''
    return
  }

  if (selectedAvatarPreview.value) {
    URL.revokeObjectURL(selectedAvatarPreview.value)
  }

  selectedAvatarFile.value = file
  selectedAvatarPreview.value = URL.createObjectURL(file)
  avatarImageError.value = false
  errorMessage.value = ''
  successMessage.value = ''
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
    try {
      applyUser(await fetchCurrentUserById(user.id))
    } catch (error) {
      console.error(error)
    }
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
    let updatedUser: CurrentUser | null = null

    if (hasProfileChanges.value) {
      updatedUser = await updateCurrentUserProfile({
        id: currentUser.value.id,
        name: form.name.trim(),
        email: form.email.trim(),
      })

      applyUser(updatedUser)
    }

    if (selectedAvatarFile.value) {
      updatedUser = await updateCurrentUserImage(
        updatedUser?.id ?? currentUser.value.id,
        selectedAvatarFile.value,
      )
      clearSelectedAvatarFile()
      applyUser(updatedUser)
    }

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
onBeforeUnmount(clearSelectedAvatarFile)

</script>

<style src="../../Main.css"></style>
<style lang="css" scoped src="../css/AccountSetting.css"></style>

