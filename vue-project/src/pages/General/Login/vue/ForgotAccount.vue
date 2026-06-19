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
      <p>登録済みメールアドレスへパスワードリセットメールを送信します</p>
    </section>

    <section class="auth-card">
      <form class="auth-form" @submit.prevent="handleSendResetMail">
        <div class="form-heading">
          <h2>パスワードをお忘れの方</h2>
          <p>アカウントに登録したメールアドレスを入力してください</p>
        </div>

        <div class="input-group">
          <label for="email">メールアドレス</label>
          <input
            id="email"
            v-model.trim="email"
            type="email"
            required
            placeholder="user@example.com"
            :disabled="isSending"
          />
        </div>

        <p v-if="errorMessage" class="error-text" role="alert">{{ errorMessage }}</p>
        <p v-if="successMessage" class="success-text" role="status">{{ successMessage }}</p>

        <button type="submit" :disabled="isSending">
          {{ isSending ? '送信中...' : 'リセットメールを送信' }}
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
import { ref } from 'vue'

import { supabase } from '@/lib/supabaseClient'

const email = ref('')
const isSending = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

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
    const redirectTo = `${window.location.origin}/forgotaccount`
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo,
    })

    if (error) {
      throw error
    }

    successMessage.value =
      'パスワードリセットメールを送信しました。メール内の案内に従って再設定してください。'
  } catch (error) {
    console.error(error)
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'パスワードリセットメールの送信に失敗しました。時間をおいて再度お試しください。'
  } finally {
    isSending.value = false
  }
}
</script>

<style lang="css" scoped src="../css/ForgotAccount.css"></style>
