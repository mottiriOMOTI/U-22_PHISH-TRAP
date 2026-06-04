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
          :color="
            n === 16 ? 'amber-accent-4' : // 👈 【追加】16番をゴールド（コンボボタン）に指定
            (n >= 11 && n <= 14 ? 'purple-darken-3' : 
            (n === 9 || n === 10 ? 'error' : 
            (n === 7 || n === 8 ? 'success' : 
            (n >= 4 && n <= 6 ? 'warning' : 'deep-orange-darken-4'))))
          "
          variant="tonal"
          size="small"
          @click="triggerEffect(n)"
        >
          演出 {{ n }}
        </v-btn>
      </v-col>
    </v-row>


    <!-- 🟢 【追加】演出11: 画面内に現れる「ファイル暗号化進行中」ステータスカード -->
         <!-- 🔙 最前面の暗号化警告ダイアログ（動的バインド対応版） -->
    <v-dialog
      v-model="showEncrypt"
      persistent
      width="600"
    >
      <v-card
        color="#150505"
        variant="flat"
        :style="{ border: `1px solid ${popupColor}`, boxShadow: `0 0 15px ${popupColor}66` }"
        class="pa-6 rounded-lg text-left"
      >
        <!-- 🟢 動的アイコン & 動的タイトル -->
        <div class="d-flex align-center mb-4">
          <v-icon :icon="popupIcon" :color="popupColor" size="40" class="blink-fast me-3"></v-icon>
          <h2 class="text-h5 font-weight-bold" :style="{ color: popupColor }">
            {{ popupTitle }}
          </h2>
        </div>

        <!-- 本文（動的バインド） -->
        <v-card-text class="px-0 py-0 mb-4 text-body-1 text-white font-weight-bold" style="line-height: 1.5;">
          {{ encryptMainText }}
        </v-card-text>

        <!-- 横長スライダータイマー（動的バインド） -->
        <div class="mb-4">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="text-caption text-grey-lighten-1 font-mono">>> {{ encryptStatusText }}</span>
            <span class="text-h6 font-weight-bold font-mono" :style="{ color: popupColor }">
              {{ encryptProgress.toFixed(1) }}%
            </span>
          </div>
          
          <v-progress-linear
            v-model="encryptProgress"
            :color="popupColor"
            height="16"
            striped
            class="rounded-pill"
          ></v-progress-linear>
        </div>

        <v-divider :color="popupColor" class="border-opacity-30 my-4"></v-divider>

        <!-- 箇条書き（動的バインド） -->
        <div class="text-body-2 text-grey-lighten-2" style="line-height: 1.6;">
          <p class="font-weight-bold text-grey-lighten-1 mb-2">■ 以下のステータスを確認してください：</p>
          <v-list bg-color="transparent" density="compact" class="py-0">
            <v-list-item v-for="(text, index) in encryptChecklist" :key="index" class="px-0 min-height-zero mb-1">
              <template v-slot:prepend>
                <v-icon icon="mdi-radiobox-marked" :color="popupColor" size="16" class="me-2"></v-icon>
              </template>
              <v-list-item-title class="text-wrap text-body-2 text-grey-lighten-2">
                {{ text }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </div>
      </v-card>
    </v-dialog>

     <!-- 🟢 完全シャットダウン（暗転）用オーバーレイ -->
    <!-- showBlackout が true になると active クラスが付与され、CSS側で滑らかなフェードが発動します -->
    <div :class="['blackout-screen', { 'active': showBlackout }]"></div>


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


// 🟢 【追加】演出11の新規インポート
import { 
  triggerEncryptEffect, 
  resetEncryptEffect,
  showEncrypt, 
  encryptProgress, 
  encryptStatusText,
  encryptMainText,
  encryptChecklist,
  popupTitle, // 👈 追加
  popupIcon,  // 👈 追加
  popupColor  // 👈 追加
} from '@/pages/General/Mailbox/FearEffect/FearEffect_Death_Attack/encryptEffect'

// 🟢 【追加】演出14（シーケンス司令塔）のインポート
import { triggerSequenceEffect } from '@/pages/General/Mailbox/FearEffect/FearEffect_Death_Attack/sequenceController'

const showBlackout = ref(false)

const router = useRouter()

const notifications = ref<any[]>([])
const showNoise = ref(false)
const showBsod = ref(false)
const bsodPercent = ref(0)

// 演出のリセット処理
const resetAll = () => {
  showBsod.value = false
  showNoise.value = false
  bsodPercent.value = 0
  // 🟢 演出11の内部変数を外部からまとめてリセット
  resetEncryptEffect()
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
      triggerBsodEffect({ 
        show: showBsod, 
        percent: bsodPercent, 
        isBlackout: showBlackout,
        onComplete: resetAll // ➔ 終わったら自動でこの関数のリセット処理が走る
      }) 
      break

      // 🟢 演出11: 身代金要求ポップアップ（既存の紫デザイン）
    case 11:
      triggerEncryptEffect('ransom')
      break

    // 🟢 演出12: 不審プロセス検出強制スキャン（赤色デザイン）
    case 12:
      triggerEncryptEffect('scan')
      break

    // 🟢 演出13: システムMBR破壊上書き（オレンジデザイン）
    case 13:
      triggerEncryptEffect('destroy')
      break
      
    // 🟢 演出13: システムMBR破壊上書き（オレンジデザイン）
    case 13:
      triggerEncryptEffect('destroy')
      break

    // 🟢 演出14: カメラ作動（黄色デザイン）
    case 14:
      triggerEncryptEffect('camera')
      break

      // 🟢 演出16: 全演出同時多発スタックコンボを発動！
    case 16:
      triggerSequenceEffect(
        notifications,
        showNoise,
        () => triggerBsodEffect({ 
          show: showBsod, 
          percent: bsodPercent, 
          isBlackout: showBlackout,
          onComplete: resetAll // ➔ 全てのパニック演出の最後に自動で元の画面に帰還
        })
      )

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


/* 🟢 【修正】消えるときは一瞬、戻るときはじわ〜っと戻る特別なCSS設定 */
.blackout-screen {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background-color: #000000 !important; /* 完全な漆黒 */
  z-index: 99999;
  opacity: 0;
  pointer-events: none;
  
  /* ➔ 戻るとき（activeが外れるとき）のアニメーション設定 */
  /* 2.0s にしているので、真っ黒から2秒かけてじわ〜っと元の画面が浮き上がります */
  transition: opacity 2.0s ease-in-out; 
}

.blackout-screen.active {
  opacity: 1;
  pointer-events: auto;
  
  /* ➔ 真っ黒になるとき（activeが付いたとき）のアニメーション設定 */
  /* transitionの時間を一瞬（0s）にして上書きし、バッと一気に暗転させます */
  transition: opacity 0s !important; 
}
</style> <!-- 👈 ファイルの一番最後の閉じタグ -->

