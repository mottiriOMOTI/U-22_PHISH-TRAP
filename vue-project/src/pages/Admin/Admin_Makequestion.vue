<template>
    <v-sheet class="pa-4" rounded="lg" elevation="0" border>
        <div class="page-heading">
            <h3>問題生成</h3>
            <p class="subtitle">カテゴリとメール種別を選択して1問の訓練メールを生成します。</p>
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
            <v-switch
                v-model="isPhishing"
                class="phishing-toggle"
                color="error"
                density="compact"
                hide-details
                inset
                label="詐欺メール生成"
                :disabled="loading || saving"
            />
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

        <div v-if="generatedStore.questions.length > 0" class="generated-list mt-4">
            <div class="generated-header">
                <div>
                    <h4 class="mb-0">生成結果</h4>
                    <span class="text-caption text-medium-emphasis">
                        {{ generatedStore.questions.length }}件
                    </span>
                </div>

                <v-btn
                    color="success"
                    prepend-icon="mdi-content-save-outline"
                    variant="tonal"
                    :loading="saving"
                    :disabled="saving || generatedStore.unsavedQuestions.length === 0"
                    @click="saveGeneratedQuestions"
                >
                    Supabaseに保存
                </v-btn>
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
    </v-sheet>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AdminExplanationEditDialog from '@/components/admin/AdminExplanationEditDialog.vue'
import AdminQuestionCard from '@/components/admin/AdminQuestionCard.vue'
import AdminQuestionEditDialog from '@/components/admin/AdminQuestionEditDialog.vue'
import AdminScenarioSelect from '@/components/layout/adminHeader/AdminScenarioSelect.vue'
import type { SaveQuestionExplanationPayload, UpdateMailPayload } from '@/api/mailApi'
import {
    generateQuestionExplanation,
    saveGeneratedQuestion,
    type GenerateCategory,
} from '@/api/question_generate'
import {
    question_scenario,
    type Scenario,
} from '@/stores/admin_questionList'
import {
    useAdminGeneratedQuestions,
    type EditableGeneratedQuestion,
} from '@/stores/admin_generatedQuestions'

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
const error = ref<string | null>(null)
const saveError = ref<string | null>(null)
const saveMessage = ref<string | null>(null)
const selectedQuestion = ref<EditableGeneratedQuestion | null>(null)
const questionDialog = ref(false)
const explanationDialog = ref(false)
const questionDialogError = ref<string | null>(null)
const explanationDialogError = ref<string | null>(null)

const selectedCategory = computed(() => scenarioToCategory[questionStore.scenario])

async function generate() {
    loading.value = true
    error.value = null
    saveError.value = null
    saveMessage.value = null

    try {
        const result = await generateQuestionExplanation({
            category: selectedCategory.value,
            count: 1,
            isPhishing: isPhishing.value,
        })
        generatedStore.replaceQuestions(result.questions)
    } catch (e) {
        error.value = e instanceof Error ? e.message : '生成に失敗しました。'
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
    gap: 16px;
}

.generate-actions {
    flex-wrap: wrap;
}

.phishing-toggle {
    flex: 0 0 auto;
}

.generated-header {
    justify-content: space-between;
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
