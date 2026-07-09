<template>
  <main class="mail-open-page" :aria-busy="loading ? 'true' : 'false'" aria-labelledby="mail-open-title">
    <header class="mail-open-hero">
      <button class="back-button" type="button" aria-label="受信トレイへ戻る" title="受信トレイへ戻る" @click="goBack">
        <v-icon icon="mdi-arrow-left" />
      </button>
      <div>
        <h1 id="mail-open-title">メール確認</h1>
        <p>内容を確認して、適切な操作を選択してください。</p>
      </div>
    </header>

    <section v-if="loading" class="mail-open-panel mail-open-panel--loading" aria-label="メール読み込み中">
      <span class="loading-icon" />
      <div>
        <strong>メールを読み込んでいます</strong>
        <p>本文と添付情報を確認しています。</p>
      </div>
    </section>

    <section v-else-if="error" class="mail-open-panel mail-open-panel--message" role="alert">
      <v-icon icon="mdi-alert-circle-outline" class="mail-open-message-icon" />
      <div>
        <h2>メールを読み込めませんでした</h2>
        <p>{{ error }}</p>
      </div>
      <button class="secondary-button" type="button" @click="load">再試行</button>
    </section>

    <template v-else-if="mail">
      <section class="mail-open-panel">
        <div class="action-bar" aria-label="メール操作">
          <button class="action-button action-button--primary" type="button" :disabled="isJudging" @click="judgeAction('reply')">
            <v-icon icon="mdi-reply" />
            <span>返信</span>
          </button>
          <button class="action-button action-button--secondary" type="button" :disabled="isJudging" @click="showDeleteWarning">
            <v-icon icon="mdi-delete-outline" />
            <span>削除</span>
          </button>
          <button class="action-button action-button--warning" type="button" :disabled="isJudging" @click="judgeAction('report')">
            <v-icon icon="mdi-alert-octagon-outline" />
            <span>報告</span>
          </button>
        </div>
        <p v-if="scoringError" class="scoring-error" role="alert">
          <v-icon icon="mdi-alert-circle-outline" />
          <span>{{ scoringError }}</span>
        </p>

        <header class="mail-detail-header">
          <div class="mail-title-row">
            <span class="mail-title-row__icon">
              <v-icon icon="mdi-email-open-outline" />
            </span>
            <div>
              <h2>{{ mail.title }}</h2>
              <p>{{ formatDate(mail.created_at) }}</p>
            </div>
          </div>

          <div class="sender-card">
            <div class="sender-avatar">{{ senderInitial }}</div>
            <div class="sender-summary">
              <strong>{{ mail.sender_name }}</strong>
              <span>&lt;{{ mail.sender_email }}&gt;</span>
            </div>
          </div>
        </header>

        <article
          ref="bodyEl"
          class="mail-body"
          v-html="sanitizedBody"
        />

        <section v-if="mail.has_attachment && attachments.length > 0" class="attachment-panel">
          <h3>添付ファイル</h3>
          <div class="attachment-list">
            <button
              v-for="(name, i) in attachments"
              :key="i"
              class="attachment-button"
              type="button"
              :disabled="isJudging"
              @click="judgeAction('attachment', name)"
            >
              <v-icon icon="mdi-paperclip" />
              <span>{{ name }}</span>
            </button>
          </div>
        </section>
      </section>
    </template>
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DOMPurify from 'dompurify'
import { fetchMail, type MailDetail } from '@/api/mailApi'
import { recordAnswer, type AnswerAction } from '@/api/scoreApi'
import { getCurrentUser } from '@/api/users'

type ActionType = AnswerAction | 'delete'
type JudgementState = {
  mail: MailDetail
  judgedAction: {
    action: ActionType
    value?: string
  }
  triggerDeath?: boolean
  triggerSuccess?: boolean
  triggerSocialDeath?: boolean
}

const ROUTE_MAILBOX = '/mailbox'

const route = useRoute()
const router = useRouter()

const mail = ref<MailDetail | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const isDeathFlag = ref(false)
const isSocialDeathFlag = ref(false)
const isJudging = ref(false)
const scoringError = ref<string | null>(null)
const bodyEl = ref<HTMLElement | null>(null)

const sanitizedBody = computed(() => DOMPurify.sanitize(mail.value?.body ?? ''))

const senderInitial = computed(() => {
  const initial = mail.value?.sender_name.trim().charAt(0) || mail.value?.sender_email.trim().charAt(0)
  return initial ? initial.toUpperCase() : '?'
})

const attachments = computed<string[]>(() => [
  ...(mail.value?.dangerous_attachments ?? []).map((attachment) => attachment.filename),
  ...(mail.value?.safe_attachments ?? []).map((attachment) => attachment.filename),
])

