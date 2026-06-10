<template>
    <v-sheet class="pa-4" rounded="lg" elevation="0" border>
        <div class="page-heading">
            <h3>問題生成</h3>
            <p class="subtitle">カテゴリを選択して1問の訓練メールを生成します。</p>
        </div>

        <div class="generate-actions mt-3">
            <AdminScenarioSelect />
            <v-btn
                color="primary"
                prepend-icon="mdi-auto-fix"
                :loading="loading"
                :disabled="loading"
                @click="generate"
            >
                生成する
            </v-btn>
        </div>

        <v-alert v-if="error" type="error" variant="tonal" class="mt-4">
            {{ error }}
        </v-alert>

        <div v-if="generatedQuestions.length > 0" class="generated-list mt-4">
            <div class="d-flex align-center">
                <h4 class="mb-0">生成結果</h4>
                <v-spacer />
                <span class="text-caption text-medium-emphasis">
                    {{ generatedQuestions.length }}件
                </span>
            </div>

            <AdminQuestionCard
                v-for="question in generatedQuestions"
                :key="question.id"
                :question="question"
                show-explanation-action
                @edit-question="openQuestionDialog"
                @edit-explanation="openExplanationDialog"
                @delete="deleteGeneratedQuestion"
            />
        </div>

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
            :saving="false"
            :error="explanationDialogError"
            @save="saveExplanationDialog"
        />
    </v-sheet>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AdminExplanationEditDialog from '@/components/admin/AdminExplanationEditDialog.vue'
import AdminQuestionCard from '@/components/admin/AdminQuestionCard.vue'
import AdminQuestionEditDialog from '@/components/admin/AdminQuestionEditDialog.vue'
import AdminScenarioSelect from '@/components/layout/adminHeader/AdminScenarioSelect.vue'
import type { SaveQuestionExplanationPayload, UpdateMailPayload } from '@/api/mailApi'
import {
    generateQuestionExplanation,
    type GenerateCategory,
    type GeneratedQuestion,
} from '@/api/question_generate'
import {
    question_scenario,
    type Scenario,
} from '@/stores/admin_questionList'

type EditableGeneratedQuestion = GeneratedQuestion & { id: string }

const scenarioToCategory: Record<Scenario, GenerateCategory> = {
    school: 'student',
    business: 'company',
    daily: 'general',
}

const questionStore = question_scenario()

const loading = ref(false)
const error = ref<string | null>(null)
const generatedQuestions = ref<EditableGeneratedQuestion[]>([])
const selectedQuestion = ref<EditableGeneratedQuestion | null>(null)
const questionDialog = ref(false)
const explanationDialog = ref(false)
const questionDialogError = ref<string | null>(null)
const explanationDialogError = ref<string | null>(null)

const selectedCategory = computed(() => scenarioToCategory[questionStore.scenario])

async function generate() {
    loading.value = true
    error.value = null
    generatedQuestions.value = []

    try {
        const result = await generateQuestionExplanation({
            category: selectedCategory.value,
            count: 1,
        })
        generatedQuestions.value = result.questions.map((question, index) => ({
            ...question,
            id: `generated-${Date.now()}-${index}`,
        }))
    } catch (e) {
        error.value = e instanceof Error ? e.message : '生成に失敗しました。'
    } finally {
        loading.value = false
    }
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

    updateGeneratedQuestion(selectedQuestion.value.id, {
        ...selectedQuestion.value,
        ...payload,
    })
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
        explanationDialogError.value = '危険な理由と正しい対処法を入力してください。'
        return
    }

    updateGeneratedQuestion(selectedQuestion.value.id, {
        ...selectedQuestion.value,
        explanation: payload,
    })
    explanationDialog.value = false
}

function deleteGeneratedQuestion(question: EditableGeneratedQuestion) {
    generatedQuestions.value = generatedQuestions.value.filter((item) => item.id !== question.id)
}

function updateGeneratedQuestion(id: string, nextQuestion: EditableGeneratedQuestion) {
    const index = generatedQuestions.value.findIndex((question) => question.id === id)
    if (index === -1) return
    generatedQuestions.value[index] = nextQuestion
    selectedQuestion.value = nextQuestion
}
</script>

<style lang="css" scoped>
.page-heading {
    min-width: 0;
}

.subtitle {
    opacity: 50%;
}

.generate-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    max-width: 520px;
}

.generated-list {
    display: grid;
    gap: 12px;
}

@media (max-width: 600px) {
    .generate-actions {
        align-items: stretch;
        flex-direction: column;
    }
}
</style>
