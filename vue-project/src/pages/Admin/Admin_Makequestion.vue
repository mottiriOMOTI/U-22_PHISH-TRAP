<template>
    <v-sheet class="pa-4" rounded="lg" elevation="0" border>
        <div class="page-heading">
            <h3>問題生成</h3>
            <p class="subtitle">カテゴリを選択して10問の訓練メールを生成します。</p>
        </div>

        <div class="generate-actions mt-3">
            <AdminScenarioSelect />
            <v-btn color="primary" prepend-icon="mdi-auto-fix" disabled>
                生成する
            </v-btn>
        </div>
    </v-sheet>
</template>

<script setup lang="ts">
import AdminScenarioSelect from '@/components/layout/adminHeader/AdminScenarioSelect.vue'
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

@media (max-width: 600px) {
    .generate-actions {
        align-items: stretch;
        flex-direction: column;
    }
}
</style>
