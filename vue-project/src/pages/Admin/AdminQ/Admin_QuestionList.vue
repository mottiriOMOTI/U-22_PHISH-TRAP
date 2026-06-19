<template>
  <main class="question-list-page" :aria-busy="questionStore.loading ? 'true' : 'false'">
    <header class="question-list-hero">
      <div class="question-list-hero__title">
        <v-icon icon="mdi-format-list-bulleted" class="question-list-hero__icon" />
        <div>
          <h1>問題一覧</h1>
          <p>登録済みの訓練用フィッシングメール</p>
        </div>
      </div>

      <label class="scenario-field">
        <span class="sr-only">カテゴリ</span>
        <select v-model="selectedScenario" :disabled="questionStore.loading">
          <option v-for="item in scenarioSelectItems" :key="item.value" :value="item.value">
            {{ item.title }}
          </option>
        </select>
        <v-icon icon="mdi-chevron-down" class="scenario-field__icon" />
      </label>
    </header>

    <section class="question-panel">
      <div class="question-panel__header">
        <h2>{{ selectedScenarioTitle }}の問題一覧</h2>
        <p>{{ questionStore.questions.length }}件の問題が登録されています</p>
      </div>

      <div v-if="questionStore.loading" class="question-loading" role="status">
        <div v-for="n in 2" :key="n" class="question-card-skeleton" />
      </div>

      <div v-else-if="questionStore.error" class="panel-message panel-message--error" role="alert">
        <span>{{ questionStore.error }}</span>
        <button type="button" @click="questionStore.fetchQuestions()">再試行</button>
      </div>

      <div v-else-if="questionStore.questions.length === 0" class="empty-state">
        <v-icon icon="mdi-email-search-outline" class="empty-state__icon" />
        <p>{{ selectedScenarioTitle }}の問題はまだ登録されていません</p>
      </div>

      <div v-else class="question-list" role="list">
        <article
          v-for="(question, index) in questionStore.questions"
          :key="question.id"
          class="question-card"
          role="listitem"
          tabindex="0"
          :aria-label="`${index + 1}件目のメール: ${question.title}`"
          @click="openQuestionDetail(question)"
          @keydown.enter.prevent="openQuestionDetail(question)"
          @keydown.space.prevent="openQuestionDetail(question)"
        >
          <div class="question-card__main">
            <div class="question-card__title-row">
              <h3>{{ question.title }}</h3>
              <span :class="['mail-type-chip', question.is_phishing ? 'mail-type-chip--danger' : 'mail-type-chip--safe']">
                {{ question.is_phishing ? '詐欺メール' : '正常メール' }}
              </span>
              <span :class="['difficulty-chip', `difficulty-chip--${difficultyInfo(question).tone}`]">
                難易度: {{ difficultyInfo(question).label }}
              </span>
            </div>

            <p class="question-card__sender">
              差出人: {{ question.sender_name }} ({{ question.sender_email }})
            </p>

            <p class="question-card__body">
              {{ previewBody(question.body) }}
            </p>

            <div class="question-card__meta">
              <span v-if="question.has_link">
                <v-icon icon="mdi-link-variant" />
                リンクあり
              </span>
              <span v-if="question.has_attachment">
                <v-icon icon="mdi-paperclip" />
                添付あり
              </span>
            </div>
          </div>

          <div class="question-card__actions">
            <button
              class="action-button action-button--edit"
              type="button"
              :disabled="isBusy"
              @click.stop="openQuestionDialog(question)"
            >
              <v-icon icon="mdi-square-edit-outline" />
              <span>編集</span>
            </button>
            <button
              class="action-button action-button--delete"
              type="button"
              :disabled="isBusy || questionStore.deletingId === question.id"
              @click.stop="openDeleteDialog(question)"
            >
              <v-progress-circular
                v-if="questionStore.deletingId === question.id"
                indeterminate
                size="16"
                width="2"
              />
              <v-icon v-else icon="mdi-delete-outline" />
              <span>削除</span>
            </button>
          </div>
        </article>
      </div>
    </section>

    <button class="help-button" type="button" aria-label="ヘルプ">
      ?
    </button>

    <AdminQuestionEditDialog
      v-model="questionDialog"
      :question="selectedQuestion"
      :saving="questionStore.saving"
      :error="questionDialogError"
      @save="saveQuestionDialog"
    />

    <AdminExplanationEditDialog
      v-model="explanationDialog"
      :explanation="selectedExplanation"
      :is-phishing="selectedQuestion?.is_phishing ?? true"
      :loading="questionStore.explanationLoading"
      :saving="questionStore.explanationSaving"
      :error="explanationDialogError"
      @save="saveExplanationDialog"
    />

    <v-dialog v-model="deleteDialog" max-width="440">
      <v-card>
        <v-card-title class="text-h6">問題を削除しますか？</v-card-title>
        <v-card-text>
          <v-alert v-if="deleteDialogError" type="error" variant="tonal" class="mb-4">
            {{ deleteDialogError }}
          </v-alert>
          <p class="mb-2">この問題は一覧に表示されなくなります。</p>
          <p class="text-body-2 text-medium-emphasis">
            {{ selectedQuestion?.title }}
          </p>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="closeDeleteDialog">キャンセル</v-btn>
          <v-btn
            color="error"
            :loading="selectedQuestion ? questionStore.deletingId === selectedQuestion.id : false"
            @click="confirmDeleteQuestion"
          >
            削除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </main>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import type { MailListItem, SaveQuestionExplanationPayload, UpdateMailPayload } from '@/api/mailApi'
