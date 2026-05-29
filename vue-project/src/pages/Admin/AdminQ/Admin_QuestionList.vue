<template>
    <v-card class="question-card ma-n6" variant="outlined" :title="questionListTitle" subtitle="いい">
        <!-- ここにv-forで問題ごとにカードを入れる -->
        <v-for></v-for>
    </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
    question_scenario,
    scenarioSelectItems,
} from '@/stores/admin_auestionList'

const scenarioStore = question_scenario()

const questionListTitle = computed(() => {
    const selectedScenario = scenarioSelectItems.find(
        (item) => item.value === scenarioStore.scenario,
    )

    return `${selectedScenario?.title ?? ''}の問題一覧`
})
</script>

<style lang="css" scoped>
.question-card {
    border-color: rgba(var(--v-border-color), 0.12);
}
</style>
