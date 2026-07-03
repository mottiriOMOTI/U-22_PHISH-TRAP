<template>
<<<<<<< HEAD
  <main class="explanation-page" :aria-busy="isLoading ? 'true' : 'false'" aria-labelledby="explanation-title">
    <div v-if="showFadeOverlay" :class="['explanation-fade-overlay', { 'is-fading': startFadeOut }]" />

    <header class="explanation-hero">
      <span :class="['explanation-result-icon', `explanation-result-icon--${resultTone}`]">
        <v-icon :icon="pageIcon" />
      </span>
      <div>
        <p class="explanation-eyebrow">{{ resultLabel }}</p>
        <h1 id="explanation-title">{{ pageTitle }}</h1>
        <p>{{ pageSubtitle }}</p>
      </div>
    </header>

    <section v-if="isLoading" class="explanation-panel explanation-panel--message" role="status" aria-live="polite">
      <span class="explanation-loading-icon" />
      <div>
        <h2>解説を読み込んでいます</h2>
        <p>今回の判断結果とメールの確認ポイントを整理しています。</p>
      </div>
    </section>

    <section v-else-if="!mailCard" class="explanation-panel explanation-panel--message" role="alert">
      <v-icon icon="mdi-alert-circle-outline" class="explanation-message-icon" />
      <div>
        <h2>解説データが見つかりません</h2>
        <p>メールボックスからもう一度トレーニングを開始してください。</p>
      </div>
      <button class="explanation-secondary-button" type="button" @click="goToMailbox">
        メールボックスへ戻る
      </button>
    </section>

    <template v-else>
      <section class="explanation-summary-grid" aria-label="判断結果の概要">
        <article :class="['explanation-result-card', `explanation-result-card--${resultTone}`]">
          <span>{{ resultLabel }}</span>
          <strong>{{ resultStatus }}</strong>
          <p>{{ resultDescription }}</p>
        </article>

        <article class="explanation-mail-card">
          <div class="explanation-mail-card__header">
            <span class="explanation-mail-card__icon">
              <v-icon icon="mdi-email-open-outline" />
            </span>
            <div>
              <span>{{ mailTypeLabel }}</span>
              <strong>{{ mailCard.title }}</strong>
            </div>
          </div>

          <dl class="explanation-mail-meta">
            <div>
              <dt>差出人</dt>
              <dd>{{ mailCard.sender_name }}</dd>
            </div>
            <div>
              <dt>メールアドレス</dt>
              <dd>{{ mailCard.sender_email }}</dd>
            </div>
          </dl>

          <p class="explanation-mail-body">{{ mailBodyText }}</p>
        </article>
      </section>

      <section class="explanation-card-grid" aria-label="解説">
        <article
          v-for="card in explanationCards"
          :key="card.id"
          :class="['explanation-info-card', `explanation-info-card--${card.tone}`]"
        >
          <div class="explanation-info-card__heading">
            <v-icon :icon="card.icon" />
            <h2>{{ card.title }}</h2>
          </div>

          <p v-if="card.text">{{ card.text }}</p>
          <ul v-if="card.items.length > 0" class="explanation-check-list">
            <li v-for="item in card.items" :key="item">{{ item }}</li>
          </ul>
        </article>
      </section>

      <section class="explanation-panel explanation-learning-panel">
        <div>
          <span>学習ポイント</span>
          <h2>次に同じメールを見たときの判断基準を残しましょう。</h2>
          <p>
            急がせる表現、送信元の違和感、リンク先、添付ファイルの有無を順番に確認すると、
            実際のメールでも落ち着いて判断しやすくなります。
          </p>
        </div>
        <button class="explanation-primary-button" type="button" @click="goToMailbox">
          <v-icon icon="mdi-arrow-left" />
          <span>メールボックスへ戻る</span>
        </button>
      </section>
    </template>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  fetchQuestionExplanation,
  type QuestionExplanation,
} from '@/api/mailApi'

type ExplanationMail = {
  id: string
  title: string
  sender_name: string
  sender_email: string
  body: string
  is_phishing?: boolean
  question_explanations?: Partial<QuestionExplanation> | null
}

type ExplanationCard = {
  id: string
  title: string
  icon: string
  tone: 'warning' | 'info' | 'success'
  text: string
  items: string[]
}

const router = useRouter()

