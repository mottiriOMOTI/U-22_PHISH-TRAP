<template>
  <!-- 動的なクラスと動的なアイコン名が連動するようにバインド -->
  <div class="d-flex justify-center mt-6 mb-2">
    <v-icon
      :icon="pageIcon"
      size="160"
      :class="pageIconClass"
    ></v-icon>
  </div>

  <h1 class="d-flex justify-center">{{ pageTitle }}</h1>
  <h3 class="d-flex justify-center">{{ pageSubtitle }}</h3>

  <!-- ローディング表示（通信が終わるまで表示されます） -->
  <v-row v-if="isLoading" class="margin-3 justify-center">
    <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
  </v-row>

  <!-- カードのループ処理（history.stateからの動的データに対応） -->
  <v-row v-else class="margin-3">
    <v-col v-for="item in cards" :key="item.id" cols="12">
      
      <!-- 🚨 type: danger -->
      <BaseCard
        v-if="item.type === 'danger'"
        :type="item.type"
        :title="item.title || (isPhishing ? 'フィッシングメール本文' : '通常メール本文')" 
        :subTitle="item.sender_name ? `${item.sender_name} <${item.sender_email}>` : item.sender_email" 
        :text="item.body" 
        :color="item.color"
        :variant="item.variant"
      />
      
      <!-- ⚠ type: DangerExplanation -->
      <BaseCard
        v-else-if="item.type === 'DangerExplanation'"
        :type="item.type"
        :title="isPhishing ? 'なぜ危険なのか（解説）' : '安全と判断できる理由'"
        :text="item.why_dangerous"
        :color="item.color"
        :variant="item.variant"
      />

      <!-- 💡 type: advice -->
      <BaseCard
        v-else-if="item.type === 'advice'"
        :type="item.type"
        :title="isPhishing ? '安全に見破るチェックリスト' : '注目すべき箇所のリスト'"
        :textList="item.warning_signals"
        :color="item.color"
        :variant="item.variant"
      />

      <!-- ⚠ type: correctiveAction -->
      <BaseCard
        v-else-if="item.type === 'correctiveAction'"
        :type="item.type"
        :title="isPhishing ? '正しい対処法' : '類似した詐欺'"
        :textList="item.correct_action"
        :color="item.color"
        :variant="item.variant"
      />

    </v-col>
  </v-row>

  <!-- 固定カードを配置 -->
  <v-row class="mt-2">
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
        <v-card-text class="px-0 pb-0 text-body-1">
          今回体験した「恐怖」を忘れないでください。実際のフィッシング詐欺では、 本物のランサムウェア感染や個人情報の漏洩が発生します。 このトレーニングで学んだ警告サインを実生活でも必ず確認しましょう。
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <!-- 📥 メールボックスに戻る（本番用のナビゲーションボタン） -->
  <v-row class="mt-6 px-1 justify-center">
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

/**
 * 💡 現在読み込まれているカードデータから、is_phishing の真偽値を安全に判定する算出プロパティ
 */
const isPhishing = computed(() => {
  const dangerCard = cards.value.find(item => item.type === 'danger')
  return dangerCard?.is_phishing !== false
})

/**
 * 遷移元から history.state 経由で渡されたメールデータを使用して解説を構築
 */
const initializeExplanation = () => {
  isLoading.value = true
  const state = window.history.state
  const mail = state?.mail // 演出元から渡されたメールオブジェクト
  const isCorrect = !!state?.isCorrect

  if (mail) {
    const explanations = mail.question_explanations || {}
    
    cards.value = [
      { id: mail.id, type: 'danger', ...mail, color: 'error', variant: 'tonal' },
      { id: 'exp', type: 'DangerExplanation', why_dangerous: explanations.why_dangerous, color: 'warning', variant: 'tonal' },
      { id: 'adv', type: 'advice', warning_signals: explanations.warning_signals || [], color: 'info', variant: 'tonal' },
      { id: 'act', type: 'correctiveAction', correct_action: explanations.correct_action || [], color: 'success', variant: 'tonal' }
    ]
    applyJudgementMode(isCorrect)
  } else {
    console.error('データが渡されていません')
  }
  isLoading.value = false
}

const applyJudgementMode = (isCorrect: boolean) => {
  if (isCorrect) {
    pageTitle.value = '正解'
    pageIcon.value = 'mdi-check-circle-outline'
    pageIconClass.value = 'super-vivid-green'
    pageSubtitle.value = isPhishing.value ? '適切な判断ができました' : '仕事をやり遂げました！'
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
.margin-3 { margin-top: 2em; }
.super-vivid-red { color: #FF0000 !important; }
.super-vivid-green { color: #00FF00 !important; }
.slow-pulse { animation: pulse-animation 1.5s ease-in-out infinite alternate; }
@keyframes pulse-animation { 0% { opacity: 1; } 100% { opacity: 0.15; } }
</style>