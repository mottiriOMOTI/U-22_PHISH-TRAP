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
            <v-card v-for="question in questionStore.questions" :key="question.id" class="question-card"
                variant="outlined">
                <v-card-title class="text-subtitle-1">
                    {{ question.title }}
                </v-card-title>

                <v-card-subtitle>
                    {{ question.sender_name }} &lt;{{ question.sender_email }}&gt;
                </v-card-subtitle>

                <v-card-text>
                    <p class="question-preview mb-3">
                        {{ previewBody(question.body) }}
                    </p>

                    <div class="d-flex align-center flex-wrap ga-2">
                        <v-chip :color="question.is_phishing ? 'error' : 'success'" size="small" variant="tonal">
                            {{ question.is_phishing ? 'フィッシング' : '安全' }}
                        </v-chip>
                        <v-chip v-if="question.has_link" color="warning" size="small" variant="tonal">
                            リンクあり
                        </v-chip>
                        <v-chip v-if="question.has_attachment" color="info" size="small" variant="tonal">
                            添付あり
                        </v-chip>
                        <v-spacer />
                        <span class="text-caption text-medium-emphasis">
                            {{ formatDate(question.created_at) }}
                        </span>
                    </div>
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
    return plain.length > 80 ? `${plain.slice(0, 80)}...` : plain
}

function formatDate(iso: string): string {
    const date = new Date(iso)
    return date.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    })
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

.question-preview {
    line-height: 1.6;
    word-break: break-word;
}

.subtitle {
    opacity: 50%;
}
</style>
