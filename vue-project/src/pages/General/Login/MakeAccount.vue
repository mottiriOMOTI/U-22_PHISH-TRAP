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
<p v-if="successMessage" class="success-text">{{ successMessage }}</p>

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
const successMessage = ref('')
const isSubmitting = ref(false)
const router = useRouter()

const handleRegister = async () => {
if (isSubmitting.value) {
return
}

errorMessage.value = ''
successMessage.value = ''

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
successMessage.value = '登録が完了しました。'
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

<style lang="css" scoped>
.auth-page {
min-height: 100vh;
width: 100vw;
box-sizing: border-box;
display: flex;
flex-direction: column;
align-items: center;
margin: -40px calc(50% - 50vw) -16px;
padding: 30px 20px 20px;
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
margin-bottom: 10px;
}

.brand-icons svg {
width: 40px;
height: 40px;
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

.alert-icon circle {
fill: #b68a1d;
stroke: none;
}

h1 {
margin: 0;
font-size: clamp(30px, 4.4vw, 38px);
font-weight: 800;
line-height: 1.15;
}

h1 span,
.brand-area strong {
color: #ff3948;
}

.brand-area p {
margin: 6px 0 14px;
color: #9bb1cb;
font-size: 14px;
}

.auth-card {
width: min(100%, 560px);
padding: 22px 28px;
border: 1px solid #344862;
border-radius: 16px;
background: rgba(24, 38, 61, 0.9);
box-shadow: 0 22px 70px rgba(5, 12, 24, 0.26);
}

.auth-form {
display: grid;
gap: 10px;
}

.form-heading h2 {
margin: 0 0 4px;
font-size: 17px;
font-weight: 800;
}

.form-heading p {
margin: 0;
color: #9bb1cb;
font-size: 14px;
}

.input-group {
display: grid;
gap: 4px;
}

.input-group label {
font-size: 14px;
font-weight: 700;
}

.input-group input {
width: 100%;
min-height: 38px;
padding: 0 16px;
border: 1px solid #4d6079;
border-radius: 9px;
background: #354762;
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

.policy-links {
display: flex;
flex-wrap: wrap;
gap: 14px;
margin-top: 0;
font-size: 14px;
}

.policy-links a,
.auth-link a {
color: #ffffff;
font-weight: 800;
}

.agreement-check {
display: flex;
align-items: flex-start;
gap: 10px;
color: #b9c7d9;
font-size: 13px;
line-height: 1.45;
cursor: pointer;
}

.agreement-check input {
width: 16px;
height: 16px;
margin-top: 2px;
accent-color: #2463ff;
cursor: pointer;
}

.error-text,
.success-text {
margin: 0;
font-size: 13px;
}

.error-text {
color: #ff8a95;
}

.success-text {
color: #6ee7a8;
}

button {
min-height: 40px;
border: 0;
border-radius: 9px;
background: #2463ff;
color: #ffffff;
font-size: 16px;
font-weight: 800;
cursor: pointer;
}

button:hover {
background: #1e55dc;
}

button:disabled {
cursor: wait;
opacity: 0.65;
}

.auth-link {
width: min(100%, 560px);
margin-top: 10px;
color: #8fa8c6;
font-size: 13px;
text-align: center;
}

.auth-footer {
margin-top: 12px;
color: #7892b0;
font-size: 13px;
}

@media (max-height: 760px) {
.auth-page {
padding: 18px 18px 12px;
}

.brand-icons {
margin-bottom: 6px;
}

.brand-icons svg {
width: 34px;
height: 34px;
}

h1 {
font-size: 30px;
}

.brand-area p {
margin: 4px 0 10px;
font-size: 13px;
}

.auth-card {
padding: 18px 26px;
}

.auth-form {
gap: 8px;
}

.input-group input {
min-height: 34px;
}

button {
min-height: 36px;
}

.auth-link {
margin-top: 8px;
}

.auth-footer {
margin-top: 8px;
}
}

@media (max-width: 640px) {
.auth-page {
padding: 18px 14px 14px;
}

.brand-icons svg {
width: 34px;
height: 34px;
}

.auth-card {
padding: 18px 18px;
border-radius: 14px;
}

.agreement-check {
font-size: 14px;
}
}
</style>
