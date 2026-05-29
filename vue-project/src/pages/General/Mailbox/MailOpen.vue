<template>
  <v-container class="mail-open pa-4" max-width="900">
    <div class="d-flex align-center mb-4">
      <v-btn
        variant="text"
        prepend-icon="mdi-arrow-left"
        @click="goBack"
      >
        受信トレイへ戻る
      </v-btn>
    </div>

    <div v-if="loading">
      <v-skeleton-loader type="article" />
    </div>

    <v-alert
      v-else-if="error"
      type="error"
      variant="tonal"
    >
      {{ error }}
      <template #append>
        <v-btn size="small" variant="text" @click="load">再試行</v-btn>
      </template>
    </v-alert>

    <template v-else-if="mail">
      <div class="action-bar mb-4 d-flex ga-2">
        <v-btn
          color="primary"
          prepend-icon="mdi-reply"
          :disabled="isJudging"
          @click="judgeAction('reply')"
        >
          返信
        </v-btn>
        <v-btn
          color="grey-darken-1"
          prepend-icon="mdi-delete-outline"
          :disabled="isJudging"
          @click="judgeAction('delete')"
        >
          削除
        </v-btn>
        <v-spacer />
        <v-btn
          color="warning"
          prepend-icon="mdi-alert-octagon-outline"
          :disabled="isJudging"
          @click="judgeAction('report')"
        >
          報告
        </v-btn>
      </div>

      <header class="mail-header mb-4">
        <h1 class="text-h5 mb-3">{{ mail.title }}</h1>

        <div class="d-flex align-center mb-1">
          <v-icon icon="mdi-account-circle" size="32" class="mr-2" />
          <div>
            <div class="font-weight-medium">{{ mail.sender_name }}</div>
            <div class="text-caption text-grey">
              &lt;{{ mail.sender_email }}&gt;
            </div>
          </div>
          <v-spacer />
          <span class="text-caption text-grey">
            {{ formatDate(mail.created_at) }}
          </span>
        </div>
      </header>

      <v-divider class="mb-4" />

      <article
        ref="bodyEl"
        class="mail-body"
        v-html="sanitizedBody"
      />

      <section v-if="mail.has_attachment && attachments.length > 0" class="mt-6">
        <h3 class="text-subtitle-1 mb-2">添付ファイル</h3>
        <v-list density="compact" class="rounded-lg">
          <v-list-item
            v-for="(name, i) in attachments"
            :key="i"
            :title="name"
            :disabled="isJudging"
            @click="judgeAction('attachment', name)"
          >
            <template #prepend>
              <v-icon icon="mdi-paperclip" />
            </template>
          </v-list-item>
        </v-list>
      </section>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
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
        if (value && m.dangerous_links?.some(d => d.url === value)) {
          nextRoute = ROUTE_DEATH
        }
        break
      case 'attachment':
        if (value && m.dangerous_attachments?.some(d => d.filename === value)) {
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
  } else {
    if (action === 'report') {
      nextRoute = ROUTE_FALSE
    }
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
</script>

<style scoped>
.mail-body {
  line-height: 1.7;
  word-break: break-word;
}
.mail-body :deep(img) {
  max-width: 100%;
  height: auto;
}
.mail-body :deep(a) {
  color: #1976d2;
  text-decoration: underline;
  cursor: pointer;
}
</style>
