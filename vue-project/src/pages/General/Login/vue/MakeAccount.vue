<template>
<main class="auth-page">
<section class="brand-area" aria-label="PHISH-TRAP">
<div class="brand-icons" aria-hidden="true">
<svg class="shield-icon" viewBox="0 0 48 48" role="img">
    <path
    d="M24 4c4.8 4 9.3 5.6 16 6.2v12.6c0 10.1-6.5 17.6-16 21.2C14.5 40.4 8 32.9 8 22.8V10.2C14.7 9.6 19.2 8 24 4Z"
    />
</svg>
<svg class="alert-icon" viewBox="0 0 48 48" role="img">
    <path d="M24 6 44 40H4L24 6Z" />
    <path d="M24 17v11" />
    <circle cx="24" cy="34" r="1.6" />
</svg>
</div>
<h1>PHISH-TRAP <span>死線</span></h1>
<p>知識では防げない。<strong>恐怖</strong>を体験しよう</p>
</section>

<section class="auth-card">
<form class="auth-form" @submit.prevent="handleRegister">
<div class="form-heading">
    <h2>新規アカウント作成</h2>
    <p>アカウント情報を入力してください</p>
</div>

<div class="input-group">
    <label for="name">お名前（ニックネーム可）</label>
    <input id="name" v-model="name" type="text" required placeholder="山田 太郎" />
</div>

<div class="input-group">
    <label for="email">メールアドレス</label>
    <input id="email" v-model="email" type="email" required placeholder="user@example.com" />
</div>

<div class="input-group">
    <label for="password">パスワード</label>
    <input
    id="password"
    v-model="password"
    type="password"
    required
    minlength="6"
    placeholder="6文字以上で入力"
    />
</div>

<div class="input-group">
    <label for="passwordConfirm">パスワード（確認用）</label>
    <input
    id="passwordConfirm"
    v-model="passwordConfirm"
    type="password"
    required
    placeholder="もう一度入力してください"
    />
</div>

<div class="policy-links">
    <router-link to="/privacypolicy">プライバシーポリシー</router-link>
    <router-link to="/termsofservice">利用規約</router-link>
</div>

<label class="agreement-check">
    <input v-model="agreedToPolicies" type="checkbox" required />
    <span>プライバシーポリシーと利用規約を確認し、同意します。</span>
</label>

<p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

<button type="submit" :disabled="isSubmitting">登録する</button>
</form>
</section>

<div class="auth-link">
すでにアカウントをお持ちの方は
<router-link to="/">ログイン</router-link>
</div>

<footer class="auth-footer">開発チーム: 防人人（さきもりんちゅ）</footer>
</main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { registerUser } from '@/api/users.ts'

const name = ref('')
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const agreedToPolicies = ref(false)
const errorMessage = ref('')
const isSubmitting = ref(false)
const router = useRouter()

const handleRegister = async () => {
if (isSubmitting.value) {
return
}

errorMessage.value = ''

if (!agreedToPolicies.value) {
errorMessage.value = 'プライバシーポリシーと利用規約を確認し、同意してください。'
return
}

if (password.value !== passwordConfirm.value) {
errorMessage.value = 'パスワードが一致しません。'
return
}

try {
isSubmitting.value = true
console.log('3. API(registerUser)を呼び出します', { name: name.value, email: email.value })
const newUser = await registerUser(name.value, email.value, password.value)

console.log('4. APIからの返り値:', newUser)
console.log('登録成功！', newUser)
await router.push('/mailbox')
} catch (error: any) {
console.error(error)
errorMessage.value =
error instanceof Error
? error.message
: 'アカウントの作成に失敗しました。別のメールアドレスをお試しください。'
} finally {
isSubmitting.value = false
}
}
</script>

<style lang="css" scoped src="../css/MakeAccount.css"></style>
