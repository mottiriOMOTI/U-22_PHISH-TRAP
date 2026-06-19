<template>
  <div class="dashboard">

    <!-- ヘッダー -->
    <div class="header">

      <div>
        <h1 class="title">
          概要
        </h1>

        <p class="subtitle">
          システム全体の統計情報
        </p>
      </div>

      <!-- プルダウン -->
      <v-select
  v-model="selectedCategory"
  :items="categoryOptions"
  item-title="label"
  item-value="value"
  label="シチュエーション"
  density="compact"
  variant="outlined"
  hide-details
  style="max-width: 240px;"
/>
    </div>

    <!-- 上カード -->
    <div class="card-grid">

      <!-- 総学習者数 -->
      <div class="card">

        <h2 class="card-title">
          総学習者数
        </h2>

        <div class="count-box">
          <template v-if="loadingLearnerCount">
            <span>読み込み中...</span>
          </template>
          <template v-else-if="learnerCountError">
            <span>エラー</span>
          </template>
          <template v-else>
            <span class="count-display">{{ selectedCategoryCount.toLocaleString() }}人</span>
          </template>
        </div>

      </div>

      <!-- 平均正答率 -->
      <div class="card">

        <h2 class="card-title">
          平均正答率
        </h2>

        <div class="count-box">
          <template v-if="loadingAccuracy">
            <span>読み込み中...</span>
          </template>
          <template v-else-if="accuracyError">
            <span>エラー</span>
          </template>
          <template v-else>
            <span class="count-display">{{ averageAccuracy.toFixed(1) }}%</span>
          </template>
        </div>

      </div>

    </div>

    <!-- ユーザー一覧   -->
    
   
  <v-container class="admin-userlist pa-4" max-width="1200">
    <div class="d-flex align-center mb-4 ga-4">
      <h2 class="text-h5">ユーザー一覧</h2>
      </div>
 
    <div v-if="loading">
      <v-skeleton-loader type="table" />
    </div>
 
    <v-alert
      v-else-if="error"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ error }}
      <template #append>
        <v-btn size="small" variant="text" @click="load">再試行</v-btn>
      </template>
    </v-alert>
 
    <div v-else>
      <v-row class="user-card-list" dense>
        <v-col cols="12" sm="6" v-for="item in users" :key="item.id">
          <v-card class="user-card" elevation="1">
            <v-card-text class="user-card-header py-4">
              <div class="user-card-main">
                <div class="user-card-info">
                  <div class="user-card-name">{{ item.name }}</div>
                  <div class="user-card-email">{{ item.email }}</div>
                </div>
                <div class="user-card-status">
                  <v-chip size="small" variant="tonal" class="user-card-chip">
                    {{ scenarioLabel(item.current_scenario) }}
                  </v-chip>
                  <v-icon :color="item.is_active ? 'success' : 'grey'" size="24">
                    {{ item.is_active ? 'mdi-check-circle' : 'mdi-clock-outline' }}
                  </v-icon>
                </div>
              </div>
              <div class="user-card-sub">
                <div>
                  <div class="text-caption text--secondary">スコア</div>
                  <div class="text-body-2 fw-semibold">{{ formatScore(item) }}</div>
                </div>
                <div>
                  <div class="text-caption text--secondary">最終アクティブ</div>
                  <div class="text-body-2">{{ formatDate(item.last_active_at) }}</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      <v-alert v-if="!loading && users.length === 0" type="info" variant="tonal">
        該当するユーザーがいません
      </v-alert>
    </div>
  </v-container>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { fetchLearnerCount, type Scenario } from '@/api/adminOverviewApi'
import { fetchAverageAccuracy, fetchQuestionAccuracy, type QuestionAccuracy } from '@/api/trainingStatsApi'
import { fetchUsers, type UserListItem } from '@/api/usersListApi'

type Category = 'student' | 'company' | 'general' | 'all'

type QuestionItem = {
  id: string
  label: string
}

const questionItems: QuestionItem[] = [
  { id: 'amazon', label: 'Amazon偽装' },
  { id: 'ceo', label: 'CEO詐欺' },
  { id: 'lottery', label: '当選詐欺' },
  { id: 'microsoft', label: 'Microsoft偽装' },
]

const selectedCategory = ref<Category>('all')
const categoryOptions = [
  { label: '総学習者', value: 'all' },
  { label: '社会人 (business)', value: 'company' },
  { label: '学生 (school)', value: 'student' },
  { label: '一般 (daily)', value: 'general' },
]
const learnerCounts = ref({
  total: 0,
  business: 0,
  school: 0,
  daily: 0,
})
const loadingLearnerCount = ref(true)
const learnerCountError = ref(false)

const averageAccuracy = ref(0)
const loadingAccuracy = ref(true)
const accuracyError = ref(false)

const questionAccuracies = ref<QuestionAccuracy[]>([])
const loadingQuestionAccuracy = ref(true)
const questionAccuracyError = ref(false)

const categoryMap: Record<Category, { label: string; key: keyof typeof learnerCounts.value; scenario?: Scenario }> = {
  all: { label: '総学習者', key: 'total' },
  student: { label: '学生', key: 'school', scenario: 'school' },
  company: { label: '社会人', key: 'business', scenario: 'business' },
  general: { label: '一般', key: 'daily', scenario: 'daily' },
}

const selectedCategoryLabel = computed(() => categoryMap[selectedCategory.value].label)
const selectedCategoryCount = computed(() => learnerCounts.value[categoryMap[selectedCategory.value].key])
const selectedCategoryScenario = computed(() => categoryMap[selectedCategory.value].scenario)

