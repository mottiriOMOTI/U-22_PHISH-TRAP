<!-- FearEffect_False.vue -->
<template>
  <div class="d-flex flex-column align-center justify-center pa-8 mt-4 position-relative">
    
    <!-- ❓ 誤判定イベント用の巨大アイコンとテキスト -->
    <v-icon
      icon="mdi-alert-circle-outline"
      color="amber-darken-2"
      size="120"
      class="mb-2"
    ></v-icon>
    <h1 class="text-h4 font-weight-bold mb-2">⚠ 判断が間違っています (False)</h1>
    <p class="text-body-1 text-medium-emphasis text-center mb-6">
      安全な公式メールを詐欺だと誤判定してしまいました。<br>
      演出テスト用の4×4ボタンエリアで挙動を確認できます。
    </p>

    <!-- 4×4の演出テスト用ボタングリッド -->
    <v-row class="w-100 max-width-grid mb-8" no-gutters>
      <v-col v-for="n in 16" :key="n" cols="3" class="pa-1">
        <v-btn
          block
          :color="
            n === 11 || n === 12 ? 'purple-darken-1' : 
            (n === 3 ? 'info' : 
            (n === 6 ? 'error' : 
            (n === 4 || n === 5 ? 'warning' : 
            (n === 1 || n === 2 ? 'success' : 'blue-grey-darken-3'))))
          "
          variant="tonal"
          size="small"
          @click="triggerEffect(n)"
        >
          演出 {{ n }}
        </v-btn>
      </v-col>
    </v-row>

    <!-- 🔙 解説画面に戻るボタン -->
    <v-btn
      color="amber-darken-3"
      variant="outlined"
      size="large"
      prepend-icon="mdi-arrow-left"
      @click="goBack"
    >
      もう一度解説を確認する
    </v-btn>

    <!-- 疑似通知スタック固定コンテナ -->
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

        <!-- 最前面のメール強制開封ダイアログ（バツボタン動的表示版） -->
    <v-dialog 
      v-model="showDiag" 
      :persistent="isForcedMode" 
      width="700"
      transition="none" 
    >
      <v-card :style="{ backgroundColor: popupBgColor, border: `2px solid ${popupColor}` }" class="pa-6 text-left position-relative">
        
        <!-- 🟢 【追加】強制開封モードではない場合（✖ボタンで閉じる場合）のみ、右上にバツボタンを表示 -->
        <v-btn
          v-if="!isForcedMode"
          icon="mdi-close"
          variant="text"
          :color="popupColor"
          style="position: absolute; top: 12px; right: 12px; z-index: 10;"
          @click="showDiag = false"
        ></v-btn>

        <!-- メールアプリのヘッダー風デザイン -->
        <div class="d-flex align-center justify-space-between pb-3 mb-4" :style="{ borderBottom: `2px solid ${popupColor}` }">
          <div class="d-flex align-center">
            <v-icon icon="mdi-email-open-outline" :color="popupColor" class="me-2" size="large"></v-icon>
            <span class="text-subtitle-1 font-weight-bold text-grey-darken-4">社内メールシステム</span>
          </div>
          <v-chip size="small" :color="popupColor" variant="flat" class="text-white font-weight-bold">
            {{ isForcedMode ? '強制開封警告' : '通知確認' }}
          </v-chip>
        </div>

        <!-- 送信者情報 -->
        <div class="mb-4 pa-3 rounded text-grey-darken-4" style="background-color: rgba(0,0,0,0.06);">
          <div class="text-body-2 mb-1"><span class="font-weight-bold">件名：</span> {{ mailSubject }}</div>
          <div class="text-body-2 mb-1"><span class="font-weight-bold">差出人：</span> {{ mailSender }}</div>
          <div class="text-body-2"><span class="font-weight-bold">アドレス：</span> {{ mailAddress }}</div>
        </div>

        <!-- メール本文 -->
        <v-card-text class="px-3 py-3 text-body-1 text-grey-darken-4 font-weight-medium" style="line-height: 1.6; background-color: #ffffff; border-radius: 4px; border: 1px solid #ccc; min-height: 180px; white-space: pre-wrap;">
          {{ mailBody }}
        </v-card-text>

        <!-- 下部のタイマー予告テキスト（動的切り替え） -->
        <div class="text-center text-caption text-grey-darken-2 mt-4">
          <span v-if="isForcedMode" class="font-weight-bold">>> 【警告デモ動作中】5秒後に自動的に元の画面へ復帰します...</span>
          <span v-else class="font-weight-bold">>> 【確認完了】右上の✖ボタン、または背景クリックで閉じてください</span>
        </div>
      </v-card>
    </v-dialog>


  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { triggerFalseNotification } from './FearEffect_False_End/falseNotificationEffect'
// 🟢 【修正】diagEffect.ts から、表示用のテキストデータをすべてインポート
import { 
  triggerDiagEffect, 
  showDiag, 
  resetDiagEffect,
  mailSubject,
  mailSender,
  mailAddress,
  mailBody,
  popupColor,
  popupBgColor,
  isForcedMode // 👈 【追加】
} from './FearEffect_False_End/diagEffect'

const router = useRouter()
const notifications = ref<any[]>([])

const triggerEffect = (effectNumber: number) => {
  console.log(`🎬 False演出テストボタン [ ${effectNumber} ] が押されました`)

  switch (effectNumber) {
    case 1: triggerFalseNotification(notifications, 'miss'); break
    case 2: triggerFalseNotification(notifications, 'info'); break
    
    // 🟢 演出3: 強制開封（自動で閉じる）➔ 第二引数を省略、または true を指定
    case 3: 
      triggerDiagEffect('overdue', true) 
      break

    case 4: triggerFalseNotification(notifications, 'overdue'); break
    case 5: triggerFalseNotification(notifications, 'penalty'); break
    case 6: triggerFalseNotification(notifications, 'fired'); break

    // 🟢 演出11: 強制開封（自動で閉じる）
    case 11:
      triggerDiagEffect('penalty', true)
      break

    // 🟢 演出12: 強制開封（自動で閉じる）
    case 12:
      triggerDiagEffect('fired', false)
      break

    // 🟢 【新規テスト】演出13: 手動開封（自動で閉じない、右上の✖ボタンで閉じる！）
    // 第二引数に false を渡すことで、タイマーが起動しなくなります
    case 13:
      triggerDiagEffect('overdue', false)
      break

    default:
      console.log(`⚠️ 演出 ${effectNumber} はまだ実装されていません`)
      break
  }
}

const goBack = () => {
  resetDiagEffect()
  router.push({ name: 'Explanation' })
}
</script>

<style lang="css" scoped>
.max-width-grid { max-width: 600px; }
.font-mono { font-family: 'Courier New', Courier, monospace; }

/* 通知スタック用 */
.custom-notification-stack { position: fixed; bottom: 16px; right: 16px; z-index: 9000; display: flex; flex-direction: column-reverse; pointer-events: none; }
.custom-toast-card { pointer-events: auto; }
.border-yellow { border-left: 4px solid #ffb300 !important; border-radius: 4px; }
.border-blue { border-left: 4px solid #03a9f4 !important; border-radius: 4px; }
.border-red { border-left: 4px solid #ff5252 !important; border-radius: 4px; }
.border-orange { border-left: 4px solid #ff9800 !important; border-radius: 4px; }
.border-green { border-left: 4px solid #00c853 !important; border-radius: 4px; }
.list-enter-active, .list-leave-active { transition: all 0.4s ease; }
.list-enter-from { opacity: 0; transform: translateX(100px); }
.list-leave-to { opacity: 0; transform: translateY(-20px); }
</style>
