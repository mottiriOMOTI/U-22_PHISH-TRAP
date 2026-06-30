<template>
  <v-app>
    <component :is="sidebarComponent" />
    <component :is="headerComponent" />
    <NotifyCenter />

    <v-main :class="['app-main', { 'app-main--dark': route.meta.shell === 'dark' }]">
      <v-container
        :fluid="route.meta.fluid === true"
        :class="['app-container', { 'app-container--flush': route.meta.flush === true }]"
      >
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import { fetchAppSettings } from './api/settings'
import AppSidebarAdmin from './components/layout/AppSidebar_Admin.vue'
import AppSidebarGeneral from './components/layout/AppSidebar_General.vue'
import NotifyCenter from './components/ui/NotifyCenter.vue'
import { applyThemeColor, DEFAULT_THEME_COLOR } from './lib/themeColor'

import HeaderAccount from './components/layout/userHeader/Header_Account.vue'
import HeaderMailboxList from './components/layout/userHeader/Header_MailboxList.vue'
import HeaderScore from './components/layout/userHeader/Header_Score.vue'
import HeaderSetting from './components/layout/userHeader/Header_Setting.vue'
import HeaderSituation from './components/layout/userHeader/Header_Situation.vue'

import HeaderAdminMakequestion from './components/layout/adminHeader/Header_Admin_Makequestion.vue'
import HeaderAdminOverview from './components/layout/adminHeader/Header_Admin_Overview.vue'
import HeaderAdminQuestionList from './components/layout/adminHeader/Header_Admin_QuestionList.vue'
import HeaderAdminSetting from './components/layout/adminHeader/Header_Admin_Setting.vue'

const route = useRoute()

applyThemeColor(DEFAULT_THEME_COLOR)

async function loadThemeColor() {
  try {
    const settings = await fetchAppSettings()
    applyThemeColor(settings.themeColor)
  } catch (error) {
    console.error(error)
    applyThemeColor(DEFAULT_THEME_COLOR)
  }
}

const sidebarComponent = computed(() => {
  switch (route.meta.sidebar) {
    case 'user':
      return AppSidebarGeneral
    case 'admin':
      return AppSidebarAdmin
    default:
      return null
  }
})

const headerComponent = computed(() => {
  switch (route.meta.header) {
    case 'situation':
      return HeaderSituation
    case 'account':
      return HeaderAccount
    case 'score':
      return HeaderScore
    case 'setting':
      return HeaderSetting
    case 'mailboxList':
      return HeaderMailboxList
    case 'admin_overview':
      return HeaderAdminOverview
    case 'admin_makequestion':
      return HeaderAdminMakequestion
    case 'admin_setting':
      return HeaderAdminSetting
    case 'admin_questionList':
      return HeaderAdminQuestionList
    default:
      return null
  }
})

onMounted(loadThemeColor)
</script>

<style scoped>
.app-main--dark {
  background: var(--page-bg);
  transition: background-color 160ms ease;
}

.app-container {
  margin-top: 24px;
}

.app-container--flush {
  max-width: none;
  margin: 0;
  padding: 0;
}
</style>
