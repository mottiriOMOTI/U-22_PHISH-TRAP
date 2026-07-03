<template>
  <main class="question-detail-page" :aria-busy="loading ? 'true' : 'false'">
    <header class="question-detail-hero">
      <div class="question-detail-hero__title">
        <v-icon icon="mdi-email-search-outline" class="question-detail-hero__icon" />
        <div>
          <h1>問題詳細</h1>
          <p>訓練メールの内容確認</p>
        </div>
      </div>

      <button class="back-button" type="button" @click="goBack">
        <v-icon icon="mdi-arrow-left" />
        <span>問題一覧へ戻る</span>
      </button>
    </header>

    <section class="question-detail-panel">
      <MailDetailViewer
        :mail="mail"
        :loading="loading"
        :error="error"
        :retryable="source === 'db'"
        :show-actions="false"
        back-label="問題一覧へ戻る"
        @back="goBack"
        @retry="load"
      />
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchMail } from '@/api/mailApi'
import MailDetailViewer, { type MailViewerItem } from '@/components/mail/MailDetailViewer.vue'
import { useAdminGeneratedQuestions } from '@/stores/admin_generatedQuestions'

type DetailSource = 'db' | 'generated'

const route = useRoute()
const router = useRouter()
const generatedStore = useAdminGeneratedQuestions()

const mail = ref<MailViewerItem | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const source = ref<DetailSource | null>(null)

async function load() {
  const rawSource = route.query.source
  const id = route.query.id

  mail.value = null
  error.value = null

  if ((rawSource !== 'db' && rawSource !== 'generated') || typeof id !== 'string' || id.length === 0) {
    source.value = null
    error.value = '表示する問題が指定されていません。'
    return
  }

  source.value = rawSource

  if (rawSource === 'generated') {
    const generated = generatedStore.getQuestion(id)
    if (!generated) {
      error.value = '生成済みの問題が見つかりません。ページを再読み込みした場合は、もう一度生成してください。'
      return
    }

    mail.value = generated
    return
  }

  loading.value = true
  try {
    mail.value = await fetchMail(id)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '問題の取得に失敗しました。'
  } finally {
    loading.value = false
  }
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
    return
  }

  router.push('/admin_questionlist')
}

watch(
  () => [route.query.source, route.query.id],
  () => {
    void load()
  },
)

onMounted(() => {
  void load()
})
</script>

<style scoped>
.question-detail-page {
  min-height: 100vh;
  padding: 39px 26px 40px 30px;
  background: var(--page-bg);
  color: var(--page-text);
}

.question-detail-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 34px;
}

.question-detail-hero__title {
  display: flex;
  align-items: flex-start;
  gap: 17px;
}

.question-detail-hero__icon {
  color: var(--accent);
  font-size: 48px;
  margin-top: -2px;
}

.question-detail-hero h1 {
  margin: 0;
  color: var(--heading-text);
  font-size: 40px;
  font-weight: 900;
  letter-spacing: 0;
  line-height: 1;
}

.question-detail-hero p {
  margin: 9px 0 0;
  color: var(--muted);
  font-size: 18px;
  font-weight: 500;
}

.back-button {
  display: inline-flex;
  height: 46px;
  align-items: center;
  justify-content: center;
  gap: 9px;
  margin-top: 16px;
  padding: 0 16px;
  border: 1px solid var(--surface-border);
  border-radius: 9px;
  background: var(--surface-bg);
  color: var(--page-text);
  cursor: pointer;
  font: inherit;
  font-size: 16px;
  font-weight: 900;
  line-height: 1;
  white-space: nowrap;
  transition:
    border-color 160ms ease,
    transform 160ms ease;
}

.back-button:hover,
.back-button:focus-visible {
  border-color: var(--accent);
  outline: none;
  transform: translateY(-1px);
}

.back-button :deep(.v-icon) {
  font-size: 20px;
}

.question-detail-panel {
  width: 100%;
  max-width: 1038px;
  min-height: 522px;
  padding: 29px 30px 30px;
  border: 1px solid var(--panel-border);
  border-radius: 17px;
  background: var(--panel-bg);
}

.question-detail-panel :deep(.mail-open) {
  width: 100%;
  max-width: none;
  padding: 0 !important;
  color: var(--page-text);
}

.question-detail-panel :deep(.mail-open > .d-flex:first-child) {
  display: none !important;
}

.question-detail-panel :deep(.mail-header) {
  margin-bottom: 0 !important;
  padding: 22px 20px;
  border: 1px solid var(--surface-border);
  border-radius: 13px 13px 0 0;
  background: var(--surface-bg);
}

.question-detail-panel :deep(.mail-header h1) {
  color: var(--heading-text);
  font-size: 25px !important;
  font-weight: 900;
  letter-spacing: 0;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.question-detail-panel :deep(.mail-header .text-caption),
.question-detail-panel :deep(.mail-header .text-grey) {
  color: var(--muted) !important;
}

.question-detail-panel :deep(.v-divider) {
  display: none;
}

.question-detail-panel :deep(.mail-image) {
  max-height: 420px;
  margin: 0 !important;
  border: 1px solid var(--surface-border);
  border-top: 0;
  border-radius: 0;
}

.question-detail-panel :deep(.mail-body) {
  min-height: 320px;
  padding: 24px 20px;
  border: 1px solid var(--surface-border);
  border-top: 0;
  border-radius: 0 0 13px 13px;
  background: var(--surface-bg);
  color: var(--page-text);
  font-size: 16px;
  line-height: 1.8;
}

.question-detail-panel :deep(.mail-body a) {
  color: var(--accent-strong);
}

.question-detail-panel :deep(section.mt-6) {
  margin-top: 18px !important;
  padding: 18px 20px;
  border: 1px solid var(--surface-border);
  border-radius: 13px;
  background: var(--surface-bg);
}

.question-detail-panel :deep(.v-alert),
.question-detail-panel :deep(.v-skeleton-loader) {
  border-radius: 13px;
}

@media (max-width: 900px) {
  .question-detail-page {
    padding: 28px 18px 36px;
  }

  .question-detail-hero {
    align-items: stretch;
    flex-direction: column;
  }

  .question-detail-hero h1 {
    font-size: 34px;
  }

  .back-button {
    width: 100%;
    margin-top: 0;
  }

  .question-detail-panel {
    min-height: 420px;
    padding: 24px 20px;
  }
}
</style>
