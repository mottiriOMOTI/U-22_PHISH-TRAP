<template>
    <v-sheet class="pa-4" rounded="lg" elevation="0" border>
        <div>
            <h3>{{ questionListTitle }}</h3>
            <p class="subtitle">{{ questionStore.questionListSubtitle }}</p>
        </div>

        <div v-if="questionStore.loading" class="pa-4">
            <v-skeleton-loader v-for="n in 3" :key="n" type="article" class="mb-3" />
        </div>

        <v-alert v-else-if="questionStore.error" type="error" variant="tonal" class="ma-4">
            {{ questionStore.error }}
            <template #append>
                <v-btn size="small" variant="text" @click="questionStore.fetchQuestions()">
                    再試行
                </v-btn>
            </template>
        </v-alert>

        <v-alert v-else-if="questionStore.questions.length === 0" type="info" variant="tonal" class="ma-4">
            登録されている問題はありません。
        </v-alert>

        <div v-else class="question-list pa-4">
            <AdminQuestionCard
                v-for="question in questionStore.questions"
                :key="question.id"
                :question="question"
                :busy="questionStore.saving || questionStore.explanationLoading || questionStore.explanationSaving"
                :delete-loading="questionStore.deletingId === question.id"
                show-explanation-action
                @edit-question="openQuestionDialog"
                @edit-explanation="openExplanationDialog"
                @delete="openDeleteDialog"
            />
        </div>

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
    </v-sheet>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AdminExplanationEditDialog from '@/components/admin/AdminExplanationEditDialog.vue'
import AdminQuestionCard from '@/components/admin/AdminQuestionCard.vue'
import AdminQuestionEditDialog from '@/components/admin/AdminQuestionEditDialog.vue'
import type { MailListItem, SaveQuestionExplanationPayload, UpdateMailPayload } from '@/api/mailApi'
import {
    question_scenario,
    scenarioSelectItems,
} from '@/stores/admin_questionList'

const questionStore = question_scenario()

const selectedQuestion = ref<MailListItem | null>(null)
const selectedExplanation = ref<SaveQuestionExplanationPayload | null>(null)
const questionDialog = ref(false)
const explanationDialog = ref(false)
const deleteDialog = ref(false)
const questionDialogError = ref<string | null>(null)
const explanationDialogError = ref<string | null>(null)
const deleteDialogError = ref<string | null>(null)

const questionListTitle = computed(() => {
    const selectedScenario = scenarioSelectItems.find(
        (item) => item.value === questionStore.scenario,
    )

    return `${selectedScenario?.title ?? ''}の問題一覧`
})

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
        explanationDialogError.value = '危険な理由と正しい対処法を入力してください。'
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
.question-list {
    display: grid;
    gap: 12px;
}

.subtitle {
    opacity: 50%;
}
</style>
