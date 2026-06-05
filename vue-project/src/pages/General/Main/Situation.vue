<template>
  <main class="situation-page" :aria-busy="isLoading ? 'true' : 'false'">
    <header class="situation-hero">
      <v-icon icon="mdi-briefcase-outline" class="situation-hero__icon" />
      <div>
        <h1>シチュエーション設定</h1>
        <p>訓練のシチュエーションを選択してください</p>
      </div>
    </header>

    <section class="scenario-grid" aria-label="シチュエーション一覧">
      <article
        v-for="scenario in scenarios"
        :key="scenario.id"
        :class="[
          'scenario-card',
          `scenario-card--${scenario.id}`,
          { 'scenario-card--selected': selectedScenarioId === scenario.id },
        ]"
      >
        <button
          class="scenario-card__button"
          type="button"
          :aria-pressed="selectedScenarioId === scenario.id"
          :disabled="savingScenarioId === scenario.id"
          @click="selectScenario(scenario.id)"
        >
          <div class="scenario-card__head">
            <span class="scenario-card__icon">
              <v-icon :icon="scenario.icon" />
            </span>
            <h2>{{ scenario.title }}</h2>
            <v-icon
              v-if="selectedScenarioId === scenario.id"
              icon="mdi-check"
              class="scenario-card__check"
            />
          </div>

          <p class="scenario-card__description">{{ scenario.description }}</p>

          <div class="scenario-card__block">
            <h3>メール例:</h3>
            <ul>
              <li v-for="example in scenario.examples" :key="example">{{ example }}</li>
            </ul>
          </div>

          <div class="scenario-card__divider" />

          <div class="scenario-card__block">
            <h3 class="scenario-card__label scenario-card__label--danger">恐怖演出:</h3>
            <p>{{ scenario.fearEffect }}</p>
          </div>

          <div class="scenario-card__block">
            <h3 class="scenario-card__label scenario-card__label--warning">誤判定時:</h3>
            <p>{{ scenario.wrongJudgement }}</p>
          </div>

          <span
            v-if="selectedScenarioId === scenario.id"
            class="scenario-card__selected-label"
          >
            選択中
          </span>
        </button>
      </article>
    </section>

    <section class="situation-panel">
      <h2>シチュエーションについて</h2>
      <p>
        シチュエーションを選択すると、メールの内容や恐怖演出がそのシチュエーションに合わせたものになります。
      </p>
      <ul class="situation-notes">
        <li>
          <span class="situation-notes__mark situation-notes__mark--business">▸</span>
          <strong>ビジネス:</strong>
          企業で実際に起こりうるフィッシング攻撃を体験できます
        </li>
        <li>
          <span class="situation-notes__mark situation-notes__mark--school">▸</span>
          <strong>学校:</strong>
          学生が遭遇しやすい詐欺メールを学習できます
        </li>
        <li>
          <span class="situation-notes__mark situation-notes__mark--daily">▸</span>
          <strong>日常:</strong>
          日常生活で受け取る可能性のある詐欺メールを体験できます
        </li>
      </ul>
    </section>

    <p v-if="errorMessage" class="situation-message situation-message--error" role="alert">
      {{ errorMessage }}
    </p>
    <p v-else-if="successMessage" class="situation-message situation-message--success" role="status">
      {{ successMessage }}
    </p>

    <button class="help-button" type="button" aria-label="ヘルプ">?</button>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

import {
  fetchSituation,
  saveSituation,
  type SituationId,
  type SituationOption,
} from '@/api/situation'

const scenarios: SituationOption[] = [
  {
    id: 'business',
    title: 'ビジネス',
    icon: 'mdi-briefcase-outline',
    description: 'CEO詐欺、請求書偽造などの企業向け訓練',
    examples: ['CEO詐欺メール', '請求書偽造', 'サプライチェーン攻撃', '経理部偽装'],
    fearEffect: '情報漏洩、ファイル暗号化などの攻撃演出',
    wrongJudgement: '納期遅延 → 損害賠償 → 解雇通告',
  },
  {
    id: 'school',
    title: '学校',
    icon: 'mdi-school-outline',
    description: 'アルバイト詐欺、フィッシングなどの学生向け訓練',
    examples: ['アルバイト詐欺', '奨学金詐欺', '教材販売詐欺', 'SNS乗っ取り'],
    fearEffect: '個人情報流出、学校特定などの攻撃演出',
    wrongJudgement: '課題未提出 → 単位不足 → 退学通告',
  },
  {
    id: 'daily',
    title: '日常',
    icon: 'mdi-home-outline',
    description: '当選詐欺、パスワードリセット詐欺などの一般向け訓練',
    examples: ['当選詐欺', '配送業者偽装', '銀行詐欺', 'パスワードリセット詐欺'],
    fearEffect: '個人情報流出、カメラ起動などの攻撃演出',
    wrongJudgement: '就職活動 → 内定取り消し → 警察沙汰',
  },
]

const selectedScenarioId = ref<SituationId>('school')
const isLoading = ref(true)
const savingScenarioId = ref<SituationId | null>(null)
const errorMessage = ref('')
const successMessage = ref('')

function showSuccess(message: string) {
  successMessage.value = message
  errorMessage.value = ''
}

function showError(message: string) {
  errorMessage.value = message
  successMessage.value = ''
}

async function loadSituation() {
  isLoading.value = true
  try {
    const situation = await fetchSituation()
    selectedScenarioId.value = situation.selectedScenarioId
  } catch (error) {
    console.error(error)
    showError('シチュエーションの読み込みに失敗しました')
  } finally {
    isLoading.value = false
  }
}

