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

<style src="../../Main.css"></style>
<style lang="css" scoped src="../css/Situation.css"></style>

