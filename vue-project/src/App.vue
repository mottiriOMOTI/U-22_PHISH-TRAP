<template>
  <v-app>
    <!--ヘッダー：必要に応じてサイドバー同様に v-if で制御可能です-->
    <app-header />

    <!-- 一般用サイドバー（現在のページが 'user' の時だけ表示） -->
    <AppSidebar_General v-slot:default v-if="currentLayout === 'user'" />

    <!-- 管理者用サイドバー（現在のページが 'admin' の時だけ表示） -->
    <AppSidebar_Admin v-if="currentLayout === 'admin'" />

    <!--メインコンテンツ（サイドバーがない時はVuetifyが自動で全幅にしてくれます）-->
    <v-main>
      <v-container class="mt-6">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from './components/layout/AppHeader.vue'

// 新しい2つのサイドバーをインポート
import AppSidebar_General from './components/layout/AppSidebar_General.vue'
import AppSidebar_Admin from './components/layout/AppSidebar_Admin.vue'

const route = useRoute()

// 現在のページの meta.layout を取得（設定がない場合はサイドバーなし 'none' にする）
const currentLayout = computed(() => route.meta.layout || 'none')
</script>

<style scoped></style>
