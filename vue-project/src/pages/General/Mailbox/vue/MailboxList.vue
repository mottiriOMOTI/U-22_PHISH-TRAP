<template>
  <main class="mailbox-page" :aria-busy="loading ? 'true' : 'false'">
    <header class="mailbox-hero">
      <v-icon icon="mdi-email-outline" class="mailbox-hero__icon" />
      <div>
        <h1>メールボックス</h1>
        <p>訓練メールの受信トレイ</p>
      </div>
    </header>

    <section class="mailbox-panel">
      <div class="mailbox-panel__header">
        <h2>受信トレイ</h2>
        <p>{{ loading ? 'メールを読み込んでいます' : `${mails.length}件 of メール` }}</p>
      </div>

      <!-- スケルトンローディング表示 -->
      <div v-if="loading" class="mail-list" aria-label="メール読み込み中">
        <article v-for="n in 5" :key="n" class="mail-row-skeleton">
          <span class="mail-row-skeleton__icon" />
          <div>
            <span class="mail-row-skeleton__line mail-row-skeleton__line--short" />
            <span class="mail-row-skeleton__line" />
            <span class="mail-row-skeleton__line mail-row-skeleton__line--medium" />
          </div>
        </article>
      </div>

      <!-- エラーハンドリング -->
      <div v-else-if="error" class="mailbox-state mailbox-state--error" role="alert">
        <v-icon icon="mdi-alert-circle-outline" class="mailbox-state__icon" />
        <div>
          <h3>メールを読み込めませんでした</h3>
          <p>{{ error }}</p>
        </div>
        <button class="secondary-button" type="button" @click="load">再試行</button>
      </div>

      <!-- 空状態 -->
      <div v-else-if="mails.length === 0" class="mailbox-state" role="status">
        <v-icon icon="mdi-email-open-outline" class="mailbox-state__icon" />
        <div>
          <h3>表示できるメールがありません</h3>
          <p>シチュエーションを変更すると、新しい訓練メールが表示される場合があります。</p>
        </div>
      </div>

      <!-- メールリスト表示 -->
      <div v-else class="mail-list">
        <article
          v-for="mail in mails"
          :key="mail.id"
          class="mail-row"
          :class="{
            'mail-row--answered': getMailAnswerState(mail.id).visible,
            'mail-row--locked': isMailLocked(mail.id),
            'mail-row--warning': getMailAnswerState(mail.id).effectFlag === true && getMailAnswerState(mail.id).isCorrect !== true,
            'mail-row--review': getMailAnswerState(mail.id).isCorrect === true,
            'mail-row--success': getMailAnswerState(mail.id).isCorrect !== true && getMailAnswerState(mail.id).visible && getMailAnswerState(mail.id).effectFlag === false,
          }"
        >
          <div class="mail-row__content-wrap">
            <button
              class="mail-row__button"
              type="button"
              :disabled="isMailLocked(mail.id)"
              :aria-disabled="isMailLocked(mail.id) ? 'true' : 'false'"
              @click="openMail(mail.id)"
            >
              <span class="mail-row__icon">
                <v-icon icon="mdi-email-outline" />
              </span>

              <span class="mail-row__content">
                <span class="mail-row__sender">{{ mail.sender_name }}</span>
                <span class="mail-row__title">{{ mail.title }}</span>
                <span class="mail-row__preview">{{ preview(mail.body) }}</span>
              </span>

              <span class="mail-row__meta">
                <span v-if="getMailAnswerState(mail.id).visible" class="mail-row__status" :class="{
                  'mail-row__status--warning': getMailAnswerState(mail.id).effectFlag === true && getMailAnswerState(mail.id).isCorrect !== true,
                  'mail-row__status--review': getMailAnswerState(mail.id).isCorrect === true,
                  'mail-row__status--success': getMailAnswerState(mail.id).isCorrect !== true && getMailAnswerState(mail.id).effectFlag === false,
                }">
                  <v-icon :icon="getMailAnswerState(mail.id).isCorrect === true ? (getMailAnswerState(mail.id).effectFlag === true ? 'mdi-book-open-page-variant' : 'mdi-check-circle-outline') : getMailAnswerState(mail.id).effectFlag === true ? 'mdi-alert-circle-outline' : 'mdi-check-circle-outline'" />
                  <span>{{ getMailAnswerState(mail.id).isCorrect === true ? (getMailAnswerState(mail.id).effectFlag === true ? '復習済み' : '正解') : getMailAnswerState(mail.id).effectFlag === true ? '要注意' : '回答済み' }}</span>
                </span>
                <span>{{ formatDate(mail.created_at) }}</span>
                <v-icon icon="mdi-chevron-right" />
              </span>
            </button>

            <button
              v-if="getMailAnswerState(mail.id).visible"
              class="mail-row__action"
              type="button"
              @click.stop="openExplanation(mail)"
            >
              <v-icon icon="mdi-book-open-page-variant" />
              <span>解説</span>
            </button>
          </div>
        </article>
      </div>
    </section>

    <!-- 🔒 操作ロック用透明オーバーレイ (通常UIと演出ダイアログの間に配置) -->
    <div 
      v-if="isSystemLocked" 
      class="system-lock-overlay"
      @click.stop="handleLockClick"
    ></div>

    <!-- 🚫 操作ロック警告スナックバー (逃げようとした時に発火) -->
    <v-snackbar
      v-model="showLockMessage"
      color="error"
      timeout="1500"
      location="top"
      elevation="24"
    >
      <div class="d-flex align-center font-weight-bold text-subtitle-1 font-mono">
        <v-icon icon="mdi-alert-circle-outline" class="mr-2" size="large"></v-icon>
        SYSTEM ERROR: 操作がロックされています。
      </div>
    </v-snackbar>

    <!-- ==========================================================
         🚨 【共通演出レイヤー】バッドエンド（Death）演出オーバーレイ群
         ========================================================== -->
    <div v-if="showNoise" class="vivid-noise-overlay"></div>

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


    <!-- ==========================================================
         🟢 【共通演出レイヤー】誤判定（False）演出用チャットポップアップ群
         ========================================================== -->
    <!-- 1. Slack風トースト（上部中央） -->
    <transition name="slide-top">
      <div v-if="showSlack && chatType === 'slack'" class="custom-chat-popup slack pa-3 d-flex align-center elevation-12">
        <v-avatar color="#4a154b" size="40" class="me-3">
          <v-icon :icon="slackAvatar" color="white"></v-icon>
        </v-avatar>
        <div class="text-left flex-grow-1">
          <div class="d-flex align-center justify-space-between">
            <span class="text-subtitle-2 font-weight-bold text-grey-darken-4">{{ slackUser }}</span>
            <span class="text-caption text-grey-darken-1">たった今</span>
          </div>
          <p class="text-body-2 text-wrap ma-0" style="line-height: 1.3; max-width: 280px;">{{ slackMessage }}</p>
        </div>
      </div>
    </transition>

    <!-- 2. LINE風トースト（右下配置） -->
    <transition name="slide-right">
      <div v-if="showSlack && chatType === 'line'" class="custom-chat-popup line line-bottom-position pa-3 d-flex align-center elevation-12">
        <v-avatar color="#24d500" size="40" class="me-3 elevation-1">
          <v-icon :icon="slackAvatar" color="white" size="small"></v-icon>
        </v-avatar>
        <div class="text-left flex-grow-1">
          <div class="d-flex align-center justify-space-between">
            <span class="text-subtitle-2 font-weight-bold text-black" style="letter-spacing: -0.5px;">{{ slackUser }}</span>
            <span class="text-caption text-grey-darken-1">現在</span>
          </div>
          <p class="text-body-2 text-wrap text-grey-darken-3 ma-0" style="line-height: 1.3; max-width: 280px;">{{ slackMessage }}</p>
        </div>
      </div>
    </transition>

    <!-- 3. Discord風トースト（右下隅に固定） -->
    <transition name="slide-right">
      <div v-if="showSlack && chatType === 'discord'" class="custom-chat-popup discord discord-bottom-position pa-3 d-flex align-center elevation-12">
        <v-avatar color="#5865F2" size="40" class="me-3">
          <v-icon :icon="slackAvatar" color="white"></v-icon>
        </v-avatar>
        <div class="text-left flex-grow-1">
          <div class="d-flex align-center justify-space-between">
            <span class="text-subtitle-2 font-weight-bold text-white">{{ slackUser }}</span>
            <span class="text-caption text-grey-lighten-1">たった今</span>
          </div>
          <p class="text-body-2 text-wrap text-grey-lighten-2 ma-0" style="line-height: 1.3; max-width: 280px;">{{ slackMessage }}</p>
        </div>
      </div>
    </transition>

    <!-- ==========================================================
         🟢 【共通演出レイヤー】誤判定（False）メール強制開封ダイアログ
         ========================================================== -->
    <v-dialog v-model="showDiag" :persistent="isForcedMode" width="700" transition="none">
      <v-card :style="{ backgroundColor: popupBgColor, border: `2px solid ${popupColor}` }" class="pa-6 text-left position-relative">
        <v-btn
          v-if="!isForcedMode"
          icon="mdi-close"
          variant="text"
          :color="popupColor"
          style="position: absolute; top: 12px; right: 12px; z-index: 10;"
          @click="showDiag = false"
        ></v-btn>

        <div class="d-flex align-center justify-space-between pb-3 mb-4" :style="{ borderBottom: `2px solid ${popupColor}` }">
          <div class="d-flex align-center">
            <v-icon icon="mdi-email-open-outline" :color="popupColor" class="me-2" size="large"></v-icon>
            <span class="text-subtitle-1 font-weight-bold text-grey-darken-4">社内メールシステム</span>
          </div>
          <v-chip size="small" :color="popupColor" variant="flat" class="text-white font-weight-bold">
            {{ isForcedMode ? '強制開封警告' : '通知確認' }}
          </v-chip>
        </div>

        <div class="mb-4 pa-3 rounded text-grey-darken-4" style="background-color: rgba(0,0,0,0.06);">
          <div class="text-body-2 mb-1"><span class="font-weight-bold">件名：</span> {{ mailSubject }}</div>
          <div class="text-body-2 mb-1"><span class="font-weight-bold">差出人：</span> {{ mailSender }}</div>
          <div class="text-body-2"><span class="font-weight-bold">アドレス：</span> {{ mailAddress }}</div>
        </div>

        <v-card-text class="px-3 py-3 text-body-1 text-grey-darken-4 font-weight-medium" style="line-height: 1.6; background-color: #ffffff; border-radius: 4px; border: 1px solid #ccc; min-height: 180px; white-space: pre-wrap;">
          {{ mailBody }}
        </v-card-text>

        <div class="text-center text-caption text-grey-darken-2 mt-4">
          <span v-if="isForcedMode" class="font-weight-bold">>> 【警告デモ動作中】5秒後に自動的に元の画面へ復帰します...</span>
          <span v-else class="font-weight-bold">>> 【確認完了】右上の✖ボタン、または背景クリックで閉じてください</span>
        </div>
      </v-card>
    </v-dialog>

    <!-- ==========================================================
         🟢 【共通演出レイヤー】誤判定（False）緊急コールポップアップ
         ========================================================== -->
    <v-dialog v-model="showCall" persistent width="400">
      <v-card color="#1e1e24" variant="flat" :class="['pa-6 text-center rounded-xl border-call', { 'phone-shake': !isCallConnected }]">
        <v-avatar size="80" color="grey-darken-3" class="mx-auto mb-4 elevation-6">
          <v-icon :icon="isCallConnected ? 'mdi-phone-in-talk' : 'mdi-account-phone'" size="48" color="amber-lighten-2"></v-icon>
        </v-avatar>

        <h2 class="text-h6 font-weight-bold text-white mb-1">{{ callerName }}</h2>
        
        <p class="text-body-2 text-grey-lighten-1 mb-6 font-mono">
          {{ isCallConnected ? formatCallTime(callDuration) : callStatus }}
        </p>

        <div class="d-flex justify-center gap-6">
          <!-- 🔴 切断ボタン（クリックすると強制的に解説へリダイレクトして終了） -->
          <v-btn
            icon="mdi-phone-hangup"
            color="error"
            size="large"
            elevation="8"
            class="mx-2"
            @click="handleFalseEnd()"
          ></v-btn>

          <!-- 🟢 応答ボタン -->
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

        <v-expand-transition>
          <div v-if="isCallConnected" class="mt-6 pa-3 rounded bg-grey-darken-4 text-left border-left-error">
            <p class="text-caption text-error font-weight-bold mb-1">>> AUDIO LOG:</p>
            <p class="text-body-2 text-grey-lighten-2" style="line-height: 1.4;">{{ callAudioLog }}</p>
          </div>
        </v-expand-transition>
      </v-card>
    </v-dialog>

    <!-- 疑似通知ログスタックコンテナ（Death / False 共通） -->
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

    <!-- 完全シャットダウン（暗転）用オーバーレイ -->
    <div :class="['blackout-screen', { 'active': showBlackout }]"></div>
  </main>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { fetchMails, fetchQuestionExplanation, type MailListItem } from '@/api/mailApi'