const mailCard = ref<ExplanationMail | null>(null)
const explanation = ref<Partial<QuestionExplanation> | null>(null)
const isLoading = ref(true)
const isCorrect = ref(false)
const showFadeOverlay = ref(false)
const startFadeOut = ref(false)

const isPhishing = computed(() => mailCard.value?.is_phishing !== false)
const resultTone = computed(() => (isCorrect.value ? 'success' : 'danger'))
const pageIcon = computed(() => (isCorrect.value ? 'mdi-check-circle-outline' : 'mdi-close-circle-outline'))

const resultLabel = computed(() => (isCorrect.value ? '正しい判断' : '確認が必要な判断'))

const pageTitle = computed(() => {
  if (isCorrect.value) {
    return '正しい対応ができました'
  }

  return isPhishing.value ? 'フィッシングメールに反応しました' : '安全なメールを報告しました'
})

const pageSubtitle = computed(() => {
  if (isCorrect.value) {
    return isPhishing.value
      ? '危険なメールを報告できています。判断の根拠を確認しましょう。'
      : '通常メールとして扱えています。安全と判断できる理由を確認しましょう。'
  }

  return isPhishing.value
    ? 'どの点が危険だったのかを確認して、次の判断に活かしましょう。'
    : '安全なメールを誤って報告したケースです。見分け方を確認しましょう。'
})

const resultStatus = computed(() => {
  if (isCorrect.value) return 'OK'
  return isPhishing.value ? '危険操作' : '誤報告'
})

const resultDescription = computed(() => {
  if (isCorrect.value) {
    return '今回の判断は適切でした。根拠を言語化して、次回も同じ手順で確認しましょう。'
  }

  return isPhishing.value
    ? '返信、リンク、添付ファイル操作は被害につながる可能性があります。'
    : '通常メールでも過剰に報告すると、必要な業務連絡を見落とす原因になります。'
})

const mailTypeLabel = computed(() => (isPhishing.value ? 'フィッシングメール' : '通常メール'))

const mailBodyText = computed(() => {
  const plain = stripHtml(mailCard.value?.body ?? '')
  if (!plain) return '本文がありません。'
  return plain.length > 260 ? `${plain.slice(0, 260)}...` : plain
})

const whyDangerous = computed(() => {
  const value = explanation.value?.why_dangerous?.trim()
  if (value) return value

  return isPhishing.value
    ? '送信元、本文の誘導、リンクや添付ファイルに不審な点がないか確認する必要があります。'
    : '送信元や本文の目的が自然で、危険な誘導がない場合は通常メールとして扱えます。'
})

const warningSignals = computed(() => {
  const values = normalizeList(explanation.value?.warning_signals)
  if (values.length > 0) return values

  return isPhishing.value
    ? ['送信元メールアドレスが不自然', '本文が急いで操作させようとしている', 'リンク先や添付ファイルの必要性が不明']
    : ['送信元と内容に一貫性がある', '過度に急がせる表現がない', 'リンクや添付ファイルの目的が説明されている']
})

const correctActions = computed(() => {
  const values = normalizeList(explanation.value?.correct_action)
  if (values.length > 0) return values

  return isPhishing.value
    ? ['リンクや添付ファイルを開かない', '返信しない', '報告して管理者または担当者に確認する']
    : ['内容を確認して必要な対応を進める', '違和感がある場合だけ追加確認する']
})

const explanationCards = computed<ExplanationCard[]>(() => [
  {
    id: 'why',
    title: isPhishing.value ? 'なぜ危険なのか' : '安全と判断できる理由',
    icon: 'mdi-alert-octagon-outline',
    tone: 'warning',
    text: whyDangerous.value,
    items: [],
  },
  {
    id: 'signals',
    title: isPhishing.value ? '確認すべきサイン' : '安全確認のポイント',
    icon: 'mdi-format-list-bulleted',
    tone: 'info',
    text: '',
    items: warningSignals.value,
  },
  {
    id: 'action',
    title: '正しい対応',
    icon: 'mdi-shield-outline',
    tone: 'success',
    text: '',
    items: correctActions.value,
  },
])

