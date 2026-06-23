<template>
  <main class="make-question-page" :aria-busy="loading || saving ? 'true' : 'false'">
    <header class="make-question-hero">
      <v-icon icon="mdi-auto-fix" class="make-question-hero__icon" />
      <div>
        <h1>問題生成</h1>
        <p>AI生成による訓練用フィッシングメール</p>
      </div>
    </header>

    <section class="generator-panel">
      <div class="generator-panel__copy">
        <h2>問題生成</h2>
        <p>カテゴリ、メール種別、画像の有無を選択して1問の訓練メールを生成します。</p>
      </div>

      <div class="generator-controls">
        <label class="category-field">
          <span class="sr-only">カテゴリ</span>
          <select v-model="selectedScenario" :disabled="loading || saving">
            <option v-for="item in scenarioSelectItems" :key="item.value" :value="item.value">
              {{ item.title }}
            </option>
          </select>
          <v-icon icon="mdi-chevron-down" class="category-field__icon" />
        </label>

        <button
          class="generate-button"
          type="button"
          :disabled="loading || saving"
          @click="generate"
        >
          <v-progress-circular v-if="loading" indeterminate size="18" width="2" />
          <v-icon v-else icon="mdi-auto-fix" />
          <span>{{ loading ? '生成中...' : '生成する' }}</span>
        </button>

        <v-switch
          v-model="isPhishing"
          class="generate-toggle"
          color="error"
          density="compact"
          hide-details
          inset
          :label="isPhishing ? '詐欺メール' : '安全メール'"
          :disabled="loading || saving"
        />

        <v-switch
          v-model="includeImage"
          class="generate-toggle"
          color="secondary"
          density="compact"
          hide-details
          inset
          label="画像追加"
          :disabled="loading || saving"
        />
      </div>

      <p v-if="error" class="panel-message panel-message--error" role="alert">
        {{ error }}
      </p>
      <p v-if="saveError" class="panel-message panel-message--error" role="alert">
        {{ saveError }}
      </p>
      <p v-if="saveMessage" class="panel-message panel-message--success" role="status">
        {{ saveMessage }}
      </p>

      <div v-if="generatedStore.questions.length > 0" class="generated-list">
        <div class="generated-header">
          <div>
            <h3>生成結果</h3>
            <span>{{ generatedStore.questions.length }}件</span>
          </div>

          <button
            class="save-generated-button"
            type="button"
            :disabled="saving || generatedStore.unsavedQuestions.length === 0"
            @click="saveGeneratedQuestions"
          >
            <v-progress-circular v-if="saving" indeterminate size="18" width="2" />
            <v-icon v-else icon="mdi-content-save-outline" />
            <span>{{ saving ? '保存中...' : 'Supabaseに保存' }}</span>
          </button>
        </div>

        <AdminQuestionCard
          v-for="question in generatedStore.questions"
          :key="question.id"
          :question="question"
          :busy="saving"
          show-explanation-action
          @open="openQuestionDetail"
          @edit-question="openQuestionDialog"
          @edit-explanation="openExplanationDialog"
          @delete="deleteGeneratedQuestion"
        />
      </div>

      <div v-else class="empty-state">
        <v-progress-circular v-if="loading" indeterminate size="56" width="4" />
        <v-icon v-else icon="mdi-email-outline" class="empty-state__icon" />
        <p>{{ loading ? '訓練メールを生成しています' : 'カテゴリを選択して「生成する」をクリックしてください' }}</p>
      </div>
    </section>

    <AdminQuestionEditDialog
      v-model="questionDialog"
      :question="selectedQuestion"
      :saving="false"
      :error="questionDialogError"
      @save="saveQuestionDialog"
    />

    <AdminExplanationEditDialog
      v-model="explanationDialog"
      :explanation="selectedQuestion?.explanation ?? null"
      :is-phishing="selectedQuestion?.is_phishing ?? true"
      :saving="false"
      :error="explanationDialogError"
      @save="saveExplanationDialog"
    />
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { generateQuestionExplanation, saveGeneratedQuestion, type GenerateCategory } from '@/api/question_generate'
import type { SaveQuestionExplanationPayload, UpdateMailPayload } from '@/api/mailApi'
import AdminExplanationEditDialog from '@/components/admin/AdminExplanationEditDialog.vue'
import AdminQuestionCard from '@/components/admin/AdminQuestionCard.vue'
import AdminQuestionEditDialog from '@/components/admin/AdminQuestionEditDialog.vue'
import { useAdminGeneratedQuestions, type EditableGeneratedQuestion } from '@/stores/admin_generatedQuestions'
import { question_scenario, scenarioSelectItems, type Scenario } from '@/stores/admin_questionList'