import { getCurrentUser } from '@/api/users'
import { fetchUserAnswerStates } from '@/api/userAnswers'

import { useSound } from '@/components/Effect_comp/useSound'
const { playSound } = useSound()

// ==========================================
// 🚨 バッドエンド（Death）演出系の外部読み込み
// ==========================================
import { triggerNotificationEffect } from './FearEffect/FearEffect_Death_Attack/notificationEffect'
import { triggerNoiseEffect } from './FearEffect/FearEffect_Death_Attack/noiseEffect'
import { triggerBsodEffect } from './FearEffect/FearEffect_Death_Attack/bsodEffect'
import { 
  triggerEncryptEffect, 
  resetEncryptEffect, 
  showEncrypt, 
  encryptProgress, 
  encryptStatusText, 
  encryptMainText, 
  encryptChecklist, 
  popupTitle, 
  popupIcon, 
  popupColor 
} from './FearEffect/FearEffect_Death_Attack/encryptEffect'
import { triggerSequenceEffect } from './FearEffect/FearEffect_Death_Attack/sequenceController'

// ==========================================
// 🟢 誤判定（False）演出系の外部読み込み
// ==========================================
import { triggerFalseNotification } from './FearEffect/FearEffect_False_End/falseNotificationEffect'
import { triggerDiagEffect, showDiag, resetDiagEffect, mailSubject, mailSender, mailAddress, mailBody, popupBgColor, isForcedMode } from './FearEffect/FearEffect_False_End/diagEffect'
import { triggerCallEffect, answerCall, hangUpCall, formatCallTime, showCall, callerName, callStatus, callDuration, isCallConnected, callAudioLog } from './FearEffect/FearEffect_False_End/callEffect'
import { triggerChatEffectByTag, showSlack, slackUser, slackMessage, slackAvatar, chatType } from './FearEffect/FearEffect_False_End/slackEffect'

