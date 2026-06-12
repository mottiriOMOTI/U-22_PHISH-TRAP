<template>
  <MailDetailViewer
    :mail="mail"
    :loading="loading"
    :error="error"
    :retryable="source === 'db'"
    :show-actions="false"
    back-label="管理画面へ戻る"
    @back="goBack"
    @retry="load"
  />
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