const GENERATE_COUNT = 1

const scenarioToCategory: Record<Scenario, GenerateCategory> = {
  school: 'student',
  business: 'company',
  daily: 'general',
}

const router = useRouter()
const questionStore = question_scenario()
const generatedStore = useAdminGeneratedQuestions()

const loading = ref(false)
const saving = ref(false)
const isPhishing = ref(true)
const includeImage = ref(false)
const error = ref<string | null>(null)
const saveError = ref<string | null>(null)
const saveMessage = ref<string | null>(null)
const selectedQuestion = ref<EditableGeneratedQuestion | null>(null)
const questionDialog = ref(false)
const explanationDialog = ref(false)
const questionDialogError = ref<string | null>(null)
const explanationDialogError = ref<string | null>(null)

const selectedScenario = computed<Scenario>({
  get: () => questionStore.scenario,
  set: (scenario) => {
    questionStore.setScenario(scenario)
  },
})

const selectedCategory = computed(() => scenarioToCategory[questionStore.scenario])

async function generate() {
  loading.value = true
  error.value = null
  saveError.value = null
  saveMessage.value = null

  try {
    const result = await generateQuestionExplanation({
      category: selectedCategory.value,
      count: GENERATE_COUNT,
      isPhishing: isPhishing.value,
      includeImage: includeImage.value,
    })
    generatedStore.replaceQuestions(result.questions)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '問題生成に失敗しました。'
  } finally {
    loading.value = false
  }
}

async function saveGeneratedQuestions() {
  if (generatedStore.unsavedQuestions.length === 0) return

  saving.value = true
  saveError.value = null
  saveMessage.value = null

  try {
    for (const question of generatedStore.unsavedQuestions) {
      await saveGeneratedQuestion(question)
      generatedStore.markSaved(question.id)
    }
    saveMessage.value = '生成した問題をSupabaseに保存しました。'
  } catch (e) {
    saveError.value = e instanceof Error ? e.message : 'Supabaseへの保存に失敗しました。'
  } finally {
    saving.value = false
  }
}

function openQuestionDetail(question: EditableGeneratedQuestion) {
  router.push({
    path: '/admin_questiondetail',
    query: {
      source: 'generated',
      id: question.id,
    },
  })
}

function openQuestionDialog(question: EditableGeneratedQuestion) {
  selectedQuestion.value = question
  questionDialogError.value = null
  questionDialog.value = true
}

function saveQuestionDialog(payload: UpdateMailPayload) {
  if (!selectedQuestion.value) return

  if (!payload.title || !payload.sender_name || !payload.sender_email || !payload.body) {
    questionDialogError.value = 'タイトル、差出人、メールアドレス、本文を入力してください。'
    return
  }

  generatedStore.updateQuestion(selectedQuestion.value.id, payload)
  selectedQuestion.value = generatedStore.getQuestion(selectedQuestion.value.id)
  questionDialog.value = false
}

function openExplanationDialog(question: EditableGeneratedQuestion) {
  selectedQuestion.value = question
  explanationDialogError.value = null
  explanationDialog.value = true
}

function saveExplanationDialog(payload: SaveQuestionExplanationPayload) {
  if (!selectedQuestion.value) return

  if (!payload.why_dangerous || !payload.correct_action) {
    explanationDialogError.value = selectedQuestion.value.is_phishing
      ? 'なぜ危険か、正しい対処法を入力してください。'
      : '安全と判断できる理由、安全な対応を入力してください。'
    return
  }

  generatedStore.updateExplanation(selectedQuestion.value.id, payload)
  selectedQuestion.value = generatedStore.getQuestion(selectedQuestion.value.id)
  explanationDialog.value = false
}

function deleteGeneratedQuestion(question: EditableGeneratedQuestion) {
  generatedStore.deleteQuestion(question.id)
}
</script>

<style lang="css" scoped>
.make-question-page {
  min-height: 100vh;
  padding: 36px 26px 40px 30px;
  background: #172337;
  color: #ffffff;
}

.make-question-hero {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 32px;
}

.make-question-hero__icon {
  color: #b34aff;
  font-size: 48px;
  margin-top: -2px;
}

.make-question-hero h1 {
  margin: 0;
  color: #ffffff;
  font-size: 40px;
  font-weight: 900;
  letter-spacing: 0;
  line-height: 1;
}

.make-question-hero p {
  margin: 9px 0 0;
  color: #98b3d6;
  font-size: 18px;
  font-weight: 500;
}

