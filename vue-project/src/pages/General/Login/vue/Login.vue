<template>
  <AuthLoginPage
    title="ログイン"
    description="ログインしてください。"
    alternate-login-label="管理者の方はこちら"
    alternate-login-to="/admin_login"
    show-forgot-link
    show-register-link
    :loading="loading"
    :error-message="errorMessage"
    @submit="handleLogin"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthLoginPage from '@/components/auth/AuthLoginPage.vue'
import { loginLearner } from '@/api/users'

const errorMessage = ref('')
const loading = ref(false)
const router = useRouter()
const route = useRoute()

function getRedirectPath() {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/mailbox'
}

async function handleLogin({ email, password }: { email: string; password: string }) {
  loading.value = true
  errorMessage.value = ''

  try {
    await loginLearner(email, password)
    await router.push(getRedirectPath())
  } catch (error) {
    console.error('ログインエラー:', error)
    errorMessage.value =
      error instanceof Error ? error.message : 'メールアドレスまたはパスワードが間違っています。'
  } finally {
    loading.value = false
  }
}
</script>
