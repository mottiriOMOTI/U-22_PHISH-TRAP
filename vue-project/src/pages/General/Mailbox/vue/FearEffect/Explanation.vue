<template>
  <v-container class="explanation-container py-8 px-4" max-width="960">
    <!-- フェードイン用オーバーレイ -->
    <div :class="['explanation-fade-overlay', { 'is-fading': startFadeOut }]" v-if="showFadeOverlay"></div>

    <div class="d-flex justify-center mt-6 mb-2">
      <v-icon
        :icon="pageIcon"
        size="160"
        :class="pageIconClass"
      ></v-icon>
    </div>

    <h1 class="d-flex justify-center text-h4 font-weight-black mb-1">{{ pageTitle }}</h1>
    <h3 class="d-flex justify-center text-subtitle-1 color-subtitle mb-6">{{ pageSubtitle }}</h3>

    <v-row v-if="isLoading" class="my-6 justify-center">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </v-row>

    <v-row v-else class="margin-3">
      <v-col v-for="item in cards" :key="item.id" cols="12">
        
        <BaseCard
          v-if="item.type === 'danger'"
          :type="item.type"
          :title="item.title || (isPhishing ? 'フィッシングメール本文' : '通常メール本文')" 
          :subTitle="item.sender_name ? `${item.sender_name} <${item.sender_email}>` : item.sender_email" 
          :text="item.body" 
          :color="item.color"
          :variant="item.variant"
        />
        
        <BaseCard
          v-else-if="item.type === 'DangerExplanation'"
          :type="item.type"
          :title="isPhishing ? 'なぜ危険なのか（解説）' : '安全と判断できる理由'"
          :text="item.why_dangerous"
          :color="item.color"
          :variant="item.variant"
        />

        <BaseCard
          v-else-if="item.type === 'advice'"
          :type="item.type"
          :title="isPhishing ? '安全に見破るチェックリスト' : '注目すべき箇所のリスト'"
          :textList="item.warning_signals"
          :color="item.color"
          :variant="item.variant"
        />

        <BaseCard
          v-else-if="item.type === 'correctiveAction'"
          :type="item.type"
          :title="isPhishing ? '正しい対処法' : '類似した詐欺・対策'"
          :textList="item.correct_action"
          :color="item.color"
          :variant="item.variant"
        />

      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12">
        <v-card
          variant="tonal"
          color="secondary"
          class="pa-4"
        >
          <div class="d-flex align-center mb-2">
            <v-icon icon="mdi-book-open-page-variant" class="me-2" size="large"></v-icon>
            <h3 class="text-h6 font-weight-bold">📝 学習のポイント</h3>
          </div>
          <v-card-text class="px-0 pb-0 text-body-1 text-high-emphasis">
            今回体験した「恐怖」を忘れないでください。実際のフィッシング詐欺では、本物のランサムウェア感染や個人情報の洩れが発生します。このトレーニングで学んだ警告サインを実生活でも必ず確認しましょう。
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-8 px-1 justify-center">
      <v-col cols="12" sm="6" md="4">
        <v-btn 
          block 
          color="primary" 
          size="large"
          variant="elevated" 
          prepend-icon="mdi-arrow-left-box" 
          class="font-weight-bold text-body-1"
          @click="goToPage('MailboxList')"
        >
          メールボックスに戻る
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import BaseCard from '@/components/ui/IshikawaStyle.vue'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const pageTitle = ref('フィッシング詐欺に遭遇')
const pageSubtitle = ref('今のは危険なメールでした')
const pageIcon = ref('mdi-close-circle-outline')
const pageIconClass = ref('slow-pulse super-vivid-red')

const cards = ref<any[]>([])
const isLoading = ref(true)

// フェードイン制御用フラグ
const showFadeOverlay = ref(false)
const startFadeOut = ref(false)

const isPhishing = computed(() => {
  const dangerCard = cards.value.find(item => item.type === 'danger')
  return dangerCard?.is_phishing !== false
})

