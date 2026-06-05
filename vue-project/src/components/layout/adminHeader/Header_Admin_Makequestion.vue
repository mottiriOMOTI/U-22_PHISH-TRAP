<template>
    <v-app-bar>
        <template v-slot:prepend>
            <v-icon color="deep-purple-lighten-1">mdi-auto-fix</v-icon>
            <div>
                <v-app-bar-title>問題生成</v-app-bar-title>
                <h5 class="subtitle">訓練用メールの生成</h5>
            </div>
        </template>
    </v-app-bar>
</template>

<script setup lang="ts"></script>

<style lang="css" scoped>
.subtitle {
    opacity: 50%;
}
</style>
