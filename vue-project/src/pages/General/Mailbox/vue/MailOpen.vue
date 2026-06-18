<template>
  <main class="mail-open-page" :aria-busy="loading ? 'true' : 'false'">
    <header class="mail-open-hero">
      <button class="back-button" type="button" aria-label="受信トレイへ戻る" title="受信トレイへ戻る" @click="goBack">
        <v-icon icon="mdi-arrow-left" />
      </button>
      <div>
        <h1>メール確認</h1>
        <p>内容を確認して適切な操作を選択</p>
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
        <div class="action-bar">
          <button class="action-button action-button--primary" type="button" :disabled="isJudging" @click="judgeAction('reply')">
            <v-icon icon="mdi-reply" />
            <span>返信</span>
          </button>
          <button class="action-button action-button--secondary" type="button" :disabled="isJudging" @click="judgeAction('delete')">
            <v-icon icon="mdi-delete-outline" />
            <span>削除</span>
          </button>
          <button class="action-button action-button--warning" type="button" :disabled="isJudging" @click="judgeAction('report')">
            <v-icon icon="mdi-alert-octagon-outline" />
            <span>報告</span>
          </button>
        </div>

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

type ActionType = 'link' | 'attachment' | 'reply' | 'delete' | 'report'

const ROUTE_DEATH = '/feareffect_death'
const ROUTE_FALSE = '/feareffect_false'
const ROUTE_EXPLANATION = '/explanation'
const ROUTE_MAILBOX = '/mailbox'

const route = useRoute()
const router = useRouter()

const mail = ref<MailDetail | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const isJudging = ref(false)
const bodyEl = ref<HTMLElement | null>(null)

const sanitizedBody = computed(() =>
  DOMPurify.sanitize(mail.value?.body ?? ''),
)

const senderInitial = computed(() => {
  const initial = mail.value?.sender_name.trim().charAt(0) || mail.value?.sender_email.trim().charAt(0)
  return initial ? initial.toUpperCase() : '?'
})

const attachments = computed<string[]>(() => [
  ...(mail.value?.dangerous_attachments ?? []).map(a => a.filename),
  ...(mail.value?.safe_attachments ?? []).map(a => a.filename),
])

async function load() {
  const id = route.query.id
  if (typeof id !== 'string' || id.length === 0) {
    error.value = 'メールIDが指定されていません'
    loading.value = false
    return
  }

  loading.value = true
  error.value = null
  try {
    mail.value = await fetchMail(id)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'メールの取得に失敗しました'
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

function judgeAction(action: ActionType, value?: string) {
  if (isJudging.value || !mail.value) return
  const m = mail.value

  let nextRoute: string | null = null

  if (m.is_phishing) {
    switch (action) {
      case 'link':
        if (value && m.dangerous_links?.some((d) => d.url === value)) {
          nextRoute = ROUTE_DEATH
        }
        break
      case 'attachment':
        if (value && m.dangerous_attachments?.some((d) => d.filename === value)) {
          nextRoute = ROUTE_DEATH
        }
        break
      case 'reply':
        nextRoute = ROUTE_DEATH
        break
      case 'delete':
      case 'report':
        nextRoute = ROUTE_EXPLANATION
        break
    }
  } else if (action === 'report') {
    nextRoute = ROUTE_FALSE
  }

  if (nextRoute) {
    isJudging.value = true
    router.push({ path: nextRoute, query: { id: m.id } })
  }
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

<style src="../../Main.css"></style>
<style lang="css" scoped src="../css/MailOpen.css"></style>
