<template>
  <v-app>

    <!--サイドバー　isで切り替え-->
    <component :is="sidebarComponent" />

    <!--ヘッダー：必要に応じてサイドバー同様に v-if で制御可能です-->
    <component :is="headerComponent"/>

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

//ヘッダー（ユーザー）
import Header_Account from './components/layout/userHeader/Header_Account.vue'
import Header_MailboxList from './components/layout/userHeader/Header_MailboxList.vue'
import Header_Score from './components/layout/userHeader/Header_Score.vue'
import Header_Setting from './components/layout/userHeader/Header_Setting.vue'
import Header_Situation from './components/layout/userHeader/Header_Situation.vue'
//ヘッダー（管理者）
import Header_Admin_Makequestion from './components/layout/adminHeader/Header_Admin_Makequestion.vue'
import Header_Admin_Overview from './components/layout/adminHeader/Header_Admin_Overview.vue'
import Header_Admin_QuestionList from './components/layout/adminHeader/Header_Admin_QuestionList.vue'
import Header_Admin_Setting from './components/layout/adminHeader/Header_Admin_Setting.vue'
import Header_Admin_UserList from './components/layout/adminHeader/Header_Admin_UserList.vue'


const route = useRoute()

// 現在のページの meta.layout を取得（設定がない場合はサイドバーなし 'none' にする）
const sidebarComponent = computed(() => {
  switch (route.meta.sidebar) {
    case 'user':
      return AppSidebar_General
    case 'admin':
      return AppSidebar_Admin
    default:
      return null
  }
})

const headerComponent = computed(()=>{
  switch (route.meta.header){
    case 'situation':
      return Header_Situation
    case 'account':
      return Header_Account
    case 'score':
      return Header_Score
    case 'setting':
      return Header_Setting
    case 'mailboxList':
      return Header_MailboxList
    case 'admin_overview':
      return Header_Admin_Overview
    case 'admin_makequestion':
      return Header_Admin_Makequestion 
    case 'admin_setting':
      return Header_Admin_Setting
    case 'admin_userList':
      return Header_Admin_UserList
    case 'admin_questionList':
      return Header_Admin_QuestionList
    
  }
})

const currentLayout = computed(() => route.meta.layout || 'none')
</script>

<style scoped></style>
