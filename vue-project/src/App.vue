<template>
  <v-app>
    <component :is="sidebarComponent" />
    <NotifyCenter />

    <v-main
      :class="[
        'app-main',
        {
          'app-main--dark': route.meta.shell === 'dark',
          'app-main--mobile-nav': mobileNavItems.length > 0,
        },
      ]"
    >
      <v-container
        :fluid="route.meta.fluid === true"
        :class="['app-container', { 'app-container--flush': route.meta.flush === true }]"
      >
        <router-view />
      </v-container>
    </v-main>

    <nav
      v-if="mobileNavItems.length"
      class="mobile-bottom-nav"
      :aria-label="route.meta.sidebar === 'admin' ? '管理画面メニュー' : 'メインメニュー'"
    >
      <RouterLink
        v-for="item in mobileNavItems"
        :key="item.to"
        :to="item.to"
        :aria-current="isMobileNavActive(item) ? 'page' : undefined"
        :class="['mobile-bottom-nav__link', { 'mobile-bottom-nav__link--active': isMobileNavActive(item) }]"
      >
        <v-icon :icon="item.icon" />
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>
  </v-app>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import { fetchAppSettings } from './api/settings'
import AppSidebarAdmin from './components/layout/AppSidebar_Admin.vue'
import AppSidebarGeneral from './components/layout/AppSidebar_General.vue'
import NotifyCenter from './components/ui/NotifyCenter.vue'
import { applyThemeColor, DEFAULT_THEME_COLOR } from './lib/themeColor'

const route = useRoute()
const mobileMediaQuery = '(max-width: 760px)'
const isMobileShell = ref(false)

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
  if (isMobileShell.value) {
    return null
  }

  switch (route.meta.sidebar) {
    case 'user':
      return AppSidebarGeneral
    case 'admin':
      return AppSidebarAdmin
    default:
      return null
  }
})

type MobileNavItem = {
  label: string
  to: string
  icon: string
  activePaths: string[]
}

const userMobileNavItems: MobileNavItem[] = [
  {
    label: 'メール',
    to: '/mailbox',
    icon: 'mdi-email-outline',
    activePaths: ['/mailbox', '/mailopen'],
  },
  {
    label: 'スコア',
    to: '/score',
    icon: 'mdi-trophy-outline',
    activePaths: ['/score'],
  },
  {
    label: '統計',
    to: '/avg_score',
    icon: 'mdi-chart-bar',
    activePaths: ['/avg_score'],
  },
  {
    label: '状況',
    to: '/situation',
    icon: 'mdi-movie-open-outline',
    activePaths: ['/situation'],
  },
  {
    label: 'アカウント',
    to: '/account',
    icon: 'mdi-account-outline',
    activePaths: ['/account', '/accountsetting'],
  },
  {
    label: '設定',
    to: '/setting',
    icon: 'mdi-cog-outline',
    activePaths: ['/setting'],
  },
]

const adminMobileNavItems: MobileNavItem[] = [
  {
    label: '概要',
    to: '/admin_overview',
    icon: 'mdi-account-group-outline',
    activePaths: ['/admin_overview'],
  },
  {
    label: '問題',
    to: '/admin_questionlist',
    icon: 'mdi-format-list-bulleted',
    activePaths: ['/admin_questionlist', '/admin_questiondetail', '/admin_questionview'],
  },
  {
    label: '生成',
    to: '/admin_makequestion',
    icon: 'mdi-auto-fix',
    activePaths: ['/admin_makequestion'],
  },
  {
    label: '設定',
    to: '/admin_setting',
    icon: 'mdi-cog-outline',
    activePaths: ['/admin_setting'],
  },
]

const mobileNavItems = computed(() => {
  if (!isMobileShell.value) {
    return []
  }

  switch (route.meta.sidebar) {
    case 'user':
      return userMobileNavItems
    case 'admin':
      return adminMobileNavItems
    default:
      return []
  }
})

function isMobileNavActive(item: MobileNavItem) {
  return item.activePaths.some((path) => route.path === path || route.path.startsWith(`${path}/`))
}

function syncMobileShell() {
  if (typeof window === 'undefined') {
    return
  }

  isMobileShell.value = window.matchMedia(mobileMediaQuery).matches
}

onMounted(() => {
  loadThemeColor()
  syncMobileShell()
  window.addEventListener('resize', syncMobileShell)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncMobileShell)
})
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

.mobile-bottom-nav {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 2000;
  display: flex;
  gap: 4px;
  overflow-x: auto;
  padding: 8px 10px calc(8px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--sidebar-border);
  background: rgba(16, 31, 55, 0.98);
  box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.28);
  scrollbar-width: none;
}

.mobile-bottom-nav::-webkit-scrollbar {
  display: none;
}

.mobile-bottom-nav__link {
  display: grid;
  min-width: 68px;
  min-height: 52px;
  flex: 1 0 68px;
  place-items: center;
  gap: 3px;
  padding: 6px 8px;
  border-radius: 8px;
  color: var(--sidebar-link-text);
  font-size: 11px;
  font-weight: 900;
  line-height: 1.1;
  text-decoration: none;
}

.mobile-bottom-nav__link :deep(.v-icon) {
  font-size: 22px;
}

.mobile-bottom-nav__link--active,
.mobile-bottom-nav__link:hover,
.mobile-bottom-nav__link:focus-visible {
  background: var(--sidebar-active-bg);
  color: var(--sidebar-active-text);
  outline: none;
}

@media (max-width: 760px) {
  .app-main--mobile-nav {
    padding-bottom: calc(72px + env(safe-area-inset-bottom));
  }

  .app-container {
    margin-top: 0;
  }
}
</style>
