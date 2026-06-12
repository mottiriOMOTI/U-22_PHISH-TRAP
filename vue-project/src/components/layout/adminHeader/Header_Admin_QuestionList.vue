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
            <AdminScenarioSelect />
        </template>
    </v-app-bar>
</template>

<script setup lang="ts">
import AdminScenarioSelect from './AdminScenarioSelect.vue'
</script>

<style lang="css" scoped>
.subtitle {
    opacity: 50%;
}
</style>