async function load() {
  const id = route.query.id
  if (typeof id !== 'string' || id.length === 0) {
    error.value = 'メールIDが指定されていません。'
    loading.value = false
    return
  }

  loading.value = true
  error.value = null
  try {
    mail.value = await fetchMail(id)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'メールの取得に失敗しました。'
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push(ROUTE_MAILBOX)
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

function showDeleteWarning() {
  alert('このトレーニングではメールを削除できません。返信・報告などの判断を選んでください。')
}

async function judgeAction(action: AnswerAction, value?: string) {
  if (isJudging.value || !mail.value) return

  const mailToPass = JSON.parse(JSON.stringify(mail.value)) as MailDetail
  const stateToPass: JudgementState = {
    mail: mailToPass,
    judgedAction: { action, value },
  }

  isJudging.value = true
  scoringError.value = null

  const currentUser = getCurrentUser()
  if (!currentUser) {
    scoringError.value = 'ログイン情報を確認できませんでした。再度ログインしてください。'
    isJudging.value = false
    return
  }

  try {
    await recordAnswer(currentUser.id, mailToPass.id, action)
  } catch (e) {
    console.error(e)
    scoringError.value =
      e instanceof Error ? `回答結果を保存できませんでした: ${e.message}` : '回答結果を保存できませんでした。'
    isJudging.value = false
    return
  }

  if (mailToPass.is_phishing) {
    switch (action) {
      case 'link':
      case 'attachment':
      case 'reply':
        isDeathFlag.value = true
        stateToPass.triggerDeath = true
        break
      case 'report':
        stateToPass.triggerSuccess = true
        break
    }
  } else if (action === 'report') {
    isSocialDeathFlag.value = true
    stateToPass.triggerSocialDeath = true
  } else {
    stateToPass.triggerSuccess = true
  }

  router.push({
    path: ROUTE_MAILBOX,
    state: stateToPass,
  })
}

function handleBodyLinkClick(e: MouseEvent) {
  const target = (e.target as HTMLElement | null)?.closest('a') as HTMLAnchorElement | null
  if (!target) return
  e.preventDefault()
  judgeAction('link', target.href)
}

function attachLinkHandler() {
  void nextTick(() => {
    bodyEl.value?.addEventListener('click', handleBodyLinkClick)
  })
}

function detachLinkHandler() {
  bodyEl.value?.removeEventListener('click', handleBodyLinkClick)
}

watch(sanitizedBody, () => {
  detachLinkHandler()
  attachLinkHandler()
})

onMounted(async () => {
  await load()
  attachLinkHandler()
})

onBeforeUnmount(() => {
  detachLinkHandler()
})
</script>
<style lang="css" scoped>
.mail-open-page {
  position: relative;
  box-sizing: border-box;
  min-height: 100vh;
  overflow-x: hidden;
  padding: 18px 22px 14px;
  background: var(--page-bg);
  color: var(--page-text);
}

.mail-open-hero {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.back-button {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid var(--surface-border);
  border-radius: 50%;
  background: var(--surface-bg);
  color: var(--page-text);
  cursor: pointer;
  transition:
    background-color 160ms ease,
    border-color 160ms ease;
}

.back-button:hover,
.back-button:focus-visible {
  border-color: var(--accent-strong);
  background: var(--sidebar-active-bg);
  outline: none;
}

.back-button :deep(.v-icon) {
  font-size: 22px;
}

.mail-open-hero h1 {
  margin: 0;
  font-size: 30px;
  font-weight: 800;
  line-height: 1.1;
}

.mail-open-hero p,
.mail-title-row p,
.sender-summary span,
.mail-open-panel--loading p,
.mail-open-panel--message p {
  margin: 0;
  color: var(--muted);
}

.mail-open-hero p {
  margin-top: 6px;
  font-size: 16px;
}

.mail-open-panel {
  width: min(100%, 1040px);
  padding: 18px 22px 20px;
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  background: var(--panel-bg);
  color: var(--page-text);
}

.mail-open-panel--loading,
.mail-open-panel--message {
  display: flex;
  align-items: center;
  gap: 16px;
}

.mail-open-panel--loading strong {
  font-size: 16px;
  font-weight: 800;
}

.mail-open-panel--loading p,
.mail-open-panel--message p {
  margin-top: 4px;
  font-size: 14px;
}

.loading-icon {
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  border: 4px solid var(--toggle-bg);
  border-top-color: var(--accent-strong);
  border-radius: 50%;
  animation: mail-open-loading 900ms linear infinite;
}

.mail-open-message-icon {
  flex: 0 0 auto;
  color: var(--danger);
  font-size: 34px;
}

.mail-open-panel--message h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  line-height: 1.3;
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
  transition:
    background-color 160ms ease,
    border-color 160ms ease;
}

.secondary-button:hover,
.secondary-button:focus-visible {
  background: var(--surface-bg);
  outline: none;
}

.action-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}

.action-button {
  display: inline-flex;
  min-height: 40px;
  min-width: 104px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 16px;
  border: 1px solid transparent;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    color 160ms ease,
    opacity 160ms ease;
}

.action-button :deep(.v-icon) {
  font-size: 19px;
}

.action-button--primary {
  border-color: var(--sidebar-active-bg);
  background: var(--sidebar-active-bg);
  color: var(--sidebar-active-text);
}

.action-button--primary:hover:not(:disabled) {
  background: color-mix(in srgb, var(--sidebar-active-bg) 86%, var(--surface-bg));
}

.action-button--secondary {
  border: 1px solid var(--surface-border);
  background: transparent;
  color: var(--page-text);
}

.action-button--secondary:hover:not(:disabled) {
  background: var(--surface-bg);
}

.action-button--warning {
  margin-left: auto;
  border-color: color-mix(in srgb, var(--danger) 70%, transparent);
  background: color-mix(in srgb, var(--danger) 14%, var(--panel-bg));
  color: var(--danger);
}

.action-button--warning:hover:not(:disabled) {
  border-color: var(--danger);
  background: color-mix(in srgb, var(--danger) 24%, var(--panel-bg));
}

.action-button:focus-visible,
.attachment-button:focus-visible,
.secondary-button:focus-visible {
  outline: 2px solid var(--accent-strong);
  outline-offset: 2px;
}

.action-button:disabled,
.attachment-button:disabled {
  cursor: wait;
  opacity: 0.62;
}

.mail-detail-header {
  display: grid;
  gap: 14px;
  margin-bottom: 18px;
}

.mail-title-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.mail-title-row__icon {
  display: grid;
  width: 48px;
  height: 48px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 8px;
  background: color-mix(in srgb, var(--accent-strong) 24%, var(--surface-bg));
  color: var(--accent-strong);
}

.mail-title-row__icon :deep(.v-icon) {
  font-size: 26px;
}

.mail-title-row h2 {
  margin: 0;
  overflow-wrap: anywhere;
  font-size: 22px;
  font-weight: 800;
  line-height: 1.3;
}

.mail-title-row p {
  margin-top: 4px;
  font-size: 13px;
}

.sender-card {
  display: flex;
  min-height: 70px;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border-radius: 8px;
  background: var(--surface-bg);
}

.sender-avatar {
  display: grid;
  width: 46px;
  height: 46px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  background: color-mix(in srgb, var(--success) 86%, var(--surface-bg));
  color: #ffffff;
  font-size: 20px;
  font-weight: 900;
}

.sender-summary {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.sender-summary strong,
.sender-summary span {
  overflow-wrap: anywhere;
}

.sender-summary strong {
  font-size: 16px;
  font-weight: 800;
  line-height: 1.3;
}

.sender-summary span {
  font-size: 13px;
  line-height: 1.35;
}

.mail-body {
  min-height: 220px;
  padding: 22px;
  border: 1px solid color-mix(in srgb, var(--panel-border) 72%, transparent);
  border-radius: 8px;
  background: var(--surface-bg);
  color: var(--page-text);
  line-height: 1.7;
  overflow-wrap: anywhere;
  word-break: normal;
}

.mail-body :deep(img) {
  max-width: 100%;
  height: auto;
}

.mail-body :deep(a) {
  color: var(--accent-strong);
  text-decoration: underline;
  overflow-wrap: anywhere;
  cursor: pointer;
}

.mail-body :deep(pre) {
  white-space: pre-wrap;
}

.attachment-panel {
  margin-top: 18px;
}

.attachment-panel h3 {
  margin: 0 0 10px;
  font-size: 18px;
  font-weight: 800;
  line-height: 1.3;
}

.attachment-list {
  display: grid;
  gap: 10px;
}

.attachment-button {
  display: flex;
  min-height: 44px;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
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

.attachment-button:hover:not(:disabled) {
  border-color: var(--accent-strong);
  background: color-mix(in srgb, var(--surface-bg) 78%, var(--accent-strong));
  outline: none;
}

.attachment-button:focus-visible:not(:disabled) {
  border-color: var(--accent-strong);
  background: color-mix(in srgb, var(--surface-bg) 78%, var(--accent-strong));
}

.attachment-button :deep(.v-icon) {
  flex: 0 0 auto;
  color: var(--accent-strong);
  font-size: 20px;
}

.attachment-button span {
  overflow-wrap: anywhere;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.3;
}

@keyframes mail-open-loading {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 900px) {
  .mail-open-page {
    padding: 18px 14px 16px;
  }

  .mail-open-panel {
    padding: 16px;
  }
}

@media (max-width: 640px) {
  .mail-open-hero {
    align-items: flex-start;
  }

  .mail-open-hero h1 {
    font-size: 28px;
  }

  .action-bar {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .action-button--warning {
    grid-column: 1 / -1;
    margin-left: 0;
  }

  .action-button {
    width: 100%;
    min-width: 0;
  }

  .mail-title-row {
    align-items: flex-start;
  }

  .mail-open-panel--message {
    align-items: flex-start;
    flex-direction: column;
  }

  .secondary-button {
    width: 100%;
    margin-left: 0;
  }

  .mail-body {
    padding: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .loading-icon {
    animation: none;
  }
}
</style>