function getRouteState() {
  const state = window.history.state as Record<string, unknown> | null
  return (state?.usr ?? state ?? {}) as Record<string, unknown>
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function normalizeList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  }

  if (typeof value !== 'string' || value.trim().length === 0) {
    return []
  }

  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    }
  } catch {
    // Fall back to newline splitting below.
  }

  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function startFadeInIfNeeded(needFadeIn: boolean) {
  if (!needFadeIn) return

  showFadeOverlay.value = true
  window.setTimeout(() => {
    startFadeOut.value = true
    window.setTimeout(() => {
      showFadeOverlay.value = false
    }, 2500)
  }, 100)
}

async function initializeExplanation() {
  isLoading.value = true
  const state = getRouteState()
  const mail = state.mail as ExplanationMail | undefined

  startFadeInIfNeeded(Boolean(state.needFadeIn))
  isCorrect.value = Boolean(state.isCorrect)

  if (!mail) {
    mailCard.value = null
    explanation.value = null
    isLoading.value = false
    return
  }

  mailCard.value = mail
  explanation.value = mail.question_explanations ?? null

  if (!explanation.value && mail.id) {
    try {
      explanation.value = await fetchQuestionExplanation(mail.id)
    } catch (error) {
      console.error(error)
      explanation.value = null
    }
  }

  isLoading.value = false
}

function goToMailbox() {
  router.push({ name: 'MailboxList' })
}

onMounted(initializeExplanation)
</script>

<style src="../../../Main.css"></style>
<style lang="css" scoped>
.explanation-page {
  position: relative;
  box-sizing: border-box;
  min-height: 100vh;
  background: var(--page-bg);
}

.explanation-hero {
  width: min(100%, 1040px);
}

.explanation-result-icon {
  display: grid;
  width: 58px;
  height: 58px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  background: var(--surface-bg);
}

.explanation-result-icon :deep(.v-icon) {
  font-size: 36px;
}

.explanation-result-icon--success {
  color: #77d99a;
}

.explanation-result-icon--danger {
  color: #ff6b76;
}

.explanation-eyebrow {
  margin: 0 0 5px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0;
}

.explanation-panel--message {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 104px;
}

.explanation-panel--message h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  line-height: 1.3;
}

.explanation-panel--message p {
  margin-top: 5px;
  color: var(--muted);
  font-size: 14px;
}

.explanation-loading-icon {
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  border: 4px solid var(--toggle-bg);
  border-top-color: var(--accent-strong);
  border-radius: 50%;
  animation: explanation-loading 900ms linear infinite;
}

.explanation-message-icon {
  flex: 0 0 auto;
  color: var(--danger);
  font-size: 34px;
}

.explanation-summary-grid {
  display: grid;
  width: min(100%, 1040px);
  grid-template-columns: minmax(260px, 0.65fr) minmax(0, 1.35fr);
  gap: 18px;
  margin-bottom: 18px;
}

.explanation-result-card,
.explanation-mail-card,
.explanation-info-card {
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  background: var(--panel-bg);
  color: var(--page-text);
}

.explanation-result-card {
  display: grid;
  align-content: start;
  min-height: 220px;
  gap: 14px;
  padding: 24px;
}

.explanation-result-card span {
  color: var(--muted);
  font-size: 14px;
  font-weight: 900;
}

.explanation-result-card strong {
  font-size: 42px;
  font-weight: 900;
  line-height: 1;
}

.explanation-result-card p {
  color: var(--muted);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.55;
}

.explanation-result-card--success {
  border-color: color-mix(in srgb, var(--success) 70%, var(--panel-border));
  background: color-mix(in srgb, var(--success) 14%, var(--panel-bg));
}

.explanation-result-card--success strong {
  color: #77d99a;
}

.explanation-result-card--danger {
  border-color: color-mix(in srgb, var(--danger) 70%, var(--panel-border));
  background: color-mix(in srgb, var(--danger) 13%, var(--panel-bg));
}

.explanation-result-card--danger strong {
  color: #ff6b76;
}

.explanation-mail-card {
  display: grid;
  gap: 16px;
  padding: 22px;
}

.explanation-mail-card__header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 14px;
}

.explanation-mail-card__icon {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border-radius: 8px;
  background: #1c3574;
  color: #5da2ff;
}

.explanation-mail-card__icon :deep(.v-icon) {
  font-size: 26px;
}

.explanation-mail-card__header span,
.explanation-mail-meta dt {
  color: var(--muted);
  font-size: 13px;
  font-weight: 900;
}

