<template>
  <v-app>
    <!--ヘッダー-->
    <app-header />

    <!--サイドバー-->
    <app-sidebar />

    <!--メインコンテンツ-->
    <v-main>
      <v-container class="mt-6">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import AppHeader from './components/layout/AppHeader.vue'
import AppSidebar from './components/layout/AppSidebar.vue'
</script>

<style scoped></style>