.generator-panel {
  width: 100%;
  max-width: 1038px;
  min-height: 466px;
  padding: 28px 30px 30px;
  border: 1px solid #31425e;
  border-radius: 17px;
  background: #1b2a40;
}

.generator-panel__copy h2 {
  margin: 0;
  color: #ffffff;
  font-size: 22px;
  font-weight: 900;
  letter-spacing: 0;
}

.generator-panel__copy p {
  margin: 10px 0 0;
  color: #9bb4d2;
  font-size: 18px;
  font-weight: 500;
}

.generator-controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 32px;
}

.category-field {
  position: relative;
  display: block;
  width: 320px;
  flex: 0 0 auto;
}

.category-field select {
  width: 100%;
  height: 46px;
  padding: 0 48px 0 16px;
  border: 1px solid #344761;
  border-radius: 9px;
  appearance: none;
  background: #1b293f;
  color: #ffffff;
  cursor: pointer;
  font: inherit;
  font-size: 16px;
  font-weight: 800;
  outline: none;
}

.category-field select:disabled {
  cursor: default;
  opacity: 0.7;
}

.category-field select:focus-visible {
  border-color: #ad18f2;
  box-shadow: 0 0 0 3px rgba(173, 24, 242, 0.24);
}

.category-field__icon {
  position: absolute;
  top: 50%;
  right: 15px;
  color: #536681;
  font-size: 22px;
  pointer-events: none;
  transform: translateY(-50%);
}

.generate-button,
.save-generated-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  border: 0;
  color: #ffffff;
  cursor: pointer;
  font: inherit;
  font-weight: 900;
  letter-spacing: 0;
  transition:
    filter 160ms ease,
    transform 160ms ease,
    opacity 160ms ease;
}

.generate-button {
  min-width: 139px;
  height: 45px;
  padding: 0 18px;
  border-radius: 9px;
  background: linear-gradient(90deg, #b715f5 0%, #a516f0 100%);
  font-size: 16px;
}

.save-generated-button {
  min-height: 40px;
  padding: 0 16px;
  border-radius: 8px;
  background: rgba(173, 24, 242, 0.24);
  font-size: 14px;
}

.generate-button:hover:not(:disabled),
.save-generated-button:hover:not(:disabled) {
  filter: brightness(1.08);
  transform: translateY(-1px);
}

.generate-button:disabled,
.save-generated-button:disabled {
  cursor: default;
  opacity: 0.62;
  transform: none;
}

.generate-toggle {
  flex: 0 0 auto;
  color: #dbeafe;
  font-weight: 900;
}

.panel-message {
  margin: 18px 0 0;
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
}

.panel-message--error {
  border: 1px solid rgba(255, 92, 112, 0.42);
  background: rgba(255, 92, 112, 0.12);
  color: #ffd4dc;
}

.panel-message--success {
  border: 1px solid rgba(64, 214, 132, 0.42);
  background: rgba(64, 214, 132, 0.12);
  color: #d2ffe4;
}

.empty-state {
  display: flex;
  min-height: 273px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 30px;
  color: #9bb4d2;
  text-align: center;
}

.empty-state__icon {
  color: #536681;
  font-size: 76px;
}

.empty-state p {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.generated-list {
  display: grid;
  gap: 14px;
  margin-top: 34px;
}

.generated-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.generated-header h3 {
  margin: 0;
  color: #ffffff;
  font-size: 20px;
  font-weight: 900;
}

.generated-header span {
  color: #9bb4d2;
  font-size: 13px;
  font-weight: 700;
}

.generated-list :deep(.question-card) {
  border-color: #31425e;
  background: #172337;
  color: #ffffff;
}

.generated-list :deep(.question-card:hover),
.generated-list :deep(.question-card:focus-visible) {
  border-color: rgba(179, 74, 255, 0.68);
  box-shadow: 0 14px 30px rgba(2, 8, 23, 0.22);
}

.generated-list :deep(.question-preview),
.generated-list :deep(.question-sender),
.generated-list :deep(.text-medium-emphasis) {
  color: #9bb4d2 !important;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 900px) {
  .make-question-page {
    padding: 28px 18px 36px;
  }

  .make-question-hero h1 {
    font-size: 34px;
  }

  .generator-panel {
    min-height: 420px;
    padding: 24px 20px;
  }

  .generator-controls,
  .generated-header {
    align-items: stretch;
    flex-direction: column;
  }

  .category-field,
  .generate-button,
  .save-generated-button {
    width: 100%;
  }

  .generate-toggle {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
