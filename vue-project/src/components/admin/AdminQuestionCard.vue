<template>
    <v-card class="question-card" variant="outlined">
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
                            <v-chip v-if="question.has_link" color="warning" size="small" variant="tonal">
                                リンクあり
                            </v-chip>
                            <v-chip v-if="question.has_attachment" color="info" size="small" variant="tonal">
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
                                    :disabled="busy"
                                    @click="$emit('edit-question', question)"
                                />
                            </template>
                        </v-tooltip>

                        <v-tooltip v-if="showExplanationAction" text="解説編集" location="top">
                            <template #activator="{ props }">
                                <v-btn
                                    v-bind="props"
                                    icon="mdi-text-box-edit-outline"
                                    color="secondary"
                                    variant="tonal"
                                    size="small"
                                    aria-label="解説編集"
                                    :disabled="busy"
                                    @click="$emit('edit-explanation', question)"
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
                                    :loading="deleteLoading"
                                    :disabled="busy"
                                    @click="$emit('delete', question)"
                                />
                            </template>
                        </v-tooltip>
                    </div>
                </v-col>
            </v-row>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
export type AdminQuestionCardItem = {
    id: string
    title: string
    sender_name: string
    sender_email: string
    body: string
    is_phishing: boolean
    phishing_type: string | null
    has_link: boolean
    has_attachment: boolean
}

defineProps<{
    question: AdminQuestionCardItem
    busy?: boolean
    deleteLoading?: boolean
    showExplanationAction?: boolean
}>()

defineEmits<{
    'edit-question': [question: AdminQuestionCardItem]
    'edit-explanation': [question: AdminQuestionCardItem]
    delete: [question: AdminQuestionCardItem]
}>()

function previewBody(body: string): string {
    return body.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}
</script>

<style scoped>
.question-card {
    border-color: rgba(var(--v-border-color), 0.12);
}

.question-heading,
.question-title,
.question-tags {
    min-width: 0;
}

.question-title,
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
</style>
