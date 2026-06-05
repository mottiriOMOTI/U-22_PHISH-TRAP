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
            <v-card
                v-for="question in questionStore.questions"
                :key="question.id"
                class="question-card"
                variant="outlined"
            >
                <v-card-text class="pa-4">
                    <v-row align="start">
                        <v-col cols="12" md="9">
                            <div class="question-heading d-flex align-center flex-wrap ga-2 mb-2">
                                <div class="question-title text-subtitle-1 font-weight-medium">
                                    {{ question.title }}
                                </div>

                                <div class="question-tags d-flex align-center flex-wrap ga-1">
                                    <v-chip
                                        :color="question.is_phishing ? 'error' : 'success'"
                                        size="small"
                                        variant="tonal"
                                    >
                                        {{ question.is_phishing ? '詐欺メール' : '安全メール' }}
                                    </v-chip>
                                    <v-chip
                                        v-if="question.has_link"
                                        color="warning"
                                        size="small"
                                        variant="tonal"
                                    >
                                        リンクあり
                                    </v-chip>
                                    <v-chip
                                        v-if="question.has_attachment"
                                        color="info"
                                        size="small"
                                        variant="tonal"
                                    >
                                        添付あり
                                    </v-chip>
                                </div>
                            </div>

                            <div class="question-sender text-body-2 text-medium-emphasis mb-2">
                                差出人：{{ question.sender_name }}, {{ question.sender_email }}
                            </div>

                            <p class="question-preview mb-0">
                                {{ previewBody(question.body) }}
                            </p>
                        </v-col>

                        <v-col cols="12" md="3">
                            <div class="question-actions d-flex justify-start justify-md-end ga-2">
                                <v-tooltip text="問題編集" location="top">
                                    <template #activator="{ props }">
                                        <v-btn
                                            v-bind="props"
                                            icon="mdi-pencil-outline"
                                            color="primary"
                                            variant="tonal"
                                            size="small"
                                            aria-label="問題編集"
                                            :disabled="questionStore.saving"
                                            @click="openQuestionDialog(question)"
                                        />
                                    </template>
                                </v-tooltip>

                                <v-tooltip text="解説編集" location="top">
                                    <template #activator="{ props }">
                                        <v-btn
                                            v-bind="props"
                                            icon="mdi-text-box-edit-outline"
                                            color="secondary"
                                            variant="tonal"
                                            size="small"
                                            aria-label="解説編集"
                                            :disabled="questionStore.explanationLoading || questionStore.explanationSaving"
                                            @click="openExplanationDialog(question)"
                                        />
                                    </template>
                                </v-tooltip>

                                <v-tooltip text="削除" location="top">
                                    <template #activator="{ props }">
                                        <v-btn
                                            v-bind="props"
                                            icon="mdi-delete-outline"
                                            color="error"
                                            variant="tonal"
                                            size="small"
                                            aria-label="削除"
                                            :loading="questionStore.deletingId === question.id"
                                            :disabled="questionStore.deletingId !== null"
                                            @click="openDeleteDialog(question)"
                                        />
                                    </template>
                                </v-tooltip>
                            </div>
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-card>
        </div>

        <v-dialog v-model="questionDialog" max-width="860">
            <v-card class="edit-dialog">
                <v-card-title class="dialog-header d-flex align-center">
                    <div>
                        <div class="text-h6">問題編集</div>
                        <div class="text-caption text-medium-emphasis">
                            メール本文と判定情報を編集します
                        </div>
                    </div>
                    <v-spacer />
                    <v-btn icon="mdi-close" variant="text" aria-label="閉じる" @click="closeQuestionDialog" />
                </v-card-title>

                <v-divider />

                <v-card-text>
                    <v-alert v-if="questionDialogError" type="error" variant="tonal" class="mb-4">
                        {{ questionDialogError }}
                    </v-alert>

                    <v-row>
                        <v-col cols="12">
                            <v-text-field v-model="questionForm.title" label="メールタイトル" variant="outlined" />
                        </v-col>
                        <v-col cols="12" md="6">
                            <v-text-field v-model="questionForm.sender_name" label="差出人名" variant="outlined" />
                        </v-col>
                        <v-col cols="12" md="6">
                            <v-text-field v-model="questionForm.sender_email" label="差出人メール" variant="outlined" />
                        </v-col>
                        <v-col cols="12">
                            <v-textarea
                                v-model="questionForm.body"
                                label="本文"
                                variant="outlined"
                                rows="8"
                                auto-grow
                            />
                        </v-col>
                        <v-col cols="12" md="4">
                            <v-switch
                                v-model="questionForm.is_phishing"
                                color="error"
                                label="詐欺メール"
                                hide-details
                            />
                        </v-col>
                        <v-col cols="12" md="4">
                            <v-switch v-model="questionForm.has_link" color="warning" label="リンクあり" hide-details />
                        </v-col>
                        <v-col cols="12" md="4">
                            <v-switch
                                v-model="questionForm.has_attachment"
                                color="info"
                                label="添付あり"
                                hide-details
                            />
                        </v-col>
                        <v-col cols="12">
                            <!--詐欺タイプ選べない状態なので、話し合ってタイプを決めよう-->
                            <v-text-field
                                v-model="questionForm.phishing_type"
                                label="詐欺タイプ"
                                variant="outlined"
                                :disabled="!questionForm.is_phishing"
                            />
                        </v-col>
                    </v-row>
                </v-card-text>

                <v-divider />

                <v-card-actions class="pa-4">
                    <v-spacer />
                    <v-btn variant="text" @click="closeQuestionDialog">キャンセル</v-btn>
                    <v-btn color="primary" :loading="questionStore.saving" @click="saveQuestionDialog">
                        保存
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="explanationDialog" max-width="860">
            <v-card class="edit-dialog">
                <v-card-title class="dialog-header d-flex align-center">
                    <div>
                        <div class="text-h6">解説編集</div>
                        <div class="text-caption text-medium-emphasis">
                            危険な理由、警告サイン、正しい対処法を編集します
                        </div>
                    </div>
                    <v-spacer />
                    <v-btn icon="mdi-close" variant="text" aria-label="閉じる" @click="closeExplanationDialog" />
                </v-card-title>

                <v-divider />

                <v-card-text>
                    <v-skeleton-loader v-if="questionStore.explanationLoading" type="article" />

                    <template v-else>
                        <v-alert v-if="explanationDialogError" type="error" variant="tonal" class="mb-4">
                            {{ explanationDialogError }}
                        </v-alert>

                        <v-textarea
                            v-model="explanationForm.why_dangerous"
                            label="なぜ危険か"
                            variant="outlined"
                            rows="4"
                            auto-grow
                            class="mb-4"
                        />

                        <div class="d-flex align-center mb-2">
                            <div class="text-subtitle-2">警告サイン</div>
                            <v-spacer />
                            <v-btn
                                size="small"
                                variant="tonal"
                                prepend-icon="mdi-plus"
                                @click="addWarningSignal"
                            >
                                追加
                            </v-btn>
                        </div>

                        <div class="warning-signal-list mb-4">
                            <div
                                v-for="(_, index) in explanationForm.warning_signals"
                                :key="index"
                                class="warning-signal-row"
                            >
                                <v-text-field
                                    v-model="explanationForm.warning_signals[index]"
                                    :label="`警告サイン ${index + 1}`"
                                    variant="outlined"
                                    hide-details
                                />
                                <v-btn
                                    icon="mdi-close"
                                    variant="text"
                                    color="error"
                                    aria-label="警告サインを削除"
                                    :disabled="explanationForm.warning_signals.length === 1"
                                    @click="removeWarningSignal(index)"
                                />
                            </div>
                        </div>

                        <v-textarea
                            v-model="explanationForm.correct_action"
                            label="正しい対処法"
                            variant="outlined"
                            rows="4"
                            auto-grow
                        />
                    </template>
                </v-card-text>

                <v-divider />

                <v-card-actions class="pa-4">
                    <v-spacer />
                    <v-btn variant="text" @click="closeExplanationDialog">キャンセル</v-btn>
                    <v-btn
                        color="primary"
                        :loading="questionStore.explanationSaving"
                        :disabled="questionStore.explanationLoading"
                        @click="saveExplanationDialog"
                    >
                        保存
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

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
import { computed, reactive, ref, watch } from 'vue'
import type { MailListItem, SaveQuestionExplanationPayload, UpdateMailPayload } from '@/api/mailApi'
import {
    question_scenario,
    scenarioSelectItems,
} from '@/stores/admin_questionList'

