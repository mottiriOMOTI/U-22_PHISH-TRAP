<template>
    <v-sheet class="pa-4" rounded="lg" elevation="0" border>
        <div class="page-heading">
            <h3>問題生成</h3>
            <p class="subtitle">カテゴリを選択して10問の訓練メールを生成します。</p>
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

        <v-card v-if="result" class="result-card mt-4" variant="outlined">
            <v-card-title class="result-title">
                <v-icon icon="mdi-text-box-search-outline" color="primary" />
                <span>{{ result.title }}</span>
            </v-card-title>

            <v-card-text>
                <section class="result-section">
                    <h4>なぜ危険か</h4>
                    <p>{{ result.why_dangerous }}</p>
                </section>

                <section class="result-section">
                    <h4>警告サイン</h4>
                    <v-list density="compact" class="result-list">
                        <v-list-item
                            v-for="(signal, index) in result.warning_signals"
                            :key="index"
                            :title="signal"
                        >
                            <template #prepend>
                                <v-icon icon="mdi-alert-circle-outline" color="warning" />
                            </template>
                        </v-list-item>
                    </v-list>
                </section>

                <section class="result-section">
                    <h4>正しい対処法</h4>
                    <p>{{ result.correct_action }}</p>
                </section>
            </v-card-text>
        </v-card>
    </v-sheet>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AdminScenarioSelect from '@/components/layout/adminHeader/AdminScenarioSelect.vue'
import {
    generateQuestionExplanation,
    type GeneratedQuestionExplanation,
} from '@/api/question_generate'
import {
    question_scenario,
    scenarioSelectItems,
} from '@/stores/admin_questionList'

const questionStore = question_scenario()

const loading = ref(false)
const error = ref<string | null>(null)
const result = ref<GeneratedQuestionExplanation | null>(null)

const selectedScenarioTitle = computed(() => {
    const selected = scenarioSelectItems.find(
        (item) => item.value === questionStore.scenario,
    )
    return selected?.title ?? ''
})

async function generate() {
    loading.value = true
    error.value = null
    result.value = null

    try {
        result.value = await generateQuestionExplanation({
            questionText: selectedScenarioTitle.value,
        })
    } catch (e) {
        error.value = e instanceof Error ? e.message : '生成に失敗しました。'
    } finally {
        loading.value = false
    }
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

.result-card {
    border-color: rgba(var(--v-border-color), 0.12);
    border-radius: 8px;
}

.result-title {
    display: flex;
    align-items: center;
    gap: 8px;
}

.result-section + .result-section {
    margin-top: 20px;
}

.result-section h4 {
    margin-bottom: 8px;
}

.result-section p {
    line-height: 1.7;
    margin-bottom: 0;
    overflow-wrap: anywhere;
}

.result-list {
    background: transparent;
}

@media (max-width: 600px) {
    .generate-actions {
        align-items: stretch;
        flex-direction: column;
    }
}
</style>
