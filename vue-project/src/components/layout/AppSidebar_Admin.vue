<template>
  <v-navigation-drawer :permanent="true" width="260" color="grey-darken-3"> <!-- 管理者画面と分かるように色を変えるのもおすすめ -->
    <v-list nav>
      <v-list-item title="概要" to="/admin_overview" prepend-icon="mdi-view-dashboard" />
      <!-- 管理者用メニュー -->
      <v-list-item title="ユーザー一覧" to="/admin_userlist" prepend-icon="mdi-account-group" />
      <v-list-item title="問題作成" to="/admin_makequestion" prepend-icon="mdi-plus-box" />
      <v-list-item title="問題一覧" to="/admin_questionlist" prepend-icon="mdi-help-box" />
      <v-list-item title="管理者設定" to="/admin_setting" prepend-icon="mdi-shield-cog" />
    </v-list>
  </v-navigation-drawer>
</template>

<script setup lang="ts"></script>
<style lang="scss" scoped></style>