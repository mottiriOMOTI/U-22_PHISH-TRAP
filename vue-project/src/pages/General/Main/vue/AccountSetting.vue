<template>
  <main class="account-setting-page" :aria-busy="isBusy ? 'true' : 'false'">
    <header class="account-setting-hero">
      <v-icon icon="mdi-account-cog-outline" class="account-setting-hero__icon" />
      <div>
        <h1>アカウント変更</h1>
        <p>プロフィールとログイン情報の変更</p>
      </div>
      <button
        class="secondary-button account-setting-back-button"
        type="button"
        :disabled="isBusy"
        @click="handleBack"
      >
        元に戻る
      </button>
    </header>

    <section class="account-setting-panel">
      <div class="account-setting-panel__header">
        <h2>アカウント編集</h2>
        <p>表示名、メールアドレス、アイコン、パスワードを更新します</p>
      </div>

      <div class="profile-preview">
        <button
          class="profile-avatar profile-avatar--button"
          type="button"
          aria-label="アイコン画像を変更"
          :disabled="isBusy"
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
          :disabled="isBusy"
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
              :disabled="isBusy"
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
              :disabled="isBusy"
            />
          </label>
        </div>

        <div class="form-actions">
          <button class="primary-button" type="submit" :disabled="isBusy || !hasChanges">
            {{ isSaving ? '保存中...' : '保存する' }}
          </button>
        </div>
      </form>

      <form class="account-form password-section" @submit.prevent="handlePasswordChange">
        <div class="password-section__header">
          <h3>パスワード変更</h3>
          <p>現在のパスワードを確認してから、新しいパスワードへ更新します</p>
        </div>

        <div class="form-grid password-form-grid">
          <label class="form-field" for="currentPassword">
            <span>現在のパスワード</span>
            <input
              id="currentPassword"
              v-model="passwordForm.currentPassword"
              type="password"
              autocomplete="current-password"
              maxlength="128"
              :disabled="isBusy"
            />
          </label>

          <label class="form-field" for="newPassword">
            <span>新しいパスワード</span>
            <input
              id="newPassword"
              v-model="passwordForm.newPassword"
              type="password"
              autocomplete="new-password"
              maxlength="128"
              :disabled="isBusy"
            />
          </label>

          <label class="form-field" for="newPasswordConfirm">
            <span>新しいパスワード（確認）</span>
            <input
              id="newPasswordConfirm"
              v-model="passwordForm.confirmPassword"
              type="password"
              autocomplete="new-password"
              maxlength="128"
              :disabled="isBusy"
            />
          </label>
        </div>

        <p class="password-hint">
          12文字以上で、英大文字・英小文字・数字・記号をすべて含めてください。
        </p>

        <div class="form-actions">
          <button
            class="primary-button"
            type="submit"
            :disabled="isBusy || !hasPasswordInput"
          >
            {{ isChangingPassword ? '変更中...' : 'パスワードを変更する' }}
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

import {
  fetchCurrentUserById,
  getCurrentUser,
  updateCurrentUserImage,
  updateCurrentUserPassword,
  updateCurrentUserProfile,
  validateNewPassword,
  validateUserImageFile,
  type CurrentUser,
} from '@/api/users'

const router = useRouter()

const form = reactive({
  name: '',
  email: '',
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const original = reactive({
  name: '',
  email: '',
})

const currentUser = ref<CurrentUser | null>(null)
const isLoading = ref(true)
const isSaving = ref(false)
const isChangingPassword = ref(false)
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

const hasProfileChanges = computed(() => {
  return form.name.trim() !== original.name || form.email.trim() !== original.email
})

const hasChanges = computed(() => hasProfileChanges.value || selectedAvatarFile.value !== null)

const hasPasswordInput = computed(() => {
  return Boolean(
    passwordForm.currentPassword || passwordForm.newPassword || passwordForm.confirmPassword,
  )
})

const isBusy = computed(() => isLoading.value || isSaving.value || isChangingPassword.value)

function applyUser(user: CurrentUser) {
  currentUser.value = user
  avatarImageError.value = false
  form.name = user.name.trim() || 'ユーザー'
  form.email = user.email
  original.name = form.name
  original.email = form.email
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

async function handleBack() {
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

function validatePasswordForm() {
  if (!passwordForm.currentPassword) {
    showError('現在のパスワードを入力してください')
    return false
  }

  if (!passwordForm.newPassword) {
    showError('新しいパスワードを入力してください')
    return false
  }

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    showError('新しいパスワードと確認用パスワードが一致しません')
    return false
  }

  const passwordValidationError = validateNewPassword(passwordForm.newPassword, {
    email: form.email,
    name: form.name,
  })

  if (passwordValidationError) {
    showError(passwordValidationError)
    return false
  }

  return true
}

function clearPasswordForm() {
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
}

async function loadAccountSetting() {
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  const user = getCurrentUser()

  if (user) {
    applyUser(user)
    try {
      const refreshedUser = await fetchCurrentUserById(user.id)
      applyUser(refreshedUser)
    } catch (error) {
      console.error(error)
    }
  } else {
    showError('ログイン中のユーザー情報が見つかりません')
  }

  isLoading.value = false
}

async function handlePasswordChange() {
  if (isBusy.value || !currentUser.value || !validatePasswordForm()) {
    return
  }

  isChangingPassword.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await updateCurrentUserPassword({
      id: currentUser.value.id,
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    })
    clearPasswordForm()
    showSuccess('パスワードを変更しました')
  } catch (error) {
    console.error(error)
    showError(error instanceof Error ? error.message : 'パスワードの変更に失敗しました')
  } finally {
    isChangingPassword.value = false
  }
}

async function handleSave() {
  if (isBusy.value || !currentUser.value || !validateForm()) {
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
