<template>
    <div class="login">
        <h1>ログイン画面</h1>
        <form class="login-form" @submit.prevent="handleLogin"> 
            <div class="mail-form">
                <label for="email">メールアドレス</label><br>
                <input type="email" v-model="email" required placeholder="Email" />
            </div>
            <div class="password-form">
                <label for="password">パスワード</label><br>
                <input type="password"  v-model="password" required placeholder="Password" />
            </div>
            <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
            <button type="submit">ログイン</button>
        </form>
    </div>

</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { loginUser } from '@/api/users'

const email = ref('')
const password = ref('')
const errorMessage = ref('')     //変数宣言
const router = useRouter()

const handleLogin = async () => {
    try { errorMessage.value = ''

    const user = await loginUser(email.value, password.value)   //API呼び出し
    // ログイン成功時の処理
    console.log('ログイン成功!', user)
    alert('ようこそ、' + user.name + 'さん！')  //ユーザー名を表示
    await router.push('/mailbox')
    } catch (error: any) {
    console.error('ログインエラー:', error)
    errorMessage.value =
        error instanceof Error ? error.message : 'メールアドレスかパスワードが間違っています。'   //エラーメッセージの設定
    }
}
</script>

<style lang="css" scoped>
    .login-container {
        max-width: 400px;
        margin: 50px auto;
        padding: 20px;
        border: 1px solid #ccc;
        border-radius: 8px;
    }
    .input-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
}

    .input-group input {
        width: 100%;
        padding: 20px;
        background-color: #000000;
  /* 略 */
}

.login-form {
  border: 1px solid #ccc; /* 枠線を */
  border-radius: 8px;     /* 角を丸く */
  padding: 20px;          /* 内側に余白を */
  box-shadow: 0 4px 8px rgba(0,0,0,0.1); /* 影をつける */
    background-color: #e9e7e7; /* 背景色を薄いグレーに */
}

    .error-text {
        color: red;
        font-size: 14px;
}

    button {
        width: 20%;
        margin: 10px;
        margin-left: 40%;
        background-color: #7b7b7b; /* 緑色 */
        color: white; /* 文字は白色 */
        cursor: pointer;
}

    button:hover {
        background-color: #45a049; /* 少し暗い緑色 */
}
h1
{
    text-align: center;
    margin-bottom: 20px;
}

input{
    border: 1px solid #565454;
    background-color: #ffffff; 
}
</style>