async function selectScenario(scenarioId: SituationId) {
  if (savingScenarioId.value) return

  const previousScenarioId = selectedScenarioId.value
  selectedScenarioId.value = scenarioId
  savingScenarioId.value = scenarioId

  try {
    const situation = await saveSituation(scenarioId)
    selectedScenarioId.value = situation.selectedScenarioId
    showSuccess('シチュエーションを保存しました')
  } catch (error) {
    console.error(error)
    selectedScenarioId.value = previousScenarioId
    showError('シチュエーションの保存に失敗しました')
  } finally {
    savingScenarioId.value = null
  }
}

onMounted(loadSituation)
</script>

<style lang="css" scoped>
.situation-page {
  position: relative;
  box-sizing: border-box;
  min-height: 100vh;
  padding: 18px 22px 14px;
  background: #172337;
  color: #ffffff;
}

.situation-hero {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.situation-hero__icon {
  color: #ff7a1a;
  font-size: 42px;
}

.situation-hero h1 {
  margin: 0;
  font-size: 30px;
  font-weight: 800;
  line-height: 1.1;
}

.situation-hero p,
.scenario-card__description,
.scenario-card__block p,
.scenario-card__block li,
.situation-panel p,
.situation-notes {
  color: #9fbbe0;
}

.situation-hero p {
  margin: 6px 0 0;
  font-size: 16px;
}

.scenario-grid {
  display: grid;
  width: min(100%, 1040px);
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 30px;
}

.scenario-card {
  min-width: 0;
}

.scenario-card__button {
  display: flex;
  width: 100%;
  min-height: 432px;
  flex-direction: column;
  align-items: stretch;
  padding: 28px 30px 30px;
  border: 2px solid #34465f;
  border-radius: 16px;
  background: #172337;
  color: #ffffff;
  cursor: pointer;
  text-align: left;
  transition:
    border-color 160ms ease,
    background-color 160ms ease;
}

.scenario-card--selected .scenario-card__button {
  border-color: #00d66f;
  background: #15383d;
}

.scenario-card__head {
  display: flex;
  align-items: center;
  gap: 16px;
}

.scenario-card__icon {
  display: grid;
  width: 70px;
  height: 70px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 10px;
}

.scenario-card--business .scenario-card__icon {
  background: #1c3574;
  color: #5da2ff;
}

.scenario-card--school .scenario-card__icon {
  background: #0d5b35;
  color: #00d66f;
}

.scenario-card--daily .scenario-card__icon {
  background: #50207d;
  color: #c173ff;
}

.scenario-card__icon :deep(.v-icon) {
  font-size: 42px;
}

.scenario-card h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
}

.scenario-card__check {
  margin-left: auto;
  color: #00d66f;
  font-size: 26px;
}

.scenario-card__description {
  min-height: 66px;
  margin: 22px 0 18px;
  font-size: 17px;
  line-height: 1.6;
}

.scenario-card__block {
  margin-top: 0;
}

.scenario-card__block + .scenario-card__block {
  margin-top: 18px;
}

.scenario-card__block h3 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 800;
}

.scenario-card__block ul {
  margin: 0;
  padding-left: 18px;
}

.scenario-card__block li,
.scenario-card__block p {
  margin: 0;
  font-size: 14px;
  line-height: 1.55;
}

.scenario-card__divider {
  height: 1px;
  margin: 16px 0;
  background: #34465f;
}

.scenario-card__label--danger {
  color: #ff485c;
}

.scenario-card__label--warning {
  color: #ffd400;
}

.scenario-card__selected-label {
  display: flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  margin-top: auto;
  border-radius: 8px;
  background: #09ad4b;
  color: #ffffff;
  font-size: 16px;
  font-weight: 800;
}

.situation-panel {
  width: min(100%, 1040px);
  margin-top: 30px;
  padding: 26px 30px;
  border: 1px solid #34465f;
  border-radius: 12px;
  background: #172337;
}

.situation-panel h2 {
  margin: 0 0 30px;
  font-size: 19px;
  font-weight: 800;
}

.situation-panel p {
  margin: 0 0 18px;
  font-size: 15px;
  line-height: 1.6;
}

.situation-notes {
  display: grid;
  gap: 14px;
  margin: 0;
  padding: 0 0 0 24px;
  font-size: 15px;
  line-height: 1.45;
  list-style: none;
}

.situation-notes li {
  display: flex;
  gap: 8px;
}

.situation-notes strong {
  color: #ffffff;
}

.situation-notes__mark--business {
  color: #5da2ff;
}

.situation-notes__mark--school {
  color: #00d66f;
}

.situation-notes__mark--daily {
  color: #c173ff;
}

.situation-message {
  width: min(100%, 1040px);
  margin: 8px 0 0;
  font-size: 13px;
  font-weight: 700;
}

.situation-message--error {
  color: #ff7382;
}

.situation-message--success {
  color: #77d99a;
}

.help-button {
  position: fixed;
  right: 14px;
  bottom: 12px;
  width: 34px;
  height: 34px;
  border: 1px solid #d7dce7;
  border-radius: 50%;
  background: #ffffff;
  color: #1e2430;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}

@media (max-width: 1100px) {
  .scenario-grid {
    gap: 16px;
  }

  .scenario-card__button {
    padding: 22px;
  }
}

@media (max-width: 900px) {
  .situation-page {
    padding: 18px 14px 16px;
  }

  .scenario-grid {
    grid-template-columns: 1fr;
  }

  .scenario-card__button {
    min-height: auto;
  }

  .scenario-card__description {
    min-height: 0;
  }

  .situation-panel {
    padding: 18px;
  }
}
</style>
