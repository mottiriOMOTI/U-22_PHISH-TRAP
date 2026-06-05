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

    <!-- 問題別正答率 -->
    <div class="card">

      <h2 class="card-title">
        問題別正答率
      </h2>

      <p class="description">
        各フィッシングタイプの統計
      </p>

      <div
        v-for="(item, index) in questionList"
        :key="index"
        class="question-item"
      >

        <div class="question-row">

          <span class="question-name">
            {{ item }}
          </span>

        </div>

        <!-- バー -->
        <div class="progress-bg">

          <div class="progress-bar"></div>

        </div>

      </div>

    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { fetchLearnerCount, type Scenario } from '@/api/adminOverviewApi'
import { fetchAverageAccuracy } from '@/api/trainingStatsApi'

type Category = 'student' | 'company' | 'general' | 'all'

const selectedCategory = ref<Category>('all')
const categoryOptions = [
  { label: '総ユーザー', value: 'all' },
  { label: '学生', value: 'student' },
  { label: '企業', value: 'company' },
  { label: '一般', value: 'general' },
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

const categoryMap: Record<Category, { label: string; key: keyof typeof learnerCounts.value; scenario?: Scenario }> = {
  all: { label: '総ユーザー', key: 'total' },
  student: { label: '学生', key: 'school', scenario: 'school' },
  company: { label: '企業', key: 'business', scenario: 'business' },
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

onMounted(() => {
  loadLearnerCount()
  loadAccuracy()
})

watch(selectedCategory, () => {
  loadLearnerCount()
  loadAccuracy()
})

const questionList = [
  'Amazon偽装',
  'CEO詐欺',
  '当選詐欺',
  'Microsoft偽装',
]
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

</style>