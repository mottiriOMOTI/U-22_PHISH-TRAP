<template>
  <div class="d-flex flex-column align-center justify-center pa-8 mt-4 position-relative">
    
    <v-icon icon="mdi-skull-crossbones" color="grey-darken-4" size="120" class="mb-2"></v-icon>
    <h1 class="text-h4 font-weight-bold mb-2">🚨 バッドエンド (Death)</h1>
    <p class="text-body-1 text-medium-emphasis text-center mb-6">演出テスト用の4×4ボタンエリアです。</p>

    <!-- 4×4の演出テスト用ボタングリッド（列別のシチュエーションカラー） -->
    <v-row class="w-100 max-width-grid mb-8" no-gutters>
      <v-col v-for="n in 16" :key="n" cols="3" class="pa-1">
        <v-btn
          block
          :color="
            n === 14 ? 'amber-accent-4' : 
            (n >= 1 && n <= 4 ? 'purple-darken-3' : 
            (n >= 5 && n <= 8 ? 'indigo-darken-2' : 
            (n >= 9 && n <= 12 ? 'green-darken-3' : 'red-darken-4')))
          "
          variant="tonal"
          size="small"
          @click="triggerEffect(n)"
        >
          {{ 
            n === 14 ? '⚠️ フルコンボ' :
            (n >= 1 && n <= 4 ? `会社 ${n}` : 
            (n >= 5 && n <= 8 ? `学校 ${n-4}` : 
            (n >= 9 && n <= 12 ? `日常 ${n-8}` : `クラッシュ ${n-12}`))) 
          }}
        </v-btn>
      </v-col>
    </v-row>

    <v-btn color="error" variant="flat" size="large" prepend-icon="mdi-arrow-left" @click="goBack">
      演出の閲覧を終わる
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
            <div class="text-subtitle-2 font-weight-bold" :style="{ color: item.color }">{{ item.title }}</div>
            <div class="text-caption text-white" style="line-height: 1.3;">{{ item.text }}</div>
          </div>
        </v-card>
      </transition-group>
    </div>

    <!-- 演出7: 画面ノイズ用オーバーレイ -->
    <div v-if="showNoise" class="vivid-noise-overlay"></div>

    <!-- 演出8: ブルースクリーン全画面（BSOD）オーバーレイ -->
    <div v-if="showBsod" class="bsod-screen">
      <div class="bsod-content">
        <div class="bsod-smiley">:(</div>
        <h1 class="bsod-title">PC で問題が発生したため、再起動する必要があります。</h1>
        <p class="bsod-text">エラー情報を収集しています。自動的に再起動します。</p>
        <p class="bsod-percent">{{ bsodPercent }}% 完了</p>
        
        <div class="bsod-footer d-flex gap-4 mt-8">
          <v-icon icon="mdi-qrcode" size="80" color="white" class="me-4"></v-icon>
          <div>
            <p class="text-caption text-white">この問題＋解決策の詳細：</p>
            <p class="text-caption font-weight-bold text-white">https://windows.com</p>
            <p class="text-caption text-white mt-2">停止コード: CRITICAL_PROCESS_DIED (FEAR_EFFECT_ATTACK)</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 最前面の暗号化警告ダイアログ（動的カラー対応版） -->
    <v-dialog v-model="showEncrypt" persistent width="600">
      <v-card color="#150505" variant="flat" :style="{ border: `1px solid ${popupColor}`, boxShadow: `0 0 15px ${popupColor}66` }" class="pa-6 rounded-lg text-left">
        <div class="d-flex align-center mb-4">
          <v-icon :icon="popupIcon" :color="popupColor" size="40" class="blink-fast me-3"></v-icon>
          <h2 class="text-h5 font-weight-bold" :style="{ color: popupColor }">{{ popupTitle }}</h2>
        </div>
        <v-card-text class="px-0 py-0 mb-4 text-body-1 text-white font-weight-bold" style="line-height: 1.5;">{{ encryptMainText }}</v-card-text>
        <div class="mb-4">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="text-caption text-grey-lighten-1 font-mono">>> {{ encryptStatusText }}</span>
            <span class="text-h6 font-weight-bold font-mono" :style="{ color: popupColor }">{{ encryptProgress.toFixed(1) }}%</span>
          </div>
          <v-progress-linear v-model="encryptProgress" :color="popupColor" height="16" striped class="rounded-pill"></v-progress-linear>
        </div>
        <v-divider :color="popupColor" class="border-opacity-30 my-4"></v-divider>
        <div class="text-body-2 text-grey-lighten-2" style="line-height: 1.6;">
          <p class="font-weight-bold text-grey-lighten-1 mb-2">■ 以下のステータスを確認してください：</p>
          <v-list bg-color="transparent" density="compact" class="py-0">
            <v-list-item v-for="(text, index) in encryptChecklist" :key="index" class="px-0 min-height-zero mb-1">
              <template v-slot:prepend>
                <v-icon icon="mdi-radiobox-marked" :color="popupColor" size="16" class="me-2"></v-icon>
              </template>
              <v-list-item-title class="text-wrap text-body-2 text-grey-lighten-2">{{ text }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </div>
      </v-card>
    </v-dialog>

    <!-- 完全シャットダウン（暗転）用オーバーレイ -->
    <div :class="['blackout-screen', { 'active': showBlackout }]"></div>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { triggerShakeEffect } from './FearEffect_Death_Attack/shakeEffect'
import { triggerFlashEffect } from './FearEffect_Death_Attack/flashEffect'
import { triggerNotificationEffect } from './FearEffect_Death_Attack/notificationEffect'
import { triggerNoiseEffect } from './FearEffect_Death_Attack/noiseEffect'
import { triggerBsodEffect } from './FearEffect_Death_Attack/bsodEffect'
import { triggerEncryptEffect, resetEncryptEffect, showEncrypt, encryptProgress, encryptStatusText, encryptMainText, encryptChecklist, popupTitle, popupIcon, popupColor } from './FearEffect_Death_Attack/encryptEffect'
import { triggerSequenceEffect } from './FearEffect_Death_Attack/sequenceController'

const router = useRouter()

const notifications = ref<any[]>([])
const showNoise = ref(false)
const showBsod = ref(false)
const bsodPercent = ref(0)
const showBlackout = ref(false)

const resetAll = () => {
  showBsod.value = false
  showNoise.value = false
  showBlackout.value = false
  bsodPercent.value = 0
  resetEncryptEffect()
}

// 🟢 デスルートボタンもシチュエーション別に完全マッピング
const triggerEffect = (effectNumber: number) => {
  console.log(`🎬 Death演出テストボタン [ ${effectNumber} ] が押されました`)

  switch (effectNumber) {
    // 💼 ─── 会社（ビジネス） ───
    case 1: triggerNotificationEffect(notifications, 'business', 1); break // 警告ログ
    case 2: triggerNotificationEffect(notifications, 'business', 2); break // ロックログ
    case 3: triggerEncryptEffect('business'); break                        // 最前面ポップアップ
    case 4: triggerShakeEffect(); break                                    // 画面シェイク

    // 🎓 ─── 学校（学生） ───
    case 5: triggerNotificationEffect(notifications, 'school', 1); break   // 警告ログ
    case 6: triggerNotificationEffect(notifications, 'school', 2); break   // 破壊ログ
    case 7: triggerEncryptEffect('school'); break                          // 最前面ポップアップ
    case 8: triggerFlashEffect(); break                                    // 画面フラッシュ

    // 🏠 ─── 日常（私生活） ───
    case 9:  triggerNotificationEffect(notifications, 'daily', 1); break    // 不正アクセスログ
    case 10: triggerNotificationEffect(notifications, 'daily', 2); break    // 不正出金ログ
    case 11: triggerEncryptEffect('daily'); break                          // 最前面ポップアップ

    // 🚨 ─── 共通クラッシュ・フルコンボ ───
    case 13: triggerNoiseEffect(showNoise); break                          // 砂嵐単体
    case 14:
      // 司令塔コンボ：最後は自動で暗転➔自動復帰
      triggerSequenceEffect(
        notifications,
        showNoise,
        () => triggerBsodEffect({ show: showBsod, percent: bsodPercent, isBlackout: showBlackout, onComplete: resetAll })
      )
      break
    case 15:
      // ブルースクリーン単体自動デモ
      triggerBsodEffect({ show: showBsod, percent: bsodPercent, isBlackout: showBlackout, onComplete: resetAll })
      break
    case 16:
      resetAll() // 即座に完全リセットするボタン
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
.min-height-zero { min-height: unset !important; }
.font-mono { font-family: 'Courier New', Courier, monospace; }

/* 通知スタック用 */
.custom-notification-stack { position: fixed; bottom: 16px; right: 16px; z-index: 9000; display: flex; flex-direction: column-reverse; pointer-events: none; }
.custom-toast-card { pointer-events: auto; }
.border-red { border-left: 4px solid #ff5252 !important; border-radius: 4px; }
.border-orange { border-left: 4px solid #ff9800 !important; border-radius: 4px; }
.border-green { border-left: 4px solid #00c853 !important; border-radius: 4px; }
.list-enter-active, .list-leave-active { transition: all 0.4s ease; }
.list-enter-from { opacity: 0; transform: translateX(100px); }
.list-leave-to { opacity: 0; transform: translateY(-20px); }

/* 演出11: ネオン装飾CSS */
.blink-fast { animation: blink-fast-anim 0.4s infinite alternate; }
@keyframes blink-fast-anim { 0% { opacity: 1; } 100% { opacity: 0.3; } }

/* 演出7: 砂嵐ノイズ用 */
.vivid-noise-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 9998; pointer-events: none; background: repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.15) 1px, transparent 1px, transparent 2px), repeating-linear-gradient(90deg, rgba(255, 0, 0, 0.1), rgba(0, 255, 0, 0.1) 2px, rgba(0, 0, 255, 0.1) 3px); background-size: 100% 4px, 6px 100%; animation: glitch-flicker 0.15s infinite; }@keyframes glitch-flicker { 0% { transform: translate(2px, 1px) skewX(1deg); filter: invert(0); background-color: rgba(255, 255, 255, 0.05); } 50% { transform: translate(-1px, -1px) skewX(-2deg); filter: invert(0.1); background-color: rgba(0, 0, 0, 0.1); } 100% { transform: translate(1px, 2px) skewX(0deg); filter: invert(0); background-color: rgba(255, 255, 255, 0.05); } }/* 演出8: ブルースクリーン用 */.bsod-screen { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: #0078d7 !important; color: #ffffff !important; z-index: 9999; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; }.bsod-content { padding: 10% 12%; text-align: left; }.bsod-smiley { font-size: 120px; line-height: 1; margin-bottom: 20px; }.bsod-title { font-size: 28px; font-weight: 300; margin-bottom: 20px; line-height: 1.4; }.bsod-text, .bsod-percent { font-size: 20px; font-weight: 300; margin-bottom: 10px; }/* 完全暗転（シャットダウン）用の全画面CSS */.blackout-screen {position: fixed;top: 0; left: 0; width: 100vw; height: 100vh;background-color: #000000 !important;z-index: 99999;opacity: 0;pointer-events: none;transition: opacity 2.0s ease-in-out;}.blackout-screen.active {opacity: 1;pointer-events: auto;transition: opacity 0s !important;}
</style> <!-- 👈 ファイルの一番最後の閉じタグ -->

