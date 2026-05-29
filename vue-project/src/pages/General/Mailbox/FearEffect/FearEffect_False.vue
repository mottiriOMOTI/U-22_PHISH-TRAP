<template>
  <!-- ❓ 誤判定イベント用の巨大アイコンとテキスト -->
  <div class="d-flex flex-column align-center justify-center pa-16 mt-10">
    <v-icon
      icon="mdi-alert-circle-outline"
      color="amber-darken-2"
      size="160"
      class="mb-4"
    ></v-icon>
    <h1 class="text-h4 font-weight-bold mb-2">⚠ 判断が間違っています (False)</h1>
    <p class="text-body-1 text-medium-emphasis text-center mb-8">
      安全なメールを詐欺だと疑ってしまった、あるいは見落としがあります。<br>
      もう一度メールの文面や送信元アドレスをよく確認してみましょう。
    </p>

    <!-- 🟢 解説画面に戻るボタン -->
    <v-btn
      color="amber-darken-3"
      variant="outlined"
      size="large"
      prepend-icon="mdi-arrow-left"
      @click="goBack"
    >
      もう一度解説を確認する
    </v-btn>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 🟢 元の解説ページに戻るための関数
const goBack = () => {
  router.push({ name: 'Explanation' })
}
</script>

<style lang="css" scoped>
</style>
