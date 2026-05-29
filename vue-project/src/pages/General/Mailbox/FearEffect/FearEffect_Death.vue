<!-- FearEffect_Death.vue -->
<template>
  <div class="d-flex flex-column align-center justify-center pa-8 mt-4">
    <v-icon icon="mdi-skull-crossbones" color="grey-darken-4" size="120" class="mb-2"></v-icon>
    <h1 class="text-h4 font-weight-bold mb-2">🚨 バッドエンド (Death)</h1>
    <p class="text-body-1 text-medium-emphasis text-center mb-6">演出テスト用の4×4ボタンエリアです。</p>

    <!-- 4×4の演出テスト用ボタングリッド -->
    <v-row class="w-100 max-width-grid mb-8" no-gutters>
      <v-col v-for="n in 16" :key="n" cols="3" class="pa-1">
        <v-btn
          block
          color="deep-orange-darken-4"
          variant="tonal"
          size="small"
          @click="triggerEffect(n)"
        >
          演出 {{ n }}
        </v-btn>
      </v-col>
    </v-row>

    <v-btn color="error" variant="flat" size="large" prepend-icon="mdi-arrow-left" @click="goBack">
      解説を読んでリトライする
    </v-btn>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

// 🟢 src直下からのフルパス（@/pages/...）に修正
import { triggerShakeEffect } from '@/pages/General/Mailbox/FearEffect/FearEffect_Death_Attack/shakeEffect'
import { triggerFlashEffect } from '@/pages/General/Mailbox/FearEffect/FearEffect_Death_Attack/flashEffect'
import { triggerVirusTabEffect } from '@/pages/General/Mailbox/FearEffect/FearEffect_Death_Attack/virusTabEffect'

// 💡 今後「演出3」を作ったら、ここに import { triggerEffect3 } from '...' を追加していく

const router = useRouter()

// 演出テスト用のトリガー関数
const triggerEffect = (effectNumber: number) => {
  console.log(`🎬 演出テストボタン [ ${effectNumber} ] が押されました`)
  
  // 🟢 ボタンの番号に応じて、インポートした個別の演出関数を呼び出す
  switch (effectNumber) {
    case 1:
      triggerShakeEffect() // ➔ 演出1のファイルを動かす
      break
    case 2:
      triggerFlashEffect() // ➔ 演出2のファイルを動かす
      break
    case 3:
      triggerVirusTabEffect() // ➔ 演出3のファイルを動かす
      break
    // 💡 以降、case 4, case 5... と呼び出しを増やしていけます
    default:
      console.log(`⚠️ 演出 ${effectNumber} はまだ実装されていません`)
      break
  }
}

const goBack = () => {
  router.push({ name: 'Explanation' })
}
</script>

<style lang="css" scoped>
.max-width-grid {
  max-width: 600px;
}
</style>
