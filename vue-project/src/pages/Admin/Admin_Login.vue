<template>
  <AuthLoginPage
    admin
    title="管理者ログイン"
    description="管理者アカウントでログインしてください。"
    brand-accent="管理"
    brand-copy="PHISH-TRAPの<strong>管理画面</strong>へアクセスします"
    submit-label="管理者としてログイン"
    alternate-login-label="利用者の方はこちら"
    alternate-login-to="/"
    :loading="loading"
    :error-message="errorMessage"
    @submit="handleLogin"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthLoginPage from '@/components/auth/AuthLoginPage.vue'
import { loginAdmin } from '@/api/users'

const errorMessage = ref('')
const loading = ref(false)
const router = useRouter()
const route = useRoute()

function getRedirectPath() {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/admin') ? redirect : '/admin_overview'
}

async function handleLogin({ email, password }: { email: string; password: string }) {
  loading.value = true
  errorMessage.value = ''

  try {
    await loginAdmin(email, password)
    await router.push(getRedirectPath())
  } catch (error) {
    console.error('管理者ログインエラー:', error)
    errorMessage.value =
      error instanceof Error ? error.message : 'メールアドレスまたはパスワードが間違っています。'
  } finally {
    loading.value = false
  }
}
</script>
