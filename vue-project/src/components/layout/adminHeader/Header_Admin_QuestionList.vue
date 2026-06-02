<template>
    <v-app-bar>
        <template v-slot:prepend>
            <v-icon color="deep-purple-lighten-1">mdi-menu</v-icon>
            <div>
                <v-app-bar-title>問題一覧</v-app-bar-title>
                <h5 class="subtitle">登録済みの訓練用フィッシングメール</h5>
            </div>
        </template>
        <template v-slot:append>
            <v-select v-model="selectedScenario" :items="scenarioSelectItems" variant="outlined" density="compact"
                hide-details />
        </template>
    </v-app-bar>
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

<style lang="css" scoped>
.subtitle {
    opacity: 50%;
}
</style>
