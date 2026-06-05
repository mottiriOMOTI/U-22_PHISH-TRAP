<template>
    <v-select
        v-model="selectedScenario"
        :items="scenarioSelectItems"
        variant="outlined"
        density="compact"
        hide-details
        class="admin-scenario-select"
        aria-label="対象カテゴリ"
    />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
    question_scenario,
    scenarioSelectItems,
    type Scenario,
} from '@/stores/admin_questionList'

const scenarioStore = question_scenario()

const selectedScenario = computed<Scenario>({
    get: () => scenarioStore.scenario,
    set: (scenario) => {
        scenarioStore.setScenario(scenario)
    },
})
</script>

<style scoped>
.admin-scenario-select {
    width: 180px;
}
</style>