const initializeExplanation = () => {
  isLoading.value = true
  const state = window.history.state
  const mail = state?.mail
  const isCorrect = !!state?.isCorrect

  // フェードイン演出の判定
  if (state?.needFadeIn) {
    showFadeOverlay.value = true
    setTimeout(() => {
      startFadeOut.value = true
      // 2.5秒後にオーバーレイをDOMから完全に消す
      setTimeout(() => { showFadeOverlay.value = false }, 2500)
    }, 100)
  }

  if (mail) {
    // データ解析処理...
    const explanationData = mail.question_explanations || {}
    let parsedWarningSignals: string[] = []
    if (explanationData.warning_signals) {
      if (typeof explanationData.warning_signals === 'string') {
        try { parsedWarningSignals = JSON.parse(explanationData.warning_signals) } catch (e) { parsedWarningSignals = [explanationData.warning_signals] }
      } else if (Array.isArray(explanationData.warning_signals)) {
        parsedWarningSignals = explanationData.warning_signals
      }
    }

    let parsedCorrectActions: string[] = []
    if (explanationData.correct_action) {
      if (typeof explanationData.correct_action === 'string') {
        parsedCorrectActions = explanationData.correct_action.split('\n').filter((line: string) => line.trim() !== '')
      } else if (Array.isArray(explanationData.correct_action)) {
        parsedCorrectActions = explanationData.correct_action
      }
    }

    cards.value = [
      { id: mail.id, type: 'danger', ...mail, color: 'error', variant: 'tonal' },
      { id: 'exp', type: 'DangerExplanation', why_dangerous: explanationData.why_dangerous || 'このメールは危険です。', color: 'warning', variant: 'tonal' },
      { id: 'adv', type: 'advice', warning_signals: parsedWarningSignals.length > 0 ? parsedWarningSignals : ['送信元ドメインの不審さ', '緊急性を煽る文面'], color: 'info', variant: 'tonal' },
      { id: 'act', type: 'correctiveAction', correct_action: parsedCorrectActions.length > 0 ? parsedCorrectActions : ['正規サイトからアクセス', '報告・破棄'], color: 'success', variant: 'tonal' }
    ]
    
    applyJudgementMode(isCorrect)
  }
  isLoading.value = false
}

const applyJudgementMode = (isCorrect: boolean) => {
  if (isCorrect) {
    pageTitle.value = '正解'
    pageIcon.value = 'mdi-check-circle-outline'
    pageIconClass.value = 'super-vivid-green'
    pageSubtitle.value = isPhishing.value ? '適切な判断ができました！' : '仕事をやり遂げました！'
  } else {
    pageIcon.value = 'mdi-close-circle-outline'
    pageIconClass.value = 'slow-pulse super-vivid-red'
    pageTitle.value = isPhishing.value ? 'フィッシング詐欺に遭遇' : '安全なメールの確認'
    pageSubtitle.value = isPhishing.value ? '今のは詐欺でした' : '今のは正常なメールでした'
  }
}

onMounted(initializeExplanation)
const goToPage = (pageName: string) => { router.push({ name: pageName }) }
</script>

<style lang="css" scoped>
.explanation-container { color: #ffffff; }
.margin-3 { margin-top: 2em; }
.color-subtitle { color: #9fbbe0 !important; }
.super-vivid-red { color: #FF3B30 !important; }
.super-vivid-green { color: #34C759 !important; }
.slow-pulse { animation: pulse-animation 1.5s ease-in-out infinite alternate; }
@keyframes pulse-animation { 0% { opacity: 1; } 100% { opacity: 0.35; } }

/* フェードイン用スタイル */
.explanation-fade-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #000000 !important;
  z-index: 99999;
  opacity: 1;
  pointer-events: none;
  transition: opacity 2.5s ease-in-out;
}
.explanation-fade-overlay.is-fading {
  opacity: 0;
}
</style>