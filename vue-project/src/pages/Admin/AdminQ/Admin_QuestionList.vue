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
                        <v-col cols="12" md="10">
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

                        <v-col cols="12" md="2">
                            <div class="question-actions d-flex justify-start justify-md-end ga-2">
                                <v-tooltip text="編集" location="top">
                                    <template #activator="{ props }">
                                        <v-btn
                                            v-bind="props"
                                            icon="mdi-pencil-outline"
                                            color="primary"
                                            variant="tonal"
                                            size="small"
                                            aria-label="編集"
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
                                        />
                                    </template>
                                </v-tooltip>
                            </div>
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-card>
        </div>
    </v-sheet>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import {
    question_scenario,
    scenarioSelectItems,
} from '@/stores/admin_questionList'

const questionStore = question_scenario()

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

.subtitle {
    opacity: 50%;
}
</style>
