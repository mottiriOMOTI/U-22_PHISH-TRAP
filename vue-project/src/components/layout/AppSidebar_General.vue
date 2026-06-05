<template>
  <v-navigation-drawer permanent width="368" class="general-sidebar">
    <div class="general-sidebar__inner">
      <RouterLink to="/mailbox" class="brand-link" aria-label="PHISH-TRAP ホーム">
        <v-icon icon="mdi-shield-outline" class="brand-link__icon" />
        <span class="brand-link__name">PHISH-TRAP</span>
        <span class="brand-link__danger">死線</span>
      </RouterLink>

      <div class="score-card">
        <span>スコア</span>
        <strong>0 / 8</strong>
      </div>

      <nav class="sidebar-nav" aria-label="メインメニュー">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :class="['sidebar-nav__link', { 'sidebar-nav__link--active': isActive(item.to) }]"
        >
          <v-icon :icon="item.icon" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <RouterLink to="/" class="logout-link">
          <v-icon icon="mdi-logout" />
          <span>ログアウト</span>
        </RouterLink>
        <p>防人（さきもりんちゅ）</p>
      </div>
    </div>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

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
  padding: 31px 28px 22px;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #ffffff;
  text-decoration: none;
}

.brand-link__icon {
  color: #ff4052;
  font-size: 47px;
}

.brand-link__name {
  font-size: 25px;
  font-weight: 800;
  line-height: 1;
}

.brand-link__danger {
  color: #ff344c;
  font-size: 24px;
  font-weight: 900;
  line-height: 1;
}

.score-card {
  display: grid;
  width: 254px;
  min-height: 69px;
  margin: 14px 0 0 66px;
  align-content: center;
  padding: 10px 14px;
  border-radius: 9px;
  background: #172238;
}

.score-card span {
  color: #a7c3e6;
  font-size: 14px;
  line-height: 1.1;
}

.score-card strong {
  margin-top: 4px;
  font-size: 24px;
  font-weight: 900;
  line-height: 1;
}

.sidebar-nav {
  display: grid;
  gap: 15px;
  margin-top: 75px;
}

.sidebar-nav__link {
  display: flex;
  height: 64px;
  align-items: center;
  gap: 20px;
  padding: 0 20px;
  border-radius: 32px;
  color: #d4e0f1;
  font-size: 23px;
  font-weight: 800;
  text-decoration: none;
  transition:
    background-color 160ms ease,
    color 160ms ease;
}

.sidebar-nav__link :deep(.v-icon) {
  font-size: 30px;
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
  height: 43px;
  align-items: center;
  justify-content: center;
  gap: 14px;
  border-radius: 22px;
  background: #ffffff;
  color: #bdd0e6;
  font-size: 16px;
  font-weight: 800;
  text-decoration: none;
}

.logout-link :deep(.v-icon) {
  font-size: 22px;
}

.sidebar-footer p {
  margin: 21px 0 0;
  color: #8aa0bd;
  font-size: 14px;
  text-align: center;
}
</style>