const router = useRouter()

const mails = ref<MailListItem[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

type MailAnswerState = {
  answered: boolean
  effectFlag: boolean | null
  isCorrect: boolean | null
  visible: boolean
  locked: boolean
}

type IncomingMailboxState = {
  justAnswered?: boolean
  isCorrect?: boolean
  mail?: {
    id?: unknown
  }
}

const answerStateMap = ref<Record<string, MailAnswerState>>({})
const pendingRevealTimers = new Map<string, number>()
const correctRevealDelayMs = 2500

function clearPendingRevealTimers() {
  for (const timer of pendingRevealTimers.values()) {
    window.clearTimeout(timer)
  }
  pendingRevealTimers.clear()
}

function normalizeMailAnswerState(state: MailAnswerState): MailAnswerState {
  return {
    ...state,
    locked: state.answered === true && state.visible === false,
  }
}

function setMailAnswerState(questionId: string, patch: Partial<MailAnswerState>) {
  answerStateMap.value = {
    ...answerStateMap.value,
    [questionId]: normalizeMailAnswerState({
      ...(answerStateMap.value[questionId] ?? { answered: false, effectFlag: null, isCorrect: null, visible: false, locked: false }),
      ...patch,
    }),
  }
}

function scheduleCorrectReveal(questionId: string) {
  if (!questionId) return

  const existing = answerStateMap.value[questionId]
  if (!existing || !existing.answered || existing.isCorrect !== true || existing.visible || existing.locked !== true) return

  const existingTimer = pendingRevealTimers.get(questionId)
  if (existingTimer) window.clearTimeout(existingTimer)

  const timer = window.setTimeout(() => {
    setMailAnswerState(questionId, { visible: true })
    pendingRevealTimers.delete(questionId)
  }, correctRevealDelayMs)

  pendingRevealTimers.set(questionId, timer)
}

function getIncomingMailboxState(): IncomingMailboxState | null {
  const routeState = (router.currentRoute.value as unknown as { state?: unknown }).state
  if (routeState && typeof routeState === 'object') {
    return routeState as IncomingMailboxState
  }

  const rawState = window.history.state as unknown
  const nestedState = typeof rawState === 'object' && rawState !== null && 'usr' in rawState
    ? (rawState as { usr?: unknown }).usr
    : undefined

  if (nestedState && typeof nestedState === 'object') {
    return nestedState as IncomingMailboxState
  }

  return rawState && typeof rawState === 'object'
    ? (rawState as IncomingMailboxState)
    : null
}

function clearPendingAnswerState() {
  const currentState = window.history.state as Record<string, unknown> | undefined
  const nextState = currentState && typeof currentState === 'object' ? { ...currentState } : {}

  if (nextState.usr && typeof nextState.usr === 'object') {
    const nestedState = { ...(nextState.usr as Record<string, unknown>) }
    delete nestedState.justAnswered
    delete nestedState.isCorrect
    delete nestedState.mail
    nextState.usr = nestedState
  }

  delete nextState.justAnswered
  delete nextState.isCorrect
  delete nextState.mail

  window.history.replaceState(nextState, '')
}

function getPendingAnswerState() {
  const incomingState = getIncomingMailboxState()
  if (!incomingState?.justAnswered) {
    return null
  }

  const mail = incomingState.mail
  const questionId = mail && typeof mail === 'object' && 'id' in mail ? mail.id : undefined
  if (typeof questionId !== 'string') {
    clearPendingAnswerState()
    return null
  }

  clearPendingAnswerState()

  return {
    questionId,
    isCorrect: incomingState.isCorrect === true,
  }
}

async function hydrateAnsweredMailStates(questionIds: string[], pendingAnswer?: { questionId: string; isCorrect: boolean } | null) {
  const user = getCurrentUser()
  const userId = user?.id

  if (!userId || questionIds.length === 0) {
    answerStateMap.value = {}
    return
  }

  try {
    const rows = await fetchUserAnswerStates(userId, questionIds)

    const nextState: Record<string, MailAnswerState> = {}

    for (const questionId of questionIds) {
      nextState[questionId] = { answered: false, effectFlag: null, isCorrect: null, visible: false, locked: false }
    }

    if (pendingAnswer?.questionId) {
      const pendingQuestionId = pendingAnswer.questionId
      nextState[pendingQuestionId] = normalizeMailAnswerState({
        answered: true,
        effectFlag: null,
        isCorrect: pendingAnswer.isCorrect,
        visible: false,
        locked: true,
      })
    }

    for (const item of rows) {
      const questionId = item.question_id
      if (!questionId || questionId === pendingAnswer?.questionId) continue

      const isCorrect = typeof item.is_correct === 'boolean' ? item.is_correct : null
      const effectFlag = typeof item.effect_flag === 'boolean' ? item.effect_flag : null
      const visible = true

      nextState[questionId] = normalizeMailAnswerState({
        answered: true,
        effectFlag,
        isCorrect,
        visible,
        locked: false,
      })
    }

    answerStateMap.value = nextState

    for (const [questionId, state] of Object.entries(answerStateMap.value)) {
      if (state.answered && state.isCorrect === true && state.visible === false && state.locked === true) {
        scheduleCorrectReveal(questionId)
      }
    }
  } catch (error) {
    console.error('回答状態の取得に失敗しました:', error)
    answerStateMap.value = {}
  }
}

async function activateIncorrectEffectFlag(questionId: string | undefined) {
  if (!questionId) return

  setMailAnswerState(questionId, { answered: true, effectFlag: null, isCorrect: false, visible: false })
  setMailAnswerState(questionId, { answered: true, effectFlag: true, isCorrect: false, visible: true })
}

function getMailAnswerState(mailId: string): MailAnswerState {
  return answerStateMap.value[mailId] ?? { answered: false, effectFlag: null, isCorrect: null, visible: false, locked: false }
}

function isMailLocked(mailId: string): boolean {
  return getMailAnswerState(mailId).locked === true
}

// 状態記憶用キャッシュ
const currentMailState = ref<any>(null)
// 安全に解説ページへ引き渡すためのカテゴリ正規化状態 ('student' | 'company' | 'general')
type ExplanationCategory = 'student' | 'company' | 'general'
type SituationType = 'business' | 'school' | 'daily'

const currentCategory = ref<ExplanationCategory>('general')

// 🚨 演出コントロール用リアクティブ変数群
const notifications = ref<any[]>([])
const showNoise = ref(false)
const showBsod = ref(false)
const bsodPercent = ref(0)
const showBlackout = ref(false)

const isSystemLocked = ref(false)

// 🔒 画面操作ロック用の状態（追加）
const showLockMessage = ref(false);

const handleLockClick = () => {
  if (isSystemLocked.value) {
    playSound('/sounds/pop.wav')
    showLockMessage.value = true;
  }
};

const SCENARIO_PROFILES: Record<SituationType, { intensity: 'high' | 'medium' | 'low'; chatType: string; caller: string }> = {
  business: { intensity: 'high', chatType: 'slack', caller: '総務部 佐藤' },
  school: { intensity: 'medium', chatType: 'discord', caller: '担任の先生' },
  daily: { intensity: 'low', chatType: 'line', caller: '友人' }
};

const normalizeCategory = (value: unknown): ExplanationCategory => {
  const input = String(value || '').toLowerCase()
  if (input === 'student' || input === 'school') return 'student'
  if (input === 'company' || input === 'business') return 'company'
  return 'general'
}

const categoryToScenario = (category: ExplanationCategory): SituationType => {
  if (category === 'student') return 'school'
  if (category === 'company') return 'business'
  return 'daily'
}

async function load() {
  loading.value = true
  error.value = null
  try {
    // 1. getCurrentUserを使って、ローカルストレージから瞬時にユーザー情報を取得！
    const user = getCurrentUser()

    // 2. ユーザーの現在のシチュエーションを取得（設定されていなければ 'school' をデフォルトにする）
    const userScenario = user?.current_scenario ?? 'school'

    // 3. 取得したシチュエーションを条件にして、バックエンドからメールを取得する
    mails.value = await fetchMails(userScenario)
    const pendingAnswer = getPendingAnswerState()
    await hydrateAnsweredMailStates(mails.value.map((mail) => mail.id), pendingAnswer)

  } catch (e) {
    error.value = e instanceof Error ? e.message : 'メールの取得に失敗しました'
  } finally {
    loading.value = false
  }
}
/**
 * 🚨 すべての演出状態をリセットするクリーンアップ処理
 */
const resetAllEffects = () => {
  showBsod.value = false
  showNoise.value = false
  showBlackout.value = false
  bsodPercent.value = 0
  resetEncryptEffect()
  resetDiagEffect()
  hangUpCall()
}


/**
 * 💀 バッドエンド演出
 */
const startBadEndSequence = (state: any, scenarioType: SituationType = 'business') => {
  isSystemLocked.value = true; // 🚨 画面操作をロック
  const profile = SCENARIO_PROFILES[scenarioType];
  console.log(`💀 バッドエンド演出開始: ${scenarioType} (強度: ${profile.intensity})`);
  
  setTimeout(() => { triggerNotificationEffect(notifications, scenarioType, 1) }, 500);
  setTimeout(() => { triggerNotificationEffect(notifications, scenarioType, 2) }, 1500);
  setTimeout(() => { triggerEncryptEffect(scenarioType) }, 2500);
  setTimeout(() => { 
    resetEncryptEffect();
    triggerNoiseEffect(showNoise);
  }, 6500);

  setTimeout(() => {
    triggerSequenceEffect(
      notifications,
      showNoise,
      () => triggerBsodEffect({ 
        show: showBsod, 
        percent: bsodPercent, 
        isBlackout: showBlackout, 
        onComplete: () => {
          resetAllEffects();
          isSystemLocked.value = false; // ロックを解除
          router.push({ 
            path: '/explanation', 
            state: {
              mail: state.mail,
              isCorrect: false,
              needFadeIn: true,
              judgedAction: state.judgedAction,
              category: currentCategory.value,
            } 
          })
        } 
      })
    )
  }, 8000)
}

/**
 * 🟢 誤判定（誤報告）ホラー演出シーケンス
 */
const startFalseSequence = (state: any, scenarioType: SituationType = 'business') => {
  isSystemLocked.value = true; // 🚨 画面操作をロック
  currentMailState.value = state;
  const profile = SCENARIO_PROFILES[scenarioType];
  const delayFactor = profile.intensity === 'high' ? 0.8 : 1.2;

  console.log(`⚠ 誤報告演出開始: ${scenarioType}`);

  // 演出シーケンスを開始
  triggerFalseNotification(notifications, scenarioType, 1);
  playSound('/sounds/pop.wav')
  
  setTimeout(() => triggerChatEffectByTag(scenarioType), 1000 * delayFactor);
  setTimeout(() => playSound('/sounds/message.wav'), 1000 * delayFactor);

  setTimeout(() => triggerFalseNotification(notifications, scenarioType, 2), 2500 * delayFactor);
  setTimeout(() => playSound('/sounds/pop.wav'), 4000 * delayFactor);

  setTimeout(() => triggerCallEffect(scenarioType), 4000 * delayFactor);

  setTimeout(() => playSound('/sounds/Ring.wav'), 4000 * delayFactor);

  // 演出終了後に確実に遷移するためのシーケンス終了監視
  setTimeout(() => {
    // 最後に暗転を入れ、演出の締めくくりを演出してから遷移
    showBlackout.value = true;
    void activateIncorrectEffectFlag(state?.mail?.id ?? state?.id);
    isSystemLocked.value = false; // ロックを解除
    setTimeout(() => {
      handleFalseEnd(state);
      router.push({
    path: '/explanation',
    state: {
      mail: state.mail,
      isCorrect: false,
      needFadeIn: true,        // 解説ページのフェードイン演出を有効化
      judgedAction: state.judgedAction,
      category: currentCategory.value   // カテゴリを正しく引き継ぐ
    }
  });
    }, 500); // 暗転から遷移までの猶予
  }, 7500 * delayFactor);
};

/**
 * 📞 誤報告時の安全なリダイレクト処理
 */
const handleFalseEnd = (state: any = currentMailState.value) => {
  if (!state?.mail) return

  // 演出系をリセット
  resetAllEffects();
  hangUpCall();
  resetDiagEffect();

};

/**
 * 💀＆🟢 前の画面から運ばれたフラグを元に自動演出を切り分ける
 */
// MailboxList.vue 内の checkDeathSequence を以下に置き換えてください
function getHistoryState(): any {
  const rawState = window.history.state
  return rawState?.usr || rawState
}

function replaceHistoryState(patch: Record<string, unknown>) {
  const rawState = window.history.state ?? {}

  if (rawState && typeof rawState === 'object' && 'usr' in rawState) {
    window.history.replaceState(
      {
        ...rawState,
        usr: {
          ...(rawState.usr ?? {}),
          ...patch,
        },
      },
      '',
    )
    return
  }

  window.history.replaceState({ ...rawState, ...patch }, '')
}

function setHistoryState(nextState: Record<string, unknown>) {
  const rawState = window.history.state ?? {}

  if (rawState && typeof rawState === 'object' && 'usr' in rawState) {
    window.history.replaceState({ ...rawState, usr: nextState }, '')
    return
  }

  window.history.replaceState(nextState, '')
}

function checkDeathSequence() {
  const state = getHistoryState()
  if (!state) return

  const category = normalizeCategory(state.category || state.mail?.category || state.mailData?.mail?.category)
  currentCategory.value = category
  const scenarioType = categoryToScenario(category)

  // ✨ 正解時：遅延なしですぐに解説ページへ遷移
  

  if (state.isTimeUpReady) {
    if (state.mode === 'death') {
      startBadEndSequence(state.mailData, scenarioType)
    } else if (state.mode === 'socialDeath') {
      startFalseSequence(state.mailData, scenarioType)
    }

    replaceHistoryState({ isTimeUpReady: false })
    return
  }

  if (state.triggerDeath || state.triggerSocialDeath) {
    const delayMs = 5000
    const mode = state.triggerDeath ? 'death' : 'socialDeath'
    const savedMailData = state
    const targetPath = router.currentRoute.value.path

    console.log(`Sequence flag received: ${mode}; starting in ${delayMs / 1000}s`)
    replaceHistoryState({ triggerDeath: false, triggerSocialDeath: false })

    if ((window as any).__deathSequenceTimer) {
      clearTimeout((window as any).__deathSequenceTimer)
    }

    ;(window as any).__deathSequenceTimer = setTimeout(() => {
      ;(window as any).__deathSequenceTimer = null

      const nextState = {
        isTimeUpReady: true,
        mode,
        mailData: savedMailData,
        category,
      }

      if (router.currentRoute.value.path === targetPath) {
        setHistoryState(nextState)
        checkDeathSequence()
        return
      }

      router.push({ path: targetPath, state: nextState })
    }, delayMs)
  }
}
// startBadEndSequence と startFalseSequence の引数型も更新

function openMail(id: string) {
  if (isMailLocked(id)) {
    return
  }

  router.push({ name: 'MailOpen', query: { id } })
}

async function openExplanation(mail: MailListItem) {
  try {
    const explanation = await fetchQuestionExplanation(mail.id)
    router.push({
      path: '/explanation',
      state: {
        mail: {
          ...mail,
          question_explanations: explanation,
        },
        isCorrect: false,
      },
    })
  } catch (error) {
    console.error('解説の取得に失敗しました:', error)
  }
}

function preview(body: string): string {
  const plain = body.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  return plain.length > 60 ? plain.slice(0, 60) + '…' : plain
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(() => {
  checkDeathSequence()
  load()
})

onBeforeUnmount(() => {
  clearPendingRevealTimers()
})
</script>

<style lang="css" scoped>
.mailbox-page {
  position: relative;
  box-sizing: border-box;
  min-height: 100vh;
  padding: 18px 22px 14px;
  background: var(--page-bg);
  color: var(--page-text);
}

.mailbox-hero {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.mailbox-hero__icon {
  color: var(--accent-strong);
  font-size: 42px;
}

.mailbox-hero h1 {
  margin: 0;
  font-size: 30px;
  font-weight: 800;
  line-height: 1.1;
}

.mailbox-hero p,
.mailbox-panel__header p,
.mail-row__preview,
.mail-row__meta,
.mailbox-state p {
  margin: 0;
  color: var(--muted);
}

.mailbox-hero p {
  margin-top: 6px;
  font-size: 16px;
}

.mailbox-panel {
  width: min(100%, 1040px);
  padding: 18px 22px 20px;
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  background: var(--panel-bg);
}

.mailbox-panel__header {
  margin-bottom: 18px;
}

.mailbox-panel__header h2 {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 800;
  line-height: 1.3;
}

.mailbox-panel__header p {
  font-size: 14px;
}

.mail-list {
  display: grid;
  gap: 10px;
}

.mail-row {
  min-width: 0;
}

.mail-row__content-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mail-row--answered .mail-row__button {
  border-color: rgba(69, 164, 255, 0.4);
  box-shadow: inset 0 0 0 1px rgba(69, 164, 255, 0.22);
}

.mail-row--locked .mail-row__button {
  opacity: 0.58;
  filter: grayscale(0.28);
  cursor: not-allowed;
}

.mail-row--warning .mail-row__button {
  background: linear-gradient(90deg, rgba(255, 115, 130, 0.18), rgba(17, 26, 47, 0.96));
}

.mail-row--review .mail-row__button {
  background: linear-gradient(90deg, rgba(60, 190, 126, 0.16), rgba(17, 26, 47, 0.96));
}

.mail-row--success .mail-row__button {
  background: linear-gradient(90deg, rgba(60, 190, 126, 0.16), rgba(17, 26, 47, 0.96));
}

.mail-row__button {
  display: grid;
  width: 100%;
  min-height: 88px;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: var(--surface-bg);
  color: var(--page-text);
  cursor: pointer;
  text-align: left;
  transition:
    border-color 160ms ease,
    background-color 160ms ease;
}

.mail-row__button:hover,
.mail-row__button:focus-visible {
  border-color: var(--accent-strong);
  background: color-mix(in srgb, var(--surface-bg) 78%, var(--accent-strong));
  outline: none;
}

.mail-row__icon {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 8px;
  background: color-mix(in srgb, var(--accent-strong) 24%, var(--surface-bg));
  color: var(--accent-strong);
}

.mail-row__icon :deep(.v-icon) {
  font-size: 24px;
}

.mail-row__content {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.mail-row__sender,
.mail-row__title,
.mail-row__preview {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mail-row__sender {
  font-size: 15px;
  font-weight: 800;
  line-height: 1.25;
}

.mail-row__title {
  font-size: 16px;
  font-weight: 800;
  line-height: 1.3;
}

.mail-row__preview {
  font-size: 13px;
  line-height: 1.35;
}

.mail-row__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  line-height: 1.2;
  white-space: nowrap;
}

.mail-row__action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
  min-height: 42px;
  padding: 0 12px;
  border: 1px solid rgba(69, 164, 255, 0.4);
  border-radius: 999px;
  background: rgba(69, 164, 255, 0.16);
  color: #ffffff;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.mail-row__action:hover,
.mail-row__action:focus-visible {
  background: rgba(69, 164, 255, 0.25);
  outline: none;
}

.mail-row__status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(69, 164, 255, 0.14);
  color: #9fd4ff;
  font-weight: 700;
}

.mail-row__status--warning {
  background: rgba(255, 115, 130, 0.16);
  color: #ffb2bd;
}

.mail-row__status--review {
  background: rgba(60, 190, 126, 0.16);
  color: #b9f2cf;
}

.mail-row__status--success {
  background: rgba(60, 190, 126, 0.16);
  color: #b9f2cf;
}

.mail-row__meta :deep(.v-icon) {
  color: var(--page-text);
  font-size: 20px;
}

.mailbox-state {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 92px;
  padding: 18px;
  border-radius: 8px;
  background: var(--surface-bg);
}

.mailbox-state__icon {
  flex: 0 0 auto;
  color: var(--accent-strong);
  font-size: 34px;
}

.mailbox-state--error .mailbox-state__icon {
  color: var(--danger);
}

.mailbox-state h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  line-height: 1.3;
}

.mailbox-state p {
  margin-top: 4px;
  font-size: 14px;
  line-height: 1.45;
}

.secondary-button {
  min-height: 38px;
  margin-left: auto;
  padding: 0 18px;
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  background: transparent;
  color: var(--page-text);
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
}

.secondary-button:hover,
.secondary-button:focus-visible {
  background: var(--panel-bg);
  outline: none;
}

.mail-row-skeleton {
  display: grid;
  min-height: 88px;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 8px;
  background: var(--surface-bg);
}

.mail-row-skeleton__icon,
.mail-row-skeleton__line {
  display: block;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    var(--toggle-bg),
    var(--surface-border),
    var(--toggle-bg)
  );
  background-size: 220% 100%;
  animation: mailbox-loading 1200ms ease-in-out infinite;
}

.mail-row-skeleton__icon {
  width: 42px;
  height: 42px;
  border-radius: 8px;
}

.mail-row-skeleton__line {
  width: 100%;
  height: 10px;
  margin-top: 9px;
}

.mail-row-skeleton__line:first-child {
  margin-top: 0;
}

.mail-row-skeleton__line--short {
  width: 32%;
}

.mail-row-skeleton__line--medium {
  width: 64%;
}

@keyframes mailbox-loading {
  to {
    background-position: -220% 0;
  }
}

/* ==========================================================
     🚨 【演出用】共通演出CSS（Death / False 統合）
   ========================================================== */
.font-mono { font-family: 'Courier New', Courier, monospace; }
.min-height-zero { min-height: unset !important; }

/* 疑似デスクトップ通知スタック */
.custom-notification-stack { 
  position: fixed; 
  bottom: 16px; 
  right: 16px; 
  z-index: 9000; 
  display: flex; 
  flex-direction: column-reverse; 
  pointer-events: none; 
}
.custom-toast-card { pointer-events: auto; }
.border-red { border-left: 4px solid #ff5252 !important; border-radius: 4px; }
.border-orange { border-left: 4px solid #ff9800 !important; border-radius: 4px; }
.border-green { border-left: 4px solid #00c853 !important; border-radius: 4px; }
.border-yellow { border-left: 4px solid #ffb300 !important; border-radius: 4px; }
.border-blue { border-left: 4px solid #03a9f4 !important; border-radius: 4px; }

.list-enter-active, .list-leave-active { transition: all 0.4s ease; }
.list-enter-from { opacity: 0; transform: translateX(100px); }
.list-leave-to { opacity: 0; transform: translateY(-20px); }

/* ランサム警告ポップアップ点滅 */
.blink-fast { animation: blink-fast-anim 0.4s infinite alternate; }
@keyframes blink-fast-anim { 0% { opacity: 1; } 100% { opacity: 0.3; } }

/* 砂嵐（グリッチ）ノイズ */
.vivid-noise-overlay { 
  position: fixed; 
  top: 0; 
  left: 0; 
  width: 100vw; 
  height: 100vh; 
  z-index: 9998; 
  pointer-events: none; 
  background: repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.15) 1px, transparent 1px, transparent 2px), 
              repeating-linear-gradient(90deg, rgba(255, 0, 0, 0.1), rgba(0, 255, 0, 0.1) 2px, rgba(0, 0, 255, 0.1) 3px); 
  background-size: 100% 4px, 6px 100%; 
  animation: glitch-flicker 0.15s infinite; 
}
@keyframes glitch-flicker { 
  0% { transform: translate(2px, 1px) skewX(1deg); filter: invert(0); background-color: rgba(255, 255, 255, 0.05); } 
  50% { transform: translate(-1px, -1px) skewX(-2deg); filter: invert(0.1); background-color: rgba(0, 0, 0, 0.1); } 
  100% { transform: translate(1px, 2px) skewX(0deg); filter: invert(0); background-color: rgba(255, 255, 255, 0.05); } 
}

/* Windowsブルースクリーン */
.bsod-screen { 
  position: fixed; 
  top: 0; 
  left: 0; 
  width: 100vw; 
  height: 100vh; 
  background-color: #0078d7 !important; 
  color: #ffffff !important; 
  z-index: 9999; 
  font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; 
}
.bsod-content { padding: 10% 12%; text-align: left; }
.bsod-smiley { font-size: 120px; line-height: 1; margin-bottom: 20px; }
.bsod-title { font-size: 28px; font-weight: 300; margin-bottom: 20px; line-height: 1.4; }
.bsod-text, .bsod-percent { font-size: 20px; font-weight: 300; margin-bottom: 10px; }

/* 完全シャットダウン（暗転） */
.blackout-screen {
  position: fixed;
  top: 0; 
  left: 0; 
  width: 100vw; 
  height: 100vh;
  background-color: #000000 !important;
  z-index: 99999;
  opacity: 0;
  pointer-events: none;
  transition: opacity 2.0s ease-in-out;
}
.blackout-screen.active {
  opacity: 1;
  pointer-events: auto;
  transition: opacity 0s !important;
}

/* 📞 False専用着信ポップアップ用ネオン枠 */
.border-call {
  border: 1px solid #4caf50 !important;
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.3) !important;
}

/* 電話着信バイブレーション */
.phone-shake {
  animation: phone-vibrate-anim 0.15s infinite alternate;
}
@keyframes phone-vibrate-anim {
  0% { transform: translate(1px, 1px) rotate(0deg); }
  100% { transform: translate(-1px, -1px) rotate(0.5deg); }
}

/* 通話応答アイコンのアニメーション */
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

/* 💬 チャット通知ポップアップ */
.custom-chat-popup {
  position: fixed;
  width: 360px;
  border-radius: 8px;
  z-index: 99999;
}

/* Slack：画面の上部中央 */
.custom-chat-popup.slack {
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #ffffff !important;
  border: 1px solid #dcdcdc;
  color: #4a154b !important;
  border-left: 5px solid #4a154b !important;
}

/* Discord：画面の右下隅 */
.custom-chat-popup.discord-bottom-position {
  bottom: 24px;
  right: 24px;
  background-color: #2f3136 !important;
  border: 1px solid #202225;
  border-left: 5px solid #5865F2 !important;
}

/* LINE：デスクトップ通知右下 */
.custom-chat-popup.line-bottom-position {
  bottom: 120px; 
  right: 24px;
  background-color: #ffffff !important;
  border: 1px solid #e5e5e5;
  border-radius: 12px !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12) !important;
}

/* アニメーション */
.slide-top-enter-active { transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.slide-top-leave-active { transition: all 0.25s ease-in; }
.slide-top-enter-from, .slide-top-leave-to { transform: translate(-50%, -100px); opacity: 0; }

.slide-right-enter-active { transition: all 0.25s cubic-bezier(0.25, 1, 0.5, 1); }
.slide-right-leave-active { transition: all 0.2s ease-in; }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(120px); opacity: 0; }

@media (max-width: 900px) {
  .mailbox-page {
    padding: 18px 14px 16px;
  }
  .mailbox-panel {
    padding: 16px;
  }
}

@media (max-width: 640px) {
  .mailbox-hero {
    align-items: flex-start;
  }
  .mailbox-hero h1 {
    font-size: 28px;
  }
  .mail-row__button {
    grid-template-columns: auto minmax(0, 1fr);
  }
  .mail-row__meta {
    grid-column: 2;
    justify-content: space-between;
  }
  .mailbox-state {
    align-items: flex-start;
    flex-direction: column;
  }
  .secondary-button {
    width: 100%;
    margin-left: 0;
  }
}

.system-lock-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: transparent; /* 完全に透明な罠 */
  z-index: 2000; /* 通常UIの上、かつVuetifyのダイアログ(z-index: 2400~)の下 */
  cursor: not-allowed; /* マウスカーソルを「禁止」マークに変更して絶望感を演出 */
}
</style>
