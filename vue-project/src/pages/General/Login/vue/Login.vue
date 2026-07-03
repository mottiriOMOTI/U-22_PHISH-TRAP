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
import { useRouter } from 'vue-router'
import AuthLoginPage from '@/components/auth/AuthLoginPage.vue'
import { loginLearner } from '@/api/users'

const errorMessage = ref('')
const loading = ref(false)
const router = useRouter()

async function handleLogin({ email, password }: { email: string; password: string }) {
  loading.value = true
  errorMessage.value = ''

  try {
    await loginLearner(email, password)
    await router.push('/mailbox')
  } catch (error) {
    console.error('ログインエラー:', error)
    errorMessage.value =
      error instanceof Error ? error.message : 'メールアドレスまたはパスワードが間違っています。'
  } finally {
    loading.value = false
  }
}
</script>