import AdminExplanationEditDialog from '@/components/admin/AdminExplanationEditDialog.vue'
import AdminQuestionEditDialog from '@/components/admin/AdminQuestionEditDialog.vue'
import { question_scenario, scenarioSelectItems, type Scenario } from '@/stores/admin_questionList'

const router = useRouter()
const questionStore = question_scenario()

const selectedQuestion = ref<MailListItem | null>(null)
const selectedExplanation = ref<SaveQuestionExplanationPayload | null>(null)
const questionDialog = ref(false)
const explanationDialog = ref(false)
const deleteDialog = ref(false)
const questionDialogError = ref<string | null>(null)
const explanationDialogError = ref<string | null>(null)
const deleteDialogError = ref<string | null>(null)

const selectedScenario = computed<Scenario>({
  get: () => questionStore.scenario,
  set: (scenario) => {
    questionStore.setScenario(scenario)
  },
})

const selectedScenarioTitle = computed(() => {
  return scenarioSelectItems.find((item) => item.value === questionStore.scenario)?.title ?? ''
})

const isBusy = computed(() => {
  return questionStore.saving || questionStore.explanationLoading || questionStore.explanationSaving
})

function difficultyInfo(question: MailListItem) {
  if (question.has_attachment || question.phishing_type === 'malware_attachment') {
    return { label: '中', tone: 'medium' }
  }

  return { label: '易', tone: 'easy' }
}

function previewBody(body: string): string {
  return body
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function openQuestionDetail(question: MailListItem) {
  router.push({
    path: '/admin_questiondetail',
    query: {
      source: 'db',
      id: question.id,
    },
  })
}

function openQuestionDialog(question: MailListItem) {
  selectedQuestion.value = question
  questionDialogError.value = null
  questionDialog.value = true
}

async function saveQuestionDialog(payload: UpdateMailPayload) {
  if (!selectedQuestion.value) return

  if (!payload.title || !payload.sender_name || !payload.sender_email || !payload.body) {
    questionDialogError.value = 'タイトル、差出人、メールアドレス、本文を入力してください。'
    return
  }

  try {
    await questionStore.updateQuestion(selectedQuestion.value.id, payload)
    questionDialog.value = false
  } catch (e) {
    questionDialogError.value = e instanceof Error ? e.message : '問題の保存に失敗しました。'
  }
}

async function openExplanationDialog(question: MailListItem) {
  selectedQuestion.value = question
  selectedExplanation.value = null
  explanationDialog.value = true
  explanationDialogError.value = null

  try {
    const explanation = await questionStore.fetchExplanation(question.id)
    selectedExplanation.value = explanation
      ? {
          why_dangerous: explanation.why_dangerous,
          warning_signals: explanation.warning_signals,
          correct_action: explanation.correct_action,
        }
      : null
  } catch (e) {
    explanationDialogError.value = e instanceof Error ? e.message : '解説の取得に失敗しました。'
  }
}

async function saveExplanationDialog(payload: SaveQuestionExplanationPayload) {
  if (!selectedQuestion.value) return

  if (!payload.why_dangerous || !payload.correct_action) {
    explanationDialogError.value = selectedQuestion.value.is_phishing
      ? 'なぜ危険か、正しい対処法を入力してください。'
      : '安全と判断できる理由、安全な対応を入力してください。'
    return
  }

  try {
    await questionStore.saveExplanation(selectedQuestion.value.id, payload)
    explanationDialog.value = false
  } catch (e) {
    explanationDialogError.value = e instanceof Error ? e.message : '解説の保存に失敗しました。'
  }
}

function openDeleteDialog(question: MailListItem) {
  selectedQuestion.value = question
  deleteDialogError.value = null
  deleteDialog.value = true
}

function closeDeleteDialog() {
  deleteDialog.value = false
  deleteDialogError.value = null
}

async function confirmDeleteQuestion() {
  if (!selectedQuestion.value) return

  try {
    await questionStore.deleteQuestion(selectedQuestion.value.id)
    closeDeleteDialog()
  } catch (e) {
    deleteDialogError.value = e instanceof Error ? e.message : '問題の削除に失敗しました。'
  }
}

watch(
  () => questionStore.scenario,
  () => {
    void questionStore.fetchQuestions()
  },
  { immediate: true },
)
</script>

<style lang="css" scoped>
.question-list-page {
  min-height: 100vh;
  padding: 39px 26px 40px 30px;
  background: #172337;
  color: #ffffff;
}

.question-list-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 34px;
}

