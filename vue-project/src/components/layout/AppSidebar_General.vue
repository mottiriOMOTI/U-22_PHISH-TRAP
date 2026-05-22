<template>
  <v-navigation-drawer :permanent="true" width="260">
    <v-list nav>
      <v-list-item title="メールボックス" to="/mailbox" prepend-icon="mdi-email" />
      <v-list-item title="アカウント" to="/account" prepend-icon="mdi-account" />
      <v-list-item title="スコア" to="/score" prepend-icon="mdi-star" />
      <v-list-item title="シチュエーション" to="/situation" prepend-icon="mdi-format-list-bulleted" />
      <v-list-item title="設定" to="/setting" prepend-icon="mdi-cog" />
    </v-list>
  </v-navigation-drawer>
</template>

<script setup lang="ts"></script>
<style lang="scss" scoped></style>