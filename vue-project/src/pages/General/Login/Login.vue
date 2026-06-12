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
    <form class="auth-form" @submit.prevent="handleLogin">
    <div class="form-heading">
        <h2>ログイン</h2>
    </div>

    <div class="input-group">
        <label for="email">メールアドレス</label>
        <input id="email" v-model="email" type="email" required placeholder="user@example.com" />
    </div>

    <div class="input-group">
        <label for="password">パスワード</label>
        <input id="password" v-model="password" type="password" required placeholder="••••••••" />
    </div>

    <div class="forgot-password-link">
        <router-link to="/forgotaccount">パスワードを忘れた方はこちら</router-link>
    </div>

    <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

    <button type="submit">ログイン</button>

    <div class="demo-account">

    </div>
    </form>
</section>

<div class="auth-link">
    まだアカウントをお持ちでない方は
    <router-link to="/makeaccount">新規登録</router-link>
</div>

<footer class="auth-footer">開発チーム: 防人人（さきもりんちゅ）</footer>
</main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { loginUser } from '@/api/users'

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const router = useRouter()

const handleLogin = async () => {
try {
errorMessage.value = ''

const user = await loginUser(email.value, password.value)
console.log('ログイン成功!', user)
await router.push('/mailbox')
} catch (error: any) {
console.error('ログインエラー:', error)
errorMessage.value =
    error instanceof Error ? error.message : 'メールアドレスかパスワードが間違っています。'
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

.alert-icon {
stroke: #b68a1d;
}

.alert-icon circle {
fill: #b68a1d;
stroke: none;
}

h1 {
margin: 0;
font-size: clamp(34px, 4.4vw, 42px);
font-weight: 800;
line-height: 1.15;
}

h1 span,
.brand-area strong {
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

button:hover {
background: #1e55dc;
}

.demo-account {
display: grid;
gap: 4px;
margin-top: 2px;
color: #7892b0;
font-size: 13px;
text-align: center;
}

.demo-account p {
margin: 0;
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