.explanation-mail-card__header strong {
  display: block;
  margin-top: 4px;
  overflow-wrap: anywhere;
  color: var(--heading-text);
  font-size: 21px;
  font-weight: 900;
  line-height: 1.3;
}

.explanation-mail-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
}

.explanation-mail-meta div {
  min-width: 0;
  padding: 12px;
  border-radius: 8px;
  background: var(--surface-bg);
}

.explanation-mail-meta dd {
  margin: 5px 0 0;
  overflow-wrap: anywhere;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.35;
}

.explanation-mail-body {
  margin: 0;
  padding: 16px;
  border: 1px solid color-mix(in srgb, var(--panel-border) 72%, transparent);
  border-radius: 8px;
  background: var(--surface-bg);
  color: var(--page-text);
  font-size: 14px;
  line-height: 1.7;
}

.explanation-card-grid {
  display: grid;
  width: min(100%, 1040px);
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.explanation-info-card {
  display: grid;
  align-content: start;
  min-height: 220px;
  gap: 14px;
  padding: 20px;
}

.explanation-info-card--warning {
  border-color: rgba(255, 210, 74, 0.38);
}

.explanation-info-card--info {
  border-color: rgba(93, 162, 255, 0.38);
}

.explanation-info-card--success {
  border-color: rgba(119, 217, 154, 0.38);
}

.explanation-info-card__heading {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.explanation-info-card__heading :deep(.v-icon) {
  color: var(--accent);
  font-size: 22px;
}

.explanation-info-card h2 {
  margin: 0;
  color: var(--heading-text);
  font-size: 18px;
  font-weight: 900;
  line-height: 1.3;
}

.explanation-info-card p {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.65;
}

.explanation-check-list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.explanation-check-list li {
  position: relative;
  padding-left: 20px;
  color: var(--muted);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.55;
}

.explanation-check-list li::before {
  position: absolute;
  top: 0.62em;
  left: 0;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--accent-strong);
  content: "";
}

.explanation-learning-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.explanation-learning-panel span {
  color: var(--muted);
  font-size: 13px;
  font-weight: 900;
}

.explanation-learning-panel h2 {
  margin: 5px 0 8px;
  font-size: 20px;
  font-weight: 900;
  line-height: 1.35;
}

.explanation-learning-panel p {
  color: var(--muted);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.65;
}

.explanation-primary-button,
.explanation-secondary-button {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  white-space: nowrap;
}

.explanation-primary-button {
  flex: 0 0 auto;
  padding: 0 18px;
  border: 0;
  background: #2265f4;
  color: #ffffff;
}

.explanation-primary-button:hover,
.explanation-primary-button:focus-visible {
  background: #1f55ca;
  outline: none;
}

.explanation-secondary-button {
  margin-left: auto;
  padding: 0 18px;
  border: 1px solid var(--panel-border);
  background: transparent;
  color: var(--page-text);
}

.explanation-secondary-button:hover,
.explanation-secondary-button:focus-visible {
  background: var(--surface-bg);
  outline: none;
}

.explanation-fade-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background-color: #000000;
=======
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
>>>>>>> Ishikawa
  opacity: 1;
  pointer-events: none;
  transition: opacity 2.5s ease-in-out;
}
<<<<<<< HEAD

.explanation-fade-overlay.is-fading {
  opacity: 0;
}

@keyframes explanation-loading {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 900px) {
  .explanation-summary-grid,
  .explanation-card-grid {
    width: 100%;
  }

  .explanation-summary-grid,
  .explanation-card-grid {
    grid-template-columns: 1fr;
  }

  .explanation-result-card,
  .explanation-info-card {
    min-height: 0;
  }

  .explanation-learning-panel {
    align-items: stretch;
    flex-direction: column;
  }

  .explanation-primary-button {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .explanation-result-icon {
    width: 50px;
    height: 50px;
  }

  .explanation-result-card strong {
    font-size: 34px;
  }

  .explanation-mail-meta {
    grid-template-columns: 1fr;
  }

  .explanation-panel--message {
    align-items: flex-start;
    flex-direction: column;
  }

  .explanation-secondary-button {
    width: 100%;
    margin-left: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .explanation-loading-icon,
  .slow-pulse {
    animation: none;
  }

  .explanation-fade-overlay {
    transition: none;
  }
}
</style>
=======
.explanation-fade-overlay.is-fading {
  opacity: 0;
}
</style>
>>>>>>> Ishikawa
