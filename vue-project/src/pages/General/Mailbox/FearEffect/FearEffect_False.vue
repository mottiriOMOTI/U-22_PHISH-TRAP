<!-- FearEffect_False.vue -->
<template>
  <div class="d-flex flex-column align-center justify-center pa-8 mt-4 position-relative">
    
     <!-- 🟢 演出16: 画面上部から降ってくるチャットポップアップ（Discord対応版） -->
    <!-- 1. 画面上部の Slack 用トースト（Slack の時だけ動くように v-if を修正） -->
<transition name="slide-top">
  <div 
    v-if="showSlack && chatType === 'slack'" 
    class="custom-chat-popup slack pa-3 d-flex align-center elevation-12"
  >
    <v-avatar color="#4a154b" size="40" class="me-3">
      <v-icon :icon="slackAvatar" color="white"></v-icon>
    </v-avatar>
    <div class="text-left flex-grow-1">
      <div class="d-flex align-center justify-space-between">
        <span class="text-subtitle-2 font-weight-bold text-grey-darken-4">{{ slackUser }}</span>
        <span class="text-caption text-grey-darken-1">たった今</span>
      </div>
      <p class="text-body-2 text-wrap ma-0" style="line-height: 1.3; max-width: 280px;">
        {{ slackMessage }}
      </p>
    </div>
  </div>
</transition>

<!-- 2. 【追加】画面右下からスライドインする Discord 専用トースト -->
<!-- アニメーションを右からのスライドにするため、name="slide-right" を指定します -->
<transition name="slide-right">
  <div 
    v-if="showSlack && chatType === 'discord'" 
    class="custom-chat-popup discord discord-bottom-position pa-3 d-flex align-center elevation-12"
  >
    <v-avatar color="#5865F2" size="40" class="me-3">
      <v-icon :icon="slackAvatar" color="white"></v-icon>
    </v-avatar>
    <div class="text-left flex-grow-1">
      <div class="d-flex align-center justify-space-between">
        <span class="text-subtitle-2 font-weight-bold text-white">{{ slackUser }}</span>
        <span class="text-caption text-grey-lighten-1">たった今</span>
      </div>
      <p class="text-body-2 text-wrap text-grey-lighten-2 ma-0" style="line-height: 1.3; max-width: 280px;">
        {{ slackMessage }}
      </p>
    </div>
  </div>
</transition>


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
            n === 16 ? 'purple-darken-3' : // 👈 【追加】16番をチャット専用の紫に指定
            (n === 15 ? 'green-darken-3' : 
            (n === 11 || n === 12 ? 'purple-darken-1' : 
            (n === 3 ? 'info' : 
            (n === 6 ? 'error' : 
            (n === 4 || n === 5 ? 'warning' : 
            (n === 1 || n === 2 ? 'info' : 'blue-grey-darken-3'))))))
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

    <!-- 🟢 【追加】演出15: 緊急社内着信ポップアップ（ダイアログ形式） -->
    <!-- persistent で背景クリックで勝手に消えないようにガードします -->
    <v-dialog
      v-model="showCall"
      persistent
      width="400"
    >
      <!-- 着信中はブルブル揺れるアニメーションクラス「phone-shake」を動的に付与 -->
      <v-card
        color="#1e1e24"
        variant="flat"
        :class="['pa-6 text-center rounded-xl border-call', { 'phone-shake': !isCallConnected }]"
      >
        <!-- アバター・アイコンエリア -->
        <v-avatar size="80" color="grey-darken-3" class="mx-auto mb-4 elevation-6">
          <v-icon :icon="isCallConnected ? 'mdi-phone-in-talk' : 'mdi-account-phone'" size="48" color="amber-lighten-2"></v-icon>
        </v-avatar>

        <!-- 発信者名とステータス -->
        <h2 class="text-h6 font-weight-bold text-white mb-1">{{ callerName }}</h2>
        
        <!-- 通話中なら「00:01」などのタイマー、着信中なら「着信中...」の文字を動的表示 -->
        <p class="text-body-2 text-grey-lighten-1 mb-6 font-mono">
          {{ isCallConnected ? formatCallTime(callDuration) : callStatus }}
        </p>

        <!-- アクションボタンエリア -->
        <div class="d-flex justify-center gap-6">
          <!-- 🔴 拒否・切断ボタン（常に表示） -->
          <v-btn
            icon="mdi-phone-hangup"
            color="error"
            size="large"
            elevation="8"
            class="mx-2"
            @click="hangUpCall"
          ></v-btn>

          <!-- 🟢 応答ボタン（まだ繋がっていない着信中のみ表示） -->
          <v-btn
            v-if="!isCallConnected"
            icon="mdi-phone"
            color="success"
            size="large"
            elevation="8"
            class="mx-2 blink-call-icon"
            @click="answerCall"
          ></v-btn>
        </div>

        <!-- 通話が繋がった後に表示される、さらに焦らせる上司のリアルタイムセリフ -->
        <v-expand-transition>
          <div v-if="isCallConnected" class="mt-6 pa-3 rounded bg-grey-darken-4 text-left border-left-error">
            <p class="text-caption text-error font-weight-bold mb-1">>> AUDIO LOG:</p>
            <p class="text-body-2 text-grey-lighten-2" style="line-height: 1.4;">
              「もしもし！？おい、何メール破棄してんだ！今すぐ席に戻ってこい！！」
            </p>
          </div>
        </v-expand-transition>
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