const questionStore = question_scenario()

const selectedQuestion = ref<MailListItem | null>(null)
const questionDialog = ref(false)
const explanationDialog = ref(false)
const deleteDialog = ref(false)
const questionDialogError = ref<string | null>(null)
const explanationDialogError = ref<string | null>(null)
const deleteDialogError = ref<string | null>(null)

const questionForm = reactive<UpdateMailPayload>({
    title: '',
    sender_name: '',
    sender_email: '',
    body: '',
    is_phishing: false,
    phishing_type: null,
    has_link: false,
    has_attachment: false,
})

const explanationForm = reactive<SaveQuestionExplanationPayload>({
    why_dangerous: '',
    warning_signals: [''],
    correct_action: '',
})

const questionListTitle = computed(() => {
    const selectedScenario = scenarioSelectItems.find(
        (item) => item.value === questionStore.scenario,
    )

    return `${selectedScenario?.title ?? ''}の問題一覧`
})

function previewBody(body: string): string {
    const plain = body.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    return plain
}

function openQuestionDialog(question: MailListItem) {
    selectedQuestion.value = question
    questionDialogError.value = null
    Object.assign(questionForm, {
        title: question.title,
        sender_name: question.sender_name,
        sender_email: question.sender_email,
        body: question.body,
        is_phishing: question.is_phishing,
        phishing_type: question.phishing_type,
        has_link: question.has_link,
        has_attachment: question.has_attachment,
    })
    questionDialog.value = true
}

