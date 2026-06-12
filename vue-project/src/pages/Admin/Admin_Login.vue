<template>
  <AuthLoginPage
    admin
    title="管理者ログイン"
    description="管理者アカウントでログインしてください。"
    brand-accent="管理"
    brand-copy="PHISH-TRAPの<strong>管理画面</strong>へアクセスします"
    submit-label="管理者としてログイン"
    :loading="loading"
    :error-message="errorMessage"
    @submit="handleLogin"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthLoginPage from '@/components/auth/AuthLoginPage.vue'
import { clearCurrentUser, loginUser } from '@/api/users'

const errorMessage = ref('')
const loading = ref(false)
const router = useRouter()

async function handleLogin({ email, password }: { email: string; password: string }) {
  loading.value = true
  errorMessage.value = ''

  try {
    const user = await loginUser(email, password)

    if (user.role !== 'admin') {
      clearCurrentUser()
      errorMessage.value = '管理者アカウントではありません。'
      return
    }

    await router.push('/admin_overview')
  } catch (error) {
    console.error('管理者ログインエラー:', error)
    errorMessage.value =
      error instanceof Error ? error.message : 'メールアドレスまたはパスワードが間違っています。'
  } finally {
    loading.value = false
  }
}
</script>
