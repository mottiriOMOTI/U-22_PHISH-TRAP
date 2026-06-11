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
                :disabled="loading || saving"
                @click="generate"
            >
                生成する
            </v-btn>
        </div>

        <v-alert v-if="error" type="error" variant="tonal" class="mt-4">
            {{ error }}
        </v-alert>

        <v-alert v-if="saveError" type="error" variant="tonal" class="mt-4">
            {{ saveError }}
        </v-alert>

        <v-alert v-if="saveMessage" type="success" variant="tonal" class="mt-4">
            {{ saveMessage }}
        </v-alert>

        <div v-if="generatedQuestions.length > 0" class="generated-list mt-4">
            <div class="generated-header">
                <div>
                    <h4 class="mb-0">生成結果</h4>
                    <span class="text-caption text-medium-emphasis">
                        {{ generatedQuestions.length }}件
                    </span>
                </div>

                <v-btn
                    color="success"
                    prepend-icon="mdi-content-save-outline"
                    variant="tonal"
                    :loading="saving"
                    :disabled="saving || unsavedQuestions.length === 0"
                    @click="saveGeneratedQuestions"
                >
                    Supabaseに保存
                </v-btn>
            </div>

            <AdminQuestionCard
                v-for="question in generatedQuestions"
                :key="question.id"
                :question="question"
                :busy="saving"
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
    saveGeneratedQuestion,
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
const saving = ref(false)
const error = ref<string | null>(null)
const saveError = ref<string | null>(null)
const saveMessage = ref<string | null>(null)
const generatedQuestions = ref<EditableGeneratedQuestion[]>([])
const savedQuestionIds = ref<Set<string>>(new Set())
const selectedQuestion = ref<EditableGeneratedQuestion | null>(null)
const questionDialog = ref(false)
const explanationDialog = ref(false)
const questionDialogError = ref<string | null>(null)
const explanationDialogError = ref<string | null>(null)

const selectedCategory = computed(() => scenarioToCategory[questionStore.scenario])
const unsavedQuestions = computed(() =>
    generatedQuestions.value.filter((question) => !savedQuestionIds.value.has(question.id)),
)

async function generate() {
    loading.value = true
    error.value = null
    saveError.value = null
    saveMessage.value = null
    generatedQuestions.value = []
    savedQuestionIds.value = new Set()

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

async function saveGeneratedQuestions() {
    if (unsavedQuestions.value.length === 0) return

    saving.value = true
    saveError.value = null
    saveMessage.value = null

    try {
        for (const question of unsavedQuestions.value) {
            await saveGeneratedQuestion(question)
            savedQuestionIds.value = new Set([...savedQuestionIds.value, question.id])
        }
        saveMessage.value = '生成した問題をSupabaseに保存しました。'
    } catch (e) {
        saveError.value = e instanceof Error ? e.message : 'Supabaseへの保存に失敗しました。'
    } finally {
        saving.value = false
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
        explanationDialogError.value = 'なぜ危険か、正しい対処法を入力してください。'
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
    savedQuestionIds.value = new Set(
        [...savedQuestionIds.value].filter((savedId) => savedId !== question.id),
    )
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

.generate-actions,
.generated-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
}

.generate-actions {
    max-width: 520px;
}

.generated-list {
    display: grid;
    gap: 12px;
}

@media (max-width: 600px) {
    .generate-actions,
    .generated-header {
        align-items: stretch;
        flex-direction: column;
    }
}
</style>