function closeQuestionDialog() {
    questionDialog.value = false
    questionDialogError.value = null
}

async function saveQuestionDialog() {
    if (!selectedQuestion.value) return

    if (!questionForm.title.trim() || !questionForm.sender_name.trim() || !questionForm.sender_email.trim() || !questionForm.body.trim()) {
        questionDialogError.value = 'タイトル、差出人、メールアドレス、本文を入力してください。'
        return
    }

    try {
        await questionStore.updateQuestion(selectedQuestion.value.id, {
            ...questionForm,
            title: questionForm.title.trim(),
            sender_name: questionForm.sender_name.trim(),
            sender_email: questionForm.sender_email.trim(),
            body: questionForm.body.trim(),
            phishing_type: questionForm.is_phishing ? questionForm.phishing_type?.trim() || null : null,
        })
        closeQuestionDialog()
    } catch (e) {
        questionDialogError.value = e instanceof Error ? e.message : '問題の保存に失敗しました。'
    }
}

async function openExplanationDialog(question: MailListItem) {
    selectedQuestion.value = question
    explanationDialog.value = true
    explanationDialogError.value = null
    Object.assign(explanationForm, {
        why_dangerous: '',
        warning_signals: [''],
        correct_action: '',
    })

    try {
        const explanation = await questionStore.fetchExplanation(question.id)
        if (explanation) {
            Object.assign(explanationForm, {
                why_dangerous: explanation.why_dangerous,
                warning_signals: explanation.warning_signals.length > 0 ? [...explanation.warning_signals] : [''],
                correct_action: explanation.correct_action,
            })
        }
    } catch (e) {
        explanationDialogError.value = e instanceof Error ? e.message : '解説の取得に失敗しました。'
    }
}

function closeExplanationDialog() {
    explanationDialog.value = false
    explanationDialogError.value = null
}

function addWarningSignal() {
    explanationForm.warning_signals.push('')
}

function removeWarningSignal(index: number) {
    if (explanationForm.warning_signals.length === 1) return
    explanationForm.warning_signals.splice(index, 1)
}

async function saveExplanationDialog() {
    if (!selectedQuestion.value) return

    const warningSignals = explanationForm.warning_signals
        .map((signal) => signal.trim())
        .filter((signal) => signal.length > 0)

    if (!explanationForm.why_dangerous.trim() || !explanationForm.correct_action.trim()) {
        explanationDialogError.value = '危険な理由と正しい対処法を入力してください。'
        return
    }

    try {
        await questionStore.saveExplanation(selectedQuestion.value.id, {
            why_dangerous: explanationForm.why_dangerous.trim(),
            warning_signals: warningSignals,
            correct_action: explanationForm.correct_action.trim(),
        })
        closeExplanationDialog()
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
.question-card {
    border-color: rgba(var(--v-border-color), 0.12);
}

.question-list {
    display: grid;
    gap: 12px;
}

.question-heading {
    min-width: 0;
}

.question-title {
    min-width: 0;
    overflow-wrap: anywhere;
}

.question-tags {
    min-width: 0;
}

.question-sender {
    overflow-wrap: anywhere;
}

.question-preview {
    display: -webkit-box;
    min-height: 3.2em;
    max-height: 3.2em;
    line-height: 1.6;
    overflow: hidden;
    word-break: break-word;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
}

.question-actions {
    min-height: 40px;
}

.edit-dialog {
    border-radius: 8px;
}

.dialog-header {
    min-height: 72px;
}

.warning-signal-list {
    display: grid;
    gap: 10px;
}

.warning-signal-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 40px;
    gap: 8px;
    align-items: center;
}

.subtitle {
    opacity: 50%;
}
</style>