async function loadLearnerCount() {
  loadingLearnerCount.value = true
  learnerCountError.value = false

  try {
    const [total, business, school, daily] = await Promise.all([
      fetchLearnerCount(),
      fetchLearnerCount('business'),
      fetchLearnerCount('school'),
      fetchLearnerCount('daily'),
    ])

    learnerCounts.value = { total, business, school, daily }
  } catch (error) {
    learnerCountError.value = true
    learnerCounts.value = { total: 0, business: 0, school: 0, daily: 0 }
  } finally {
    loadingLearnerCount.value = false
  }
}

async function loadAccuracy() {
  loadingAccuracy.value = true
  accuracyError.value = false

  try {
    averageAccuracy.value = await fetchAverageAccuracy(selectedCategoryScenario.value)
  } catch (error) {
    accuracyError.value = true
    averageAccuracy.value = 0
  } finally {
    loadingAccuracy.value = false
  }
}

async function loadQuestionAccuracy() {
  loadingQuestionAccuracy.value = true
  questionAccuracyError.value = false

  try {
    questionAccuracies.value = await fetchQuestionAccuracy(selectedCategoryScenario.value)
  } catch (error) {
    questionAccuracyError.value = true
    questionAccuracies.value = []
  } finally {
    loadingQuestionAccuracy.value = false
  }
}

onMounted(() => {
  loadLearnerCount()
  loadAccuracy()
  load()
})

watch(selectedCategory, () => {
  loadAccuracy()
  loadQuestionAccuracy()
})

const questionAccuracyMap = computed(() => {
  const map = new Map<string, number>()
  questionAccuracies.value.forEach(item => {
    map.set(item.question, item.accuracy)
  })
  return map
})

function questionAccuracy(item: QuestionItem): number {
  return (
    questionAccuracyMap.value.get(item.id) ??
    questionAccuracyMap.value.get(item.label) ??
    0
  )
}

// ユーザー一覧のscript
const users = ref<UserListItem[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const scenarioLabelMap = {
  business: '社会人',
  school: '学生',
  daily: '一般',
}

async function load() {
  loading.value = true
  error.value = null

  try {
    users.value = await fetchUsers()
  } catch (e) {
    error.value =
      e instanceof Error
        ? e.message
        : 'ユーザーの取得に失敗しました'
  } finally {
    loading.value = false
  }
}

function scenarioLabel(s: Scenario): string {
  return scenarioLabelMap[s] ?? s
}

function formatScore(item: UserListItem): string {
  if (
    item.latest_correct_count === null ||
    item.latest_total_questions === null
  ) {
    return '未受講'
  }

  return `${item.latest_correct_count} / ${item.latest_total_questions}問正解`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'

  const d = new Date(iso)

  return d.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<style scoped>

/* 全体 */
.dashboard {
  min-height: 100vh;

  padding: 24px;

  background-color: #f8fafc;
}

/* ヘッダー */
.header {
  display: flex;

  justify-content: space-between;

  align-items: center;

  margin-bottom: 24px;
}

/* タイトル */
.title {
  font-size: 32px;

  font-weight: bold;

  color: #0f172a;
}

/* サブタイトル */
.subtitle {
  margin-top: 4px;

  color: #64748b;
}



/* 2列 */
.card-grid {
  display: grid;

  grid-template-columns: 1fr 1fr;

  gap: 16px;

  margin-bottom: 24px;
}

/* カード */
.card {
  background-color: white;

  border-radius: 16px;

  padding: 24px;
}

/* タイトル */
.card-title {
  font-size: 20px;

  font-weight: bold;

  color: #0f172a;

  margin-bottom: 16px;
}

/* ダミー */
.dummy-box {
  width: 120px;

  height: 40px;

  border-radius: 8px;

  background-color: #e2e8f0;
}

.count-box {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-width: 120px;
  padding: 16px;
  border-radius: 8px;
  background-color: #e2e8f0;
  color: #0f172a;
}

.count-display {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
}

.count-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 16px;
  font-weight: 700;
}

.count-row span:last-child {
  color: #0f172a;
}

/* 説明 */
.description {
  margin-bottom: 24px;

  color: #64748b;
}

/* 問題 */
.question-item {
  margin-bottom: 20px;
}

/* 行 */
.question-row {
  display: flex;

  justify-content: space-between;

  margin-bottom: 8px;
}

/* 問題名 */
.question-name {
  color: #0f172a;
}

/* バー背景 */
.progress-bg {
  width: 100%;

  height: 8px;

  background-color: #e2e8f0;

  border-radius: 9999px;

  overflow: hidden;
}

/* バー */
.progress-bar {
  width: 60%;

  height: 100%;

  border-radius: 9999px;

  background-color: #22c55e;
}

/* レスポンシブ */
@media (max-width: 768px) {

  .card-grid {
    grid-template-columns: 1fr;
  }

  .header {
    flex-direction: column;

    align-items: flex-start;

    gap: 16px;
  }

}

.user-card-list {
  row-gap: 24px;
  column-gap: 24px;
}

.user-card {
  width: 200%;
  min-height: 100px;
  border-radius: 20px;
}

.user-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

/*.user-card-main {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;

  flex: 0;
}*/

.user-card-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.user-card-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-card-name {
  font-size: 1.05rem;
  font-weight: 700;
  padding: 5px;
}

.user-card-email {
  color: rgba(0, 0, 0, 0.65);
  font-size: 0.95rem;
}

.user-card-email {
  width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-card-status {
  display: flex;
  align-items: center;
  gap: 5px;
}

.user-card-chip {
  text-transform: none;
}

.user-card-sub {
  display: flex;
  gap: 64px;
  flex-shrink: 0;
}

.user-card-sub > div {
  flex: 1;
  min-width: 120px;
}

.text-caption {
  white-space: nowrap;
}

.text-body-2 {
  font-weight: 600;
}
</style>