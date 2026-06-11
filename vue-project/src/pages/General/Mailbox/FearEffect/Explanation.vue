<template>
  <div class="d-flex justify-center mt-6 mb-2">
    <v-icon
      :icon="pageIcon"
      size="160"
      :class="pageIconClass"
    ></v-icon>
  </div>

  <h1 class="d-flex justify-center">Welcome! {{ userName }}</h1>
  <h1 class="d-flex justify-center">{{ pageTitle }}</h1>
  <h3 class="d-flex justify-center">{{ pageSubtitle }}</h3>

  <v-row v-if="isLoading" class="margin-3 justify-center">
    <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
  </v-row>

  <v-row v-else class="margin-3">
    <v-col v-for="item in cards" :key="item.id" cols="12">
      
      <BaseCard
        v-if="item.type === 'danger'"
        :type="item.type"
        :title="item.title || 'フィッシングメール本文'" 
        :subTitle="item.sender_name ? `${item.sender_name} <${item.sender_email}>` : item.sender_email" 
        :text="item.body" 
        :color="item.color"
        :variant="item.variant"
      />
      
      <BaseCard
        v-else-if="item.type === 'DangerExplanation'"
        :type="item.type"
        :text="item.why_dangerous"
        :color="item.color"
        :variant="item.variant"
      />

      <BaseCard
        v-else-if="item.type === 'advice'"
        :type="item.type"
        :textList="item.warning_signals"
        :color="item.color"
        :variant="item.variant"
      />

      <BaseCard
        v-else-if="item.type === 'correctiveAction'"
        :type="item.type"
        :textList="item.correct_action"
        :color="item.color"
        :variant="item.variant"
      />

    </v-col>
  </v-row>

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

  <v-col cols="12" class="text-center mb-2">
    <span class="text-caption text-grey font-weight-bold">⚙️ 以下デバッグ用ボタン 本番に移行するときは消してね♡</span>
  </v-col>
  <v-row class="mt-4 px-1" >
    
    <v-col cols="12" sm="3">
      <v-btn block color="error" variant="tonal" prepend-icon="mdi-refresh" @click="setToDanger">
        不正解解説
      </v-btn>
    </v-col>
    <v-col cols="12" sm="3">
      <v-btn block color="success" variant="flat" append-icon="mdi-arrow-right" @click="setToCorrect">
        正解！！！！！！！
      </v-btn>
    </v-col>
    <v-col cols="12" sm="3">
      <v-btn block color="grey-darken-3" variant="elevated" prepend-icon="mdi-skull" @click="goToPage('FearEffect_Death')">
        Deathイベントへ
      </v-btn>
    </v-col>
    <v-col cols="12" sm="3">
      <v-btn block color="amber-darken-2" variant="outlined" prepend-icon="mdi-alert" @click="goToPage('FearEffect_False')">
        Falseイベントへ
      </v-btn>
    </v-col>
  </v-row>

  <v-row class="mt-6 px-1 justify-center" no-gutters style="border-top: 1px dashed #777; padding-top: 1.5em;">
    <v-col cols="12" class="text-center mb-2">
      <span class="text-caption text-grey font-weight-bold">⚙️ バックエンド・デバック用問題切替スイッチ</span>
    </v-col>
    <v-col cols="4" class="pa-1">
      <v-btn block color="blue-grey-darken-2" variant="outlined" size="small" prepend-icon="mdi-database-search" @click="loadQuestionData(1)">
        問題 ID: 1
      </v-btn>
    </v-col>
    <v-col cols="4" class="pa-1">
      <v-btn block color="blue-grey-darken-2" variant="outlined" size="small" prepend-icon="mdi-database-search" @click="loadQuestionData(2)">
        問題 ID: 2
      </v-btn>
    </v-col>
    <v-col cols="4" class="pa-1">
      <v-btn block color="blue-grey-darken-2" variant="outlined" size="small" prepend-icon="mdi-database-search" @click="loadQuestionData(3)">
        問題 ID: 3
      </v-btn>
    </v-col>
  </v-row>
  </template>

<script setup lang="ts">
import BaseCard from '@/components/ui/IshikawaStyle.vue'
import { useUserInput } from '@/stores/userInput'
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchQuestion } from '@/api/QuestionApi'

