<template>
  <main class="auth-page">
    <section class="brand-area" aria-label="PHISH-TRAP">
      <div class="brand-icons" aria-hidden="true">
        <svg class="shield-icon" viewBox="0 0 48 48" role="img">
          <path
            d="M24 4c4.8 4 9.3 5.6 16 6.2v12.6c0 10.1-6.5 17.6-16 21.2C14.5 40.4 8 32.9 8 22.8V10.2C14.7 9.6 19.2 8 24 4Z"
          />
        </svg>
        <svg class="mail-icon" viewBox="0 0 48 48" role="img">
          <path d="M8 14h32v22H8z" />
          <path d="m9 15 15 12 15-12" />
        </svg>
      </div>
      <h1>PHISH-TRAP <span>死線</span></h1>
      <p>
        {{
          resetToken
            ? '新しいパスワードを設定します'
            : '登録済みメールアドレスへパスワードリセット案内を送信します'
        }}
      </p>
    </section>

    <section class="auth-card">
      <form
        class="auth-form"
        @submit.prevent="resetToken ? handleResetPassword() : handleSendResetMail()"
      >
        <div class="form-heading">
          <h2>{{ resetToken ? '新しいパスワードを設定' : 'パスワードをお忘れの方' }}</h2>
          <p>
            {{
              resetToken
                ? '安全のため、推測されにくいパスワードを設定してください'
                : 'アカウントに登録したメールアドレスを入力してください'
            }}
          </p>
        </div>

        <div v-if="!resetToken" class="input-group">
          <label for="email">メールアドレス</label>
          <input
            id="email"
            v-model.trim="email"
            type="email"
            required
            maxlength="254"
            placeholder="user@example.com"
            autocomplete="email"
            autocapitalize="none"
            spellcheck="false"
            :disabled="isSending"
          />
        </div>

        <template v-else>
          <div class="input-group">
            <label for="newPassword">新しいパスワード</label>
            <input
              id="newPassword"
              v-model="newPassword"
              type="password"
              required
              minlength="12"
              maxlength="128"
              placeholder="12文字以上・英大小文字/数字/記号"
              autocomplete="new-password"
              :disabled="isSending"
            />
          </div>

          <div class="input-group">
            <label for="newPasswordConfirm">新しいパスワード（確認用）</label>
            <input
              id="newPasswordConfirm"
              v-model="newPasswordConfirm"
              type="password"
              required
              minlength="12"
              maxlength="128"
              placeholder="もう一度入力してください"
              autocomplete="new-password"
              :disabled="isSending"
            />
          </div>
        </template>

        <p v-if="errorMessage" class="error-text" role="alert">{{ errorMessage }}</p>
        <p v-if="successMessage" class="success-text" role="status">{{ successMessage }}</p>

        <button type="submit" :disabled="isSending">
          {{ isSending ? '処理中...' : resetToken ? 'パスワードを再設定' : 'リセット案内を送信' }}
        </button>
      </form>
    </section>

    <div class="auth-link">
      パスワードを思い出した方は
      <router-link to="/">ログイン</router-link>
    </div>

    <footer class="auth-footer">開発チーム: 防人（さきもりんちゅ）</footer>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { confirmPasswordReset, requestPasswordReset, validateNewPassword } from '@/api/users'

const email = ref('')
const newPassword = ref('')
const newPasswordConfirm = ref('')
const isSending = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const route = useRoute()
const router = useRouter()

const resetToken = computed(() => {
  const token = route.query.token
  return typeof token === 'string' ? token : ''
})

async function handleSendResetMail() {
  if (isSending.value) {
    return
  }

  errorMessage.value = ''
  successMessage.value = ''

  const normalizedEmail = email.value.trim().toLowerCase()

  if (!normalizedEmail) {
    errorMessage.value = 'メールアドレスを入力してください。'
    return
  }

  isSending.value = true

  try {
    const response = await requestPasswordReset(normalizedEmail)
    successMessage.value = response.message
  } catch (error) {
    console.error(error)
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'パスワード再設定の受付に失敗しました。時間をおいて再度お試しください。'
  } finally {
    isSending.value = false
  }
}

async function handleResetPassword() {
  if (isSending.value) {
    return
  }

  errorMessage.value = ''
  successMessage.value = ''

  if (newPassword.value !== newPasswordConfirm.value) {
    errorMessage.value = 'パスワードが一致しません。'
    return
  }

  const passwordValidationError = validateNewPassword(newPassword.value)

  if (passwordValidationError) {
    errorMessage.value = passwordValidationError
    return
  }

  isSending.value = true

  try {
    await confirmPasswordReset(resetToken.value, newPassword.value)
    successMessage.value = 'パスワードを再設定しました。新しいパスワードでログインしてください。'
    newPassword.value = ''
    newPasswordConfirm.value = ''
    await router.replace('/forgotaccount')
  } catch (error) {
    console.error(error)
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'パスワードの再設定に失敗しました。リンクを確認して再度お試しください。'
  } finally {
    isSending.value = false
  }
}
</script>

<style lang="css" scoped src="../css/ForgotAccount.css"></style>
