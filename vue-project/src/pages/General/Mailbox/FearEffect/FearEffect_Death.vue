<!-- FearEffect_Death.vue -->
<template>
  <!-- 🟢 すべての要素をこの一番外側の div の内側に完全に格納します -->
  <div class="d-flex flex-column align-center justify-center pa-8 mt-4 position-relative">
    
    <v-icon icon="mdi-skull-crossbones" color="grey-darken-4" size="120" class="mb-2"></v-icon>
    <h1 class="text-h4 font-weight-bold mb-2">🚨 バッドエンド (Death)</h1>
    <p class="text-body-1 text-medium-emphasis text-center mb-6">演出テスト用の4×4ボタンエリアです。</p>

    <!-- 4×4の演出テスト用ボタングリッド -->
    <v-row class="w-100 max-width-grid mb-8" no-gutters>
      <v-col v-for="n in 16" :key="n" cols="3" class="pa-1">
        <v-btn
          block
          :color="n === 7 || n === 8 ? 'error' : (n >= 4 && n <= 6 ? 'warning' : 'deep-orange-darken-4')"
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

    <!-- 疑似デスクトップ通知スタック固定コンテナ -->
    <div class="custom-notification-stack">
      <transition-group name="list">
        <v-card
          v-for="item in notifications"
          :key="item.id"
          color="#1e1e1e"
          elevation="24"
          :class="['mb-2 pa-4 d-flex align-center custom-toast-card', item.borderClass]"
          style="width: 340px;"
        >
          <v-icon :icon="item.icon" :color="item.color" class="me-3" size="large"></v-icon>
          <div>
            <div class="text-subtitle-2 font-weight-bold" :style="{ color: item.color }">
              {{ item.title }}
            </div>
            <div class="text-caption text-white" style="line-height: 1.3;">
              {{ item.text }}
            </div>
          </div>
        </v-card>
      </transition-group>
    </div>

    <!-- 🟢 演出7: 画面ノイズ用オーバーレイ（ルート要素の内側に移動） -->
    <div v-if="showNoise" class="vivid-noise-overlay"></div>

    <!-- 🟢 演出8: ブルースクリーン全画面（BSOD）オーバーレイ（ルート要素の内側に移動） -->
    <div v-if="showBsod" class="bsod-screen">
      <div class="bsod-content">
        <div class="bsod-smiley">:(</div>
        <h1 class="bsod-title">PC で問題が発生したため、再起動する必要があります。</h1>
        <p class="bsod-text">エラー情報を収集しています。自動的に再起動します。</p>
        <p class="bsod-percent">{{ bsodPercent }}% 完了</p>
        
        <div class="bsod-footer d-flex gap-4 mt-8">
          <v-icon icon="mdi-qrcode" size="80" color="white" class="me-4"></v-icon>
          <div>
            <p class="text-caption text-white">この問題と可能な解決策の詳細については、以下を参照してください:</p>
            <p class="text-caption font-weight-bold text-white">https://windows.com</p>
            <p class="text-caption text-white mt-2">サポート担当者にこの情報を伝えてください:</p>
            <p class="text-caption text-white">停止コード: CRITICAL_PROCESS_DIED (FEAR_EFFECT_ATTACK)</p>
          </div>
        </div>

        <!-- BSOD画面から戻るための隠しリセットボタン -->
        <v-btn size="small" variant="text" color="white" class="mt-8" @click="resetAll">
          [ 演出をリセットして戻る ]
        </v-btn>
      </div>
    </div>

  </div>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { triggerShakeEffect } from './FearEffect_Death_Attack/shakeEffect'
import { triggerFlashEffect } from './FearEffect_Death_Attack/flashEffect'
import { triggerVirusTabEffect } from './FearEffect_Death_Attack/virusTabEffect'
// 🟢 演出ファイルから通知関数をインポート
import { triggerNotificationEffect } from '@/pages/General/Mailbox/FearEffect/FearEffect_Death_Attack/notificationEffect'

// 🟢 【追加】演出7・8ファイルのインポート
import { triggerNoiseEffect } from '@/pages/General/Mailbox/FearEffect/FearEffect_Death_Attack/noiseEffect'
import { triggerBsodEffect } from '@/pages/General/Mailbox/FearEffect/FearEffect_Death_Attack/bsodEffect'


const router = useRouter()

// 🟢 【修正】通知のリスト（配列）で管理します
const notifications = ref<any[]>([])

// 🟢 【追加】新規演出用のリアクティブ変数
const showNoise = ref(false)
const showBsod = ref(false)
const bsodPercent = ref(0)
const resetAll = () => {
  showBsod.value = false
  showNoise.value = false
  bsodPercent.value = 0
}

const triggerEffect = (effectNumber: number) => {
  console.log(`🎬 演出テストボタン [ ${effectNumber} ] が押されました`)

  switch (effectNumber) {
    case 1: triggerShakeEffect(); break
    case 2: triggerFlashEffect(); break
    case 3: triggerVirusTabEffect(); break
    
    // 🟢 それぞれの通知タイプと、通知配列（notifications）をそのまま引き渡します
    case 4:
      triggerNotificationEffect(notifications, 'warning')
      break
    case 5:
      triggerNotificationEffect(notifications, 'trojan')
      break
    case 6:
      triggerNotificationEffect(notifications, 'ransom')
      break
    case 7:
      triggerNotificationEffect(notifications, 'Shatter')
      break
    case 8:
      triggerNotificationEffect(notifications, 'message')
      break


    // 🟢 演出7: 画面ノイズ
    case 9:
      triggerNoiseEffect(showNoise)
      break
      
    // 🟢 演出8: ブルースクリーン
    case 10:
      triggerBsodEffect({ show: showBsod, percent: bsodPercent })
      break

    default:
      console.log(`⚠️ 演出 ${effectNumber} はまだ実装されていません`)
      break
  }
}

const goBack = () => { router.push({ name: 'Explanation' }) }
</script>

<style lang="css" scoped>
.max-width-grid { max-width: 600px; }

/* 🟢 【追加】通知スタックを画面の右下に絶対配置する設定 */
.custom-notification-stack {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 9999;
  display: flex;
  flex-direction: column-reverse; /* 新しい通知が一番下（または一番上）に綺麗に積まれるように調整 */
  pointer-events: none; /* 下のボタンが押せなくならないように透過 */
}
.custom-toast-card {
  pointer-events: auto; /* カード自体はマウス反応を戻す */
}

/* 🟢 【追加】通知の種類ごとに左端の線の色を変えるカスタムCSS */
.border-red { border-left: 4px solid #ff5252 !important; border-radius: 4px; }
.border-orange { border-left: 4px solid #ff9800 !important; border-radius: 4px; }
.border-green { border-left: 4px solid #00c853 !important; border-radius: 4px; }

/* 🟢 【追加】通知が右からスッと飛び出してくるアニメーション効果 */
.list-enter-active,
.list-leave-active {
  transition: all 0.4s ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateX(100px); /* 右側から飛び出してくる */
}
.list-leave-to {
  opacity: 0;
  transform: translateY(-20px); /* 消える時は上にスッと消える */
}


/* 🟢 【追加】演出7: 砂嵐ノイズ用のCSS（疑似的なデジタル砂嵐） */
.vivid-noise-overlay {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  z-index: 9998;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.15),
    rgba(0, 0, 0, 0.15) 1px,
    transparent 1px,
    transparent 2px
  ),
  repeating-linear-gradient(
    90deg,
    rgba(255, 0, 0, 0.1),
    rgba(0, 255, 0, 0.1) 2px,
    rgba(0, 0, 255, 0.1) 3px
  );
  background-size: 100% 4px, 6px 100%;
  animation: glitch-flicker 0.15s infinite;
}

@keyframes glitch-flicker {
  0% { transform: translate(2px, 1px) skewX(1deg); filter: invert(0); background-color: rgba(255, 255, 255, 0.05); }
  50% { transform: translate(-1px, -1px) skewX(-2deg); filter: invert(0.1); background-color: rgba(0, 0, 0, 0.1); }
  100% { transform: translate(1px, 2px) skewX(0deg); filter: invert(0); background-color: rgba(255, 255, 255, 0.05); }
}

/* 🟢 【追加】演出8: ブルースクリーン（BSOD）用のCSS */
.bsod-screen {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background-color: #0078d7 !important; /* Windows特有のあの青色 */
  color: #ffffff !important;
  z-index: 9999;
  font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
}
.bsod-content {
  padding: 10% 12%;
  text-align: left;
}
.bsod-smiley {
  font-size: 120px;
  line-height: 1;
  margin-bottom: 20px;
}
.bsod-title {
  font-size: 28px;
  font-weight: 300;
  margin-bottom: 20px;
  line-height: 1.4;
}
.bsod-text, .bsod-percent {
  font-size: 20px;
  font-weight: 300;
  margin-bottom: 10px;
}

</style>