// スクリプト上部のインポートエリアの最後に追加
import { 
  triggerCallEffect, 
  answerCall, 
  hangUpCall, 
  formatCallTime, 
  showCall, 
  callerName, 
  callStatus, 
  callDuration, 
  isCallConnected 
} from './FearEffect_False_End/callEffect'

import { 
  triggerSlackEffect, 
  showSlack, 
  slackUser, 
  slackMessage, 
  slackAvatar,
  chatType // 👈 インポートに追加
} from './FearEffect_False_End/slackEffect'

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

    case 14:
    triggerCallEffect('boss')
    break
    
    // 🟢 【追加】演出16: 画面上部からのチャットトースト（佐藤くんから）
    case 15:
      triggerSlackEffect('colleague')
      break
      
    // 🟢 【追加】演出16: 画面上部からのチャットトースト（佐藤くんから）
    case 16:
      triggerSlackEffect('discord_friend')
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

/* 既存の style の中に追加 */

/* 🟢 着信ポップアップ専用のネオン枠 */
.border-call {
  border: 1px solid #4caf50 !important;
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.3) !important;
}

/* 🟢 着信中にブルブル震えるリアルなバイブレーションCSS */
.phone-shake {
  animation: phone-vibrate-anim 0.15s infinite alternate;
}
@keyframes phone-vibrate-anim {
  0% { transform: translate(1px, 1px) rotate(0deg); }
  100% { transform: translate(-1px, -1px) rotate(0.5deg); }
}

/* 緑の通話ボタンをピカピカ光らせる */
.blink-call-icon {
  animation: blink-call-anim 0.6s infinite alternate;
}
@keyframes blink-call-anim {
  0% { transform: scale(1); background-color: #4caf50 !important; }
  100% { transform: scale(1.08); background-color: #81c784 !important; }
}

.border-left-error {
  border-left: 3px solid #ff5252 !important;
}


/* 🟢 演出16: 画面上部に絶対配置するSlack風ポップアップの見た目 *//* 🟢 共通のポップアップベース（クラス名を slack から chat に変更） */
/* 🟢 共通のポップアップベース（position-relative 等の不要なクラスをクリーンアップ） */
.custom-chat-popup {
  position: fixed;
  width: 360px;
  border-radius: 8px;
  z-index: 99999;
}

/* 🟢 Slack 用：画面の上部中央に固定 */
.custom-chat-popup.slack {
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #ffffff !important;
  border: 1px solid #dcdcdc;
  border-left: 5px solid #4a154b !important;
}

/* 🟢 Discord 用：画面の右下隅に固定配置 */
.custom-chat-popup.discord-bottom-position {
  bottom: 24px; /* 既存の通知スタックと重ならない位置、またはお好みの高さに調整可能 */
  right: 24px;
  background-color: #2f3136 !important; /* Discordダーク */
  border: 1px solid #202225;
  border-left: 5px solid #5865F2 !important; /* Discordブルー */
}

/* ─── アニメーション設定 ─── */

/* Slack用：上からピョコン */
.slide-top-enter-active { transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.slide-top-leave-active { transition: all 0.25s ease-in; }
.slide-top-enter-from, .slide-top-leave-to { transform: translate(-50%, -100px); opacity: 0; }

/* 🟢 Discord用：右下からシュッ（右から左へスライドイン） */
.slide-right-enter-active {
  transition: all 0.25s cubic-bezier(0.25, 1, 0.5, 1);
}
.slide-right-leave-active {
  transition: all 0.2s ease-in;
}
.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(120px); /* 画面の右外側からスタート */
  opacity: 0;
}

</style>
