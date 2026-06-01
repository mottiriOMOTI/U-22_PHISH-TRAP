<template>
<div class="register-container">
    <h1>新規アカウント作成</h1>
    
    <form class="profile-form" @submit.prevent="handleRegister">
    <!-- 【新規】名前の入力欄 -->
    <div class="input-group">
        <label>お名前（ニックネーム可）</label>
        <input type="text" v-model="name" required placeholder="山田 太郎" />
    </div>

    <div class="input-group">
        <label>メールアドレス</label>
        <input type="email" v-model="email" required placeholder="example@email.com" />
    </div>

    <div class="input-group">
        <label>パスワード</label>
        <input type="password" v-model="password" required placeholder="6文字以上で入力" minlength="6" />
    </div>

    <div class="input-group">
        <label>パスワード（確認用）</label>
        <input type="password" v-model="passwordConfirm" required placeholder="もう一度入力してください" />
    </div>

    <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
    <p v-if="successMessage" class="success-text">{{ successMessage }}</p>

    <button type="submit">登録する</button>

    </form>
<!-- Register.vue の下部 -->
<div class="link-to-login">
    すでにアカウントをお持ちですか？ 
    <router-link to="/">ログインはこちら</router-link> <!-- 👈 「/」にする -->
</div>


</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { registerUser } from '@/api/users'


const name = ref('')
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const errorMessage = ref('')
const successMessage = ref('')

const hashPassword = async (rawPassword: string): Promise<string> => {
    // 文字列をバイト配列に変換
    const encoder = new TextEncoder()
    const data = encoder.encode(rawPassword)
    
    // Web Crypto API を使ってハッシュ化 (SHA-256)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    
    // バッファを16進数の文字列に変換
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    
    return hashHex
}

const handleRegister = async () => {
errorMessage.value = ''


  // 【安全装置】パスワードと確認用パスワードが同じかチェック！
if (password.value !== passwordConfirm.value) {
    errorMessage.value = 'パスワードが一致しません。'
 
    return // ここで処理をストップする
}

try {
     // 【追加】パスワードをハッシュ化する
        const hashedPassword = await hashPassword(password.value)
        
    console.log('3. API(registerUser)を呼び出します', { name: name.value, email: email.value })
    // 注文係（API）に新規登録をお願いする
    const newUser = await registerUser(name.value, email.value, hashedPassword) // パスワードはハッシュ化して渡す

    console.log('4. APIからの返り値:', newUser) 
    
    console.log('登録成功！', newUser)
    alert(`登録が完了しました！ようこそ、${newUser.user_name}さん！`)
    
    // 【ここにログイン画面やホーム画面へ移動する処理を追加します】

} catch (error: any) {
    console.error(error)
    errorMessage.value = 'アカウントの作成に失敗しました。別のメールアドレスをお試しください。'
}
}
</script>

<style lang="css" scoped>
    .profile-container {
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
        padding: 8px;
        background-color: #ffffff;
  /* 略 */
}

.profile-form {
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