.question-list-hero__title {
  display: flex;
  align-items: flex-start;
  gap: 17px;
}

.question-list-hero__icon {
  color: #b34aff;
  font-size: 48px;
  margin-top: -2px;
}

.question-list-hero h1 {
  margin: 0;
  color: #ffffff;
  font-size: 40px;
  font-weight: 900;
  letter-spacing: 0;
  line-height: 1;
}

.question-list-hero p {
  margin: 9px 0 0;
  color: #98b3d6;
  font-size: 18px;
  font-weight: 500;
}

.scenario-field {
  position: relative;
  display: block;
  width: 240px;
  flex: 0 0 auto;
  margin-top: 16px;
}

.scenario-field select {
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
  font-weight: 900;
  outline: none;
}

.scenario-field select:disabled {
  cursor: default;
  opacity: 0.7;
}

.scenario-field select:focus-visible {
  border-color: #ad18f2;
  box-shadow: 0 0 0 3px rgba(173, 24, 242, 0.24);
}

.scenario-field__icon {
  position: absolute;
  top: 50%;
  right: 15px;
  color: #536681;
  font-size: 22px;
  pointer-events: none;
  transform: translateY(-50%);
}

.question-panel {
  width: 100%;
  max-width: 1038px;
  min-height: 522px;
  padding: 29px 30px 30px;
  border: 1px solid #31425e;
  border-radius: 17px;
  background: #1b2a40;
}

.question-panel__header h2 {
  margin: 0;
  color: #ffffff;
  font-size: 22px;
  font-weight: 900;
  letter-spacing: 0;
}

.question-panel__header p {
  margin: 10px 0 0;
  color: #9bb4d2;
  font-size: 18px;
  font-weight: 500;
}

.question-list,
.question-loading {
  display: grid;
  gap: 18px;
  margin-top: 32px;
}

