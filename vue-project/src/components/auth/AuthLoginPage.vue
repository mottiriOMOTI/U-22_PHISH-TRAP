<template>
  <main class="auth-page" :class="{ 'auth-page--admin': admin }">
    <section class="brand-area" aria-label="PHISH-TRAP">
      <div class="brand-icons" aria-hidden="true">
        <svg class="shield-icon" viewBox="0 0 48 48" role="img">
          <path
            d="M24 4c4.8 4 9.3 5.6 16 6.2v12.6c0 10.1-6.5 17.6-16 21.2C14.5 40.4 8 32.9 8 22.8V10.2C14.7 9.6 19.2 8 24 4Z"
          />
        </svg>
        <svg class="alert-icon" viewBox="0 0 48 48" role="img">
          <path
            v-if="admin"
            d="M24 7a8 8 0 0 1 8 8v4h3a3 3 0 0 1 3 3v16a3 3 0 0 1-3 3H13a3 3 0 0 1-3-3V22a3 3 0 0 1 3-3h3v-4a8 8 0 0 1 8-8Z"
          />
          <path v-if="admin" d="M18 19v-4a6 6 0 0 1 12 0v4" />
          <circle v-if="admin" cx="24" cy="30" r="2" />
          <path v-if="!admin" d="M24 6 44 40H4L24 6Z" />
          <path v-if="!admin" d="M24 17v11" />
          <circle v-if="!admin" cx="24" cy="34" r="1.6" />
        </svg>
      </div>

      <div v-if="admin" class="admin-badge">
        <span>管理者専用</span>
      </div>

      <h1>
        {{ brandTitle }} <span>{{ brandAccent }}</span>
      </h1>
      <p v-html="brandCopy" />
    </section>

    <section class="auth-card">
      <form class="auth-form" @submit.prevent="submit">
        <div class="form-heading">
          <h2>{{ title }}</h2>
          <p v-if="description">{{ description }}</p>
        </div>

        <div class="input-group">
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
          />
        </div>

        <div class="input-group">
          <label for="password">パスワード</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            maxlength="128"
            placeholder="••••••••"
            autocomplete="current-password"
          />
        </div>

        <div v-if="showForgotLink" class="forgot-password-link">
          <router-link to="/forgotaccount">パスワードを忘れた方はこちら</router-link>
        </div>

        <p v-if="errorMessage" class="error-text" role="alert">{{ errorMessage }}</p>

        <button type="submit" :disabled="loading">
          {{ loading ? 'ログイン中...' : submitLabel }}
        </button>
      </form>
    </section>

    <div v-if="showRegisterLink" class="auth-link">
      まだアカウントをお持ちでない方は
      <router-link to="/makeaccount">新規登録</router-link>
    </div>

    <div v-if="alternateLoginTo" class="auth-link">
      <router-link :to="alternateLoginTo">{{ alternateLoginLabel }}</router-link>
    </div>

    <footer class="auth-footer">開発チーム: 防人（さきもりんちゅ）</footer>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'

withDefaults(
  defineProps<{
    admin?: boolean
    brandTitle?: string
    brandAccent?: string
    brandCopy?: string
    title: string
    description?: string
    submitLabel?: string
    alternateLoginLabel?: string
    alternateLoginTo?: string
    showForgotLink?: boolean
    showRegisterLink?: boolean
    loading?: boolean
    errorMessage?: string
  }>(),
  {
    admin: false,
    brandTitle: 'PHISH-TRAP',
    brandAccent: '防御',
    brandCopy: '知識だけでは防げない、<strong>判断力</strong>を体験しよう',
    description: '',
    submitLabel: 'ログイン',
    alternateLoginLabel: '',
    alternateLoginTo: '',
    showForgotLink: false,
    showRegisterLink: false,
    loading: false,
    errorMessage: '',
  },
)

const emit = defineEmits<{
  submit: [credentials: { email: string; password: string }]
}>()

const email = ref('')
const password = ref('')

function submit() {
  emit('submit', {
    email: email.value,
    password: password.value,
  })
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
  background: radial-gradient(circle at 50% 0%, rgba(52, 83, 130, 0.16), transparent 32%), #142238;
  color: #f8fbff;
}

.auth-page--admin {
  background: radial-gradient(circle at 50% 0%, rgba(214, 70, 84, 0.18), transparent 34%), #172033;
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

.alert-icon {
  stroke: #b68a1d;
}

.auth-page--admin .alert-icon {
  stroke: #ff6d75;
}

.alert-icon circle {
  fill: #b68a1d;
  stroke: none;
}

.auth-page--admin .alert-icon circle {
  fill: #ff6d75;
}

.admin-badge {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 12px;
  margin-bottom: 12px;
  border: 1px solid rgba(255, 109, 117, 0.55);
  border-radius: 999px;
  background: rgba(255, 109, 117, 0.12);
  color: #ffd9dd;
  font-size: 13px;
  font-weight: 800;
}

h1 {
  margin: 0;
  font-size: clamp(34px, 4.4vw, 42px);
  font-weight: 800;
  line-height: 1.15;
}

h1 span,
.brand-area :deep(strong) {
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

.auth-page--admin .auth-card {
  border-color: rgba(255, 109, 117, 0.3);
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

.auth-page--admin .input-group input:focus {
  border-color: #ff6d75;
  box-shadow: 0 0 0 3px rgba(255, 109, 117, 0.2);
}

.error-text {
  margin: 0;
  color: #ff8a95;
  font-size: 14px;
}

.forgot-password-link {
  margin-top: -6px;
  font-size: 13px;
  text-align: right;
}

.forgot-password-link a {
  color: #ffffff;
  font-weight: 800;
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

.auth-page--admin button {
  background: #d83b48;
}

button:hover {
  background: #1e55dc;
}

.auth-page--admin button:hover {
  background: #bd303c;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
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