interface ApiDangerCard {
  id: string | number
  type: 'danger'
  title?: string         
  sender_name?: string   
  sender_email: string
  body: string
  is_phishing?: boolean  // 👈 データベースから渡るフラグを受け取れるよう型を追加
  color?: string
  variant?: 'flat' | 'text' | 'tonal' | 'elevated' | 'outlined' | 'plain'
}
interface ApiExplanationCard {
  id: string | number
  type: 'DangerExplanation'
  why_dangerous: string
  color?: string
  variant?: 'flat' | 'text' | 'tonal' | 'elevated' | 'outlined' | 'plain'
}
interface ApiAdviceCard {
  id: string | number
  type: 'advice'
  warning_signals: string[]
  color?: string
  variant?: 'flat' | 'text' | 'tonal' | 'elevated' | 'outlined' | 'plain'
}
interface ApiActionCard {
  id: string | number
  type: 'correctiveAction'
  correct_action: string[]
  color?: string
  variant?: 'flat' | 'text' | 'tonal' | 'elevated' | 'outlined' | 'plain'
}
type LocalCardItem = ApiDangerCard | ApiExplanationCard | ApiAdviceCard | ApiActionCard

const userInput = useUserInput()
const userName = ref('')
const router = useRouter()

const pageTitle = ref('フィッシング詐欺に遭遇')
const pageSubtitle = ref('今のは危険なメールでした')
const pageIcon = ref('mdi-close-circle-outline')
const pageIconClass = ref('slow-pulse super-vivid-red')

const cards = ref<LocalCardItem[]>([])
const isLoading = ref(true)

/**
 * 💡 現在読み込まれているカードデータから、is_phishing の真偽値を安全に探すヘルパー関数
 */
const getIsPhishingStatus = (): boolean => {
  const dangerCard = cards.value.find(item => item.type === 'danger') as ApiDangerCard | undefined
  // 該当カードがない、または明示的に false の場合を除き、安全のためデフォルトは true (詐欺メール扱い) とします
  return dangerCard?.is_phishing !== false
}

/**
 * APIを呼び出し、取得した成形済みデータをそのまま cards 配列にセットする関数
 */
const loadQuestionData = async (targetId?: number) => {
  try {
    isLoading.value = true
    cards.value = await fetchQuestion(targetId) as any
    
    // データが切り替わったら、その問題の「is_phishing」を元に初期の不正解（初期状態）表示を自動生成
    setToDanger()
  } catch (err) {
    console.error(`❌ 画面への問題データ(ID: ${targetId})の読み込みに失敗しました:`, err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadQuestionData() // 初期表示は通常通り最新データを取得
})

/**
 * 🎯 【正解ボタン】クリック時の動的テキスト切り替え
 */
const setToCorrect = () => {
  const isPhishing = getIsPhishingStatus()
  
  pageTitle.value = '正解'
  pageIcon.value = 'mdi-check-circle-outline'
  pageIconClass.value = 'super-vivid-green'

  if (isPhishing) {
    // True: 詐欺メールを見破って回避した場合
    pageSubtitle.value = '適切な判断ができました'
  } else {
    // False: 安全な通常メールだと正しく見抜いた場合
    pageSubtitle.value = '仕事をやり遂げました！'
  }
}

/**
 * 🎯 【不正解ボタン / 初期表示】クリック時の動的テキスト切り替え
 */
const setToDanger = () => {
  const isPhishing = getIsPhishingStatus()
  
  pageIcon.value = 'mdi-close-circle-outline'
  pageIconClass.value = 'slow-pulse super-vivid-red'

  if (isPhishing) {
    // True: 詐欺メールに引っかかってしまった場合
    pageTitle.value = 'フィッシング詐欺に遭遇'
    pageSubtitle.value = '今のは詐欺でした'
  } else {
    // False: 普通の業務メールなのに過剰警戒してスルー・通報してしまった場合
    pageTitle.value = '安全なメールの確認'
    pageSubtitle.value = '今のは正常なメールでした'
  }
}

const goToPage = (pageName: string) => { router.push({ name: pageName }) }

watch(userName, (s) => { userInput.userName = s })
</script>

<style lang="css" scoped>
.margin-3 { margin-top: 2em; }
.super-vivid-red { color: #FF0000 !important; }
.super-vivid-green { color: #00FF00 !important; }
.slow-pulse { animation: pulse-animation 1.5s ease-in-out infinite alternate; }
@keyframes pulse-animation { 0% { opacity: 1; } 100% { opacity: 0.15; } }
</style>