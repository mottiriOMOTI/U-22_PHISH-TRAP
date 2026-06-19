<template>
  <v-container class="mail-open pa-4" max-width="900">
    <div class="d-flex align-center mb-4">
      <v-btn
        variant="text"
        prepend-icon="mdi-arrow-left"
        @click="$emit('back')"
      >
        {{ backLabel }}
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
      <template v-if="retryable" #append>
        <v-btn size="small" variant="text" @click="$emit('retry')">再試行</v-btn>
      </template>
    </v-alert>

    <template v-else-if="mail">
      <div v-if="showActions" class="action-bar mb-4 d-flex ga-2">
        <v-btn
          color="primary"
          prepend-icon="mdi-reply"
          :disabled="busy"
          @click="$emit('action', 'reply')"
        >
          返信
        </v-btn>
        <v-btn
          color="grey-darken-1"
          prepend-icon="mdi-delete-outline"
          :disabled="busy"
          @click="$emit('action', 'delete')"
        >
          削除
        </v-btn>
        <v-spacer />
        <v-btn
          color="warning"
          prepend-icon="mdi-alert-octagon-outline"
          :disabled="busy"
          @click="$emit('action', 'report')"
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

      <v-img
        v-if="imageSrc"
        class="mail-image mb-4"
        :src="imageSrc"
        :alt="`${mail.title} の画像`"
        cover
      />

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
            :disabled="busy"
            @click="$emit('action', 'attachment', name)"
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
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import DOMPurify from 'dompurify'

export type MailViewerAction = 'link' | 'attachment' | 'reply' | 'delete' | 'report'

export type MailViewerAttachment = {
  filename: string
}

export type MailViewerDangerousLink = {
  url: string
}

export type MailViewerItem = {
  id: string
  title: string
  sender_name: string
  sender_email: string
  body: string
  created_at: string
  has_attachment: boolean
  dangerous_links?: MailViewerDangerousLink[] | null
  dangerous_attachments?: MailViewerAttachment[] | null
  safe_attachments?: MailViewerAttachment[] | null
  question_image_url?: string | null
  question_image_data_url?: string | null
}

const props = withDefaults(defineProps<{
  mail: MailViewerItem | null
  loading?: boolean
  error?: string | null
  busy?: boolean
  retryable?: boolean
  showActions?: boolean
  backLabel?: string
}>(), {
  loading: false,
  error: null,
  busy: false,
  retryable: true,
  showActions: true,
  backLabel: '受信トレイへ戻る',
})

const emit = defineEmits<{
  back: []
  retry: []
  action: [action: MailViewerAction, value?: string]
}>()

const bodyEl = ref<HTMLElement | null>(null)

const sanitizedBody = computed(() =>
  DOMPurify.sanitize(props.mail?.body ?? ''),
)

const imageSrc = computed(() =>
  props.mail?.question_image_data_url ?? props.mail?.question_image_url ?? null,
)

const attachments = computed<string[]>(() => [
  ...(props.mail?.dangerous_attachments ?? []).map((a) => a.filename),
  ...(props.mail?.safe_attachments ?? []).map((a) => a.filename),
])

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

function handleBodyLinkClick(e: MouseEvent) {
  const target = (e.target as HTMLElement | null)?.closest('a') as HTMLAnchorElement | null
  if (!target) return
  e.preventDefault()
  emit('action', 'link', target.href)
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
}, { immediate: true })

onBeforeUnmount(() => {
  detachLinkHandler()
})
</script>

<style scoped>
.mail-image {
  width: 100%;
  max-height: 420px;
  border-radius: 10px;
}

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
