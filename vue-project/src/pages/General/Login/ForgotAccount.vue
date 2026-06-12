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

<style lang="css" scoped>
.auth-page {
  min-height: 100vh;
  width: 100vw;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: -40px calc(50% - 50vw) -16px;
  padding: 48px 20px 26px;
  background:
    radial-gradient(circle at 50% 0%, rgba(52, 83, 130, 0.16), transparent 32%),
    #142238;
  color: #f8fbff;
}

.auth-page,
.auth-page * {
  box-sizing: border-box;
}

.brand-area {
  width: min(100%, 560px);
  text-align: center;
}

.brand-icons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 18px;
  margin-bottom: 16px;
}

.brand-icons svg {
  width: 46px;
  height: 46px;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 4;
}

.shield-icon {
  stroke: #ff3948;
}

.mail-icon {
  stroke: #45a4ff;
}

h1 {
  margin: 0;
  font-size: clamp(34px, 4.4vw, 42px);
  font-weight: 800;
  line-height: 1.15;
}

h1 span {
  color: #ff3948;
}

.brand-area p {
  margin: 8px 0 26px;
  color: #9bb1cb;
  font-size: 16px;
}

.auth-card {
  width: min(100%, 560px);
  padding: 28px 30px;
  border: 1px solid #31455f;
  border-radius: 16px;
  background: rgba(25, 39, 62, 0.92);
  box-shadow: 0 22px 70px rgba(5, 12, 24, 0.26);
}

.auth-form {
  display: grid;
  gap: 16px;
}

.form-heading h2 {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 800;
}

.form-heading p {
  margin: 0;
  color: #9bb1cb;
}

.input-group {
  display: grid;
  gap: 8px;
}

.input-group label {
  font-weight: 700;
}

.input-group input {
  width: 100%;
  min-height: 44px;
  padding: 0 16px;
  border: 1px solid #4b607b;
  border-radius: 9px;
  background: #354761;
  color: #ffffff;
  font-size: 16px;
  outline: none;
}

.input-group input::placeholder {
  color: #a5b6cc;
}

.input-group input:focus {
  border-color: #2c68ff;
  box-shadow: 0 0 0 3px rgba(44, 104, 255, 0.22);
}

.input-group input:disabled {
  cursor: wait;
  opacity: 0.75;
}

.error-text,
.success-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.45;
}

.error-text {
  color: #ff8a95;
}

.success-text {
  color: #6ee7a8;
}

button {
  min-height: 44px;
  border: 0;
  border-radius: 9px;
  background: #2463ff;
  color: #ffffff;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
}

button:hover:not(:disabled) {
  background: #1e55dc;
}

button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.auth-link {
  width: min(100%, 560px);
  margin-top: 12px;
  color: #8fa8c6;
  font-size: 13px;
  text-align: center;
}

.auth-link a {
  color: #ffffff;
  font-weight: 800;
}

.auth-footer {
  margin-top: 22px;
  color: #7892b0;
  font-size: 14px;
}

@media (max-height: 760px) {
  .auth-page {
    padding: 28px 18px 18px;
  }

  .brand-icons {
    margin-bottom: 10px;
  }

  .brand-icons svg {
    width: 40px;
    height: 40px;
  }

  h1 {
    font-size: 34px;
  }

  .brand-area p {
    margin: 6px 0 18px;
    font-size: 14px;
  }

  .auth-card {
    padding: 24px 30px;
  }

  .auth-form {
    gap: 14px;
  }

  .input-group input,
  button {
    min-height: 42px;
  }

  .auth-link {
    margin-top: 10px;
  }

  .auth-footer {
    margin-top: 16px;
    font-size: 13px;
  }
}

@media (max-width: 640px) {
  .auth-page {
    padding: 34px 14px 22px;
  }

  .brand-icons svg {
    width: 40px;
    height: 40px;
  }

  .auth-card {
    padding: 24px 20px;
    border-radius: 14px;
  }
}
</style>