.question-card {
  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 26px;
  min-height: 155px;
  padding: 22px 20px;
  border: 1px solid #506883;
  border-radius: 13px;
  background: linear-gradient(180deg, #2a3b54 0%, #25364d 100%);
  box-shadow: 0 12px 26px rgba(2, 8, 23, 0.2);
  cursor: pointer;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.question-card::before {
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  content: '';
}

.question-card:hover,
.question-card:focus-visible {
  border-color: rgba(179, 74, 255, 0.74);
  box-shadow: 0 16px 34px rgba(2, 8, 23, 0.28);
  outline: none;
  transform: translateY(-1px);
}

.question-card__main {
  min-width: 0;
}

.question-card__title-row {
  display: flex;
  min-width: 0;
  align-items: center;
  flex-wrap: wrap;
  gap: 9px;
}

.question-card h3 {
  margin: 0;
  color: #ffffff;
  font-size: 23px;
  font-weight: 900;
  letter-spacing: 0;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.mail-type-chip,
.difficulty-chip {
  display: inline-flex;
  height: 29px;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 900;
  line-height: 1;
  white-space: nowrap;
}

.mail-type-chip--danger {
  border: 1px solid #ff4057;
  color: #ff4057;
}

.mail-type-chip--safe {
  border: 1px solid #00e178;
  color: #00e178;
}

.difficulty-chip--easy {
  border: 1px solid #00d77c;
  color: #00e178;
}

.difficulty-chip--medium {
  border: 1px solid #ffd000;
  color: #ffd000;
}

.question-card__sender {
  margin: 16px 0 0;
  color: #9bb4d2;
  font-size: 16px;
  font-weight: 500;
  overflow-wrap: anywhere;
}

.question-card__body {
  display: -webkit-box;
  margin: 12px 0 0;
  color: #ffffff;
  font-size: 17px;
  font-weight: 500;
  line-height: 1.42;
  overflow: hidden;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.question-card__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  min-height: 21px;
  margin-top: 12px;
  color: #64a3ff;
  font-size: 14px;
  font-weight: 800;
}

.question-card__meta span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.question-card__meta :deep(.v-icon) {
  color: #c7c3df;
  font-size: 17px;
}

.question-card__actions {
  display: flex;
  align-self: stretch;
  align-items: flex-start;
  gap: 12px;
  padding-top: 0;
  padding-left: 22px;
  border-left: 1px solid rgba(155, 180, 210, 0.16);
}

.action-button {
  display: inline-flex;
  height: 40px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 13px;
  border-radius: 8px;
  background: #ffffff;
  cursor: pointer;
  font: inherit;
  font-size: 16px;
  font-weight: 900;
  line-height: 1;
  white-space: nowrap;
  transition:
    filter 160ms ease,
    transform 160ms ease,
    opacity 160ms ease;
}

.action-button:hover:not(:disabled) {
  filter: brightness(1.04);
  transform: translateY(-1px);
}

.action-button:disabled {
  cursor: default;
  opacity: 0.62;
  transform: none;
}

.action-button :deep(.v-icon) {
  font-size: 21px;
}

.action-button--edit {
  border: 1px solid #5aa2ff;
  color: #4d9dff;
}

.action-button--delete {
  border: 1px solid #ff4057;
  color: #ff4057;
}

.question-card-skeleton {
  min-height: 155px;
  border: 1px solid #465a77;
  border-radius: 11px;
  background:
    linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.07) 50%, transparent 100%),
    #26364d;
  background-size: 220px 100%, 100% 100%;
  animation: shimmer 1.2s infinite linear;
}

.panel-message {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 32px;
  padding: 14px 16px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 700;
}

.panel-message--error {
  border: 1px solid rgba(255, 92, 112, 0.42);
  background: rgba(255, 92, 112, 0.12);
  color: #ffd4dc;
}

.panel-message button {
  flex: 0 0 auto;
  border: 0;
  border-radius: 8px;
  background: #ffffff;
  color: #ff4057;
  cursor: pointer;
  font: inherit;
  font-size: 14px;
  font-weight: 900;
  padding: 8px 12px;
}

.empty-state {
  display: flex;
  min-height: 320px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 20px;
  color: #9bb4d2;
  text-align: center;
}

.empty-state__icon {
  color: #536681;
  font-size: 72px;
}

.empty-state p {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.help-button {
  position: fixed;
  right: 15px;
  bottom: 14px;
  display: inline-flex;
  width: 41px;
  height: 41px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  background: #ffffff;
  color: #111827;
  cursor: pointer;
  font-size: 27px;
  line-height: 1;
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

@keyframes shimmer {
  from {
    background-position: -220px 0, 0 0;
  }

  to {
    background-position: calc(100% + 220px) 0, 0 0;
  }
}

@media (max-width: 980px) {
  .question-list-page {
    padding: 28px 18px 36px;
  }

  .question-list-hero {
    align-items: stretch;
    flex-direction: column;
  }

  .question-list-hero h1 {
    font-size: 34px;
  }

  .scenario-field {
    width: 100%;
    margin-top: 0;
  }

  .question-panel {
    min-height: 420px;
    padding: 24px 20px;
  }

  .question-card {
    grid-template-columns: 1fr;
  }

  .question-card__actions {
    justify-content: flex-start;
    padding-top: 18px;
    padding-left: 0;
    border-top: 1px solid rgba(155, 180, 210, 0.16);
    border-left: 0;
  }
}

@media (max-width: 620px) {
  .question-card__actions {
    align-items: stretch;
    flex-direction: column;
  }

  .action-button {
    width: 100%;
  }
}
</style>
