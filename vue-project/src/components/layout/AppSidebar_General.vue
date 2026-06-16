<template>
  <v-navigation-drawer permanent width="240" class="general-sidebar">
    <div class="general-sidebar__inner">
      <RouterLink to="/mailbox" class="brand-link" aria-label="PHISH-TRAP ホーム">
        <v-icon icon="mdi-shield-outline" class="brand-link__icon" />
        <span class="brand-link__name">PHISH-TRAP</span>
        <span class="brand-link__danger">死線</span>
      </RouterLink>

      <div class="profile-score-row">
        <RouterLink to="/account" class="sidebar-profile-avatar" aria-label="プロフィール">
          {{ profileInitial }}
        </RouterLink>

        <div class="score-card">
          <span>スコア</span>
          <strong>0 / 8</strong>
        </div>
      </div>

      <nav class="sidebar-nav" aria-label="メインメニュー">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :aria-current="isActive(item.to) ? 'page' : undefined"
          :class="['sidebar-nav__link', { 'sidebar-nav__link--active': isActive(item.to) }]"
        >
          <v-icon :icon="item.icon" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <RouterLink to="/" class="logout-link" @click="clearCurrentUser">
          <v-icon icon="mdi-logout" />
          <span>ログアウト</span>
        </RouterLink>
        <p>防人（さきもりんちゅ）</p>
      </div>
    </div>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { clearCurrentUser, getCurrentUser } from '@/api/users'

const route = useRoute()
const currentUser = ref(getCurrentUser())

watch(
  () => route.fullPath,
  () => {
    currentUser.value = getCurrentUser()
  },
  { immediate: true },
)

const profileInitial = computed(() => {
  const user = currentUser.value
  const initial = user?.name.trim().charAt(0) || user?.email.trim().charAt(0)

  return initial ? initial.toUpperCase() : 'U'
})

const navItems = [
  {
    label: 'メールボックス',
    to: '/mailbox',
    icon: 'mdi-email-outline',
  },
  {
    label: 'スコア',
    to: '/score',
    icon: 'mdi-trophy-outline',
  },
  {
    label: '全体統計',
    to: '/avg_score',
    icon: 'mdi-chart-bar',
  },
  {
    label: 'シチュエーション',
    to: '/situation',
    icon: 'mdi-movie-open-outline',
  },
  {
    label: 'アカウント',
    to: '/account',
    icon: 'mdi-account-outline',
  },
  {
    label: '設定',
    to: '/setting',
    icon: 'mdi-cog-outline',
  },
]

function isActive(path: string) {
  if (path === '/account') {
    return route.path.startsWith('/account')
  }

  return route.path === path
}
</script>

<style lang="css" scoped>
.general-sidebar {
  border-right: 1px solid #2f3d52;
  background: #10182b !important;
  color: #ffffff;
}

.general-sidebar :deep(.v-navigation-drawer__content) {
  overflow: hidden;
}

.general-sidebar__inner {
  display: flex;
  height: 100%;
  flex-direction: column;
  padding: 20px 16px 14px;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #ffffff;
  text-decoration: none;
}

.brand-link__icon {
  color: #ff4052;
  font-size: 34px;
}

.brand-link__name {
  font-size: 17px;
  font-weight: 800;
  line-height: 1;
}

.brand-link__danger {
  color: #ff344c;
  font-size: 16px;
  font-weight: 900;
  line-height: 1;
}

.profile-score-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}

.sidebar-profile-avatar {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  place-items: center;
  border-radius: 50%;
  background: #00bf56;
  color: #ffffff;
  font-size: 16px;
  font-weight: 900;
  line-height: 1;
  text-decoration: none;
  transition:
    background-color 160ms ease,
    transform 160ms ease;
}

.sidebar-profile-avatar:hover,
.sidebar-profile-avatar:focus-visible {
  background: #00d766;
  outline: none;
  transform: translateY(-1px);
}

.score-card {
  display: grid;
  min-width: 0;
  min-height: 48px;
  flex: 1 1 auto;
  align-content: center;
  padding: 7px 10px;
  border-radius: 8px;
  background: #172238;
}

.score-card span {
  color: #a7c3e6;
  font-size: 14px;
  line-height: 1.1;
}

.score-card strong {
  margin-top: 3px;
  font-size: 19px;
  font-weight: 900;
  line-height: 1;
}

.sidebar-nav {
  display: grid;
  gap: 8px;
  margin-top: 16px;
  padding-bottom: 10px;
}

.sidebar-nav__link {
  display: flex;
  height: 46px;
  align-items: center;
  gap: 12px;
  padding: 0 14px;
  border-radius: 23px;
  color: #d4e0f1;
  font-size: 16px;
  font-weight: 800;
  text-decoration: none;
  white-space: nowrap;
  transition:
    background-color 160ms ease,
    color 160ms ease;
}

.sidebar-nav__link :deep(.v-icon) {
  font-size: 24px;
}

.sidebar-nav__link:hover,
.sidebar-nav__link--active {
  background: #2265f4;
  color: #ffffff;
}

.sidebar-footer {
  margin-top: auto;
}

.logout-link {
  display: flex;
  height: 34px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 17px;
  background: #ffffff;
  color: #bdd0e6;
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;
}

.logout-link :deep(.v-icon) {
  font-size: 18px;
}

.sidebar-footer p {
  margin: 12px 0 0;
  color: #8aa0bd;
  font-size: 12px;
  text-align: center;
}
</style>
