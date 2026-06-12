<template>
  <MailDetailViewer
    :mail="mail"
    :loading="loading"
    :error="error"
    :busy="isJudging"
    show-actions
    back-label="受信トレイへ戻る"
    @back="goBack"
    @retry="load"
    @action="judgeAction"
  />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchMail, type MailDetail } from '@/api/mailApi'
import MailDetailViewer, { type MailViewerAction } from '@/components/mail/MailDetailViewer.vue'

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

/**
 * 判定アクションの処理
 * @param isCorrect 判定が正解かどうか（フィッシング報告なら正解、無視なら不正解など）
 * @param nextPath 移動先のパス
 */
function navigateToEffect(nextPath: string, isCorrect: boolean) {
  isJudging.value = true
  router.push({
    path: nextPath,
    state: {
      mail: mail.value, // 取得済みの詳細データを state にセット
      isCorrect: isCorrect
    }
  })
}

function judgeAction(action: MailViewerAction, value?: string) {
  if (isJudging.value || !mail.value) return
  const m = mail.value

  if (m.is_phishing) {
    switch (action) {
      case 'link':
        if (value && m.dangerous_links?.some((d) => d.url === value)) {
          navigateToEffect(ROUTE_DEATH, false)
        }
        break
      case 'attachment':
        if (value && m.dangerous_attachments?.some((d) => d.filename === value)) {
          navigateToEffect(ROUTE_DEATH, false)
        }
        break
      case 'reply':
        navigateToEffect(ROUTE_DEATH, false)
        break
      case 'delete':
      case 'report':
        navigateToEffect(ROUTE_EXPLANATION, true)
        break
    }
  } else if (action === 'report') {
    // 安全なメールを報告するのは「不正解」判定とみなす場合
    navigateToEffect(ROUTE_FALSE, false)
  }
}

onMounted(() => {
  void load()
})
</script>