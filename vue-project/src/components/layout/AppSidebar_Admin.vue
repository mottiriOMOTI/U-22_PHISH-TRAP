<template>
  <v-navigation-drawer permanent width="270" class="admin-sidebar">
    <div class="admin-sidebar__inner">
      <RouterLink to="/admin_overview" class="admin-brand" aria-label="PHISH-TRAP 管理画面">
        <v-icon icon="mdi-shield-outline" class="admin-brand__icon" />
        <span class="admin-brand__text">
          <span class="admin-brand__title">PHISH-TRAP <strong>死線</strong></span>
          <span class="admin-brand__subtitle">管理画面</span>
        </span>
      </RouterLink>

      <nav class="admin-nav" aria-label="管理メニュー">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :aria-current="isActive(item) ? 'page' : undefined"
          :class="['admin-nav__link', { 'admin-nav__link--active': isActive(item) }]"
        >
          <v-icon :icon="item.icon" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="admin-sidebar__footer">
        <RouterLink to="/admin_login" class="admin-logout" @click="clearCurrentUser">
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

import { clearCurrentUser } from '@/api/users'

type AdminNavItem = {
  label: string
  to: string
  icon: string
  activePaths: string[]
}

const route = useRoute()

const navItems: AdminNavItem[] = [
  {
    label: '概要',
    to: '/admin_overview',
    icon: 'mdi-chart-bar',
    activePaths: ['/admin_overview'],
  },
  {
    label: '問題一覧',
    to: '/admin_questionlist',
    icon: 'mdi-format-list-bulleted',
    activePaths: ['/admin_questionlist', '/admin_questiondetail', '/admin_questionview'],
  },
  {
    label: '問題生成',
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

function isActive(item: AdminNavItem) {
  return item.activePaths.some((path) => route.path === path || route.path.startsWith(`${path}/`))
}
</script>

<style lang="css" scoped>
.admin-sidebar {
  border-right: 1px solid #2f3f59;
  background: #111b2f !important;
  color: #ffffff;
}

.admin-sidebar :deep(.v-navigation-drawer__content) {
  overflow: hidden;
}

.admin-sidebar__inner {
  display: flex;
  height: 100%;
  flex-direction: column;
  padding: 26px 14px 16px 18px;
}

.admin-brand {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 11px;
  color: #ffffff;
  text-decoration: none;
}

.admin-brand__icon {
  color: #b34aff;
  font-size: 42px;
}

.admin-brand__text {
  display: grid;
  gap: 5px;
  min-width: 0;
}

.admin-brand__title {
  color: #ffffff;
  font-size: 21px;
  font-weight: 900;
  letter-spacing: 0;
  line-height: 1;
  white-space: nowrap;
}

.admin-brand__title strong {
  color: #ff4057;
  font-weight: 900;
}

.admin-brand__subtitle {
  color: #9bb4d2;
  font-size: 13px;
  line-height: 1;
}

.admin-nav {
  display: grid;
  gap: 11px;
  margin-top: 66px;
  padding-bottom: 10px;
}

.admin-nav__link {
  display: flex;
  width: 100%;
  height: 52px;
  align-items: center;
  gap: 15px;
  padding: 0 18px;
  border-radius: 28px;
  color: #d7e4fb;
  font-size: 19px;
  font-weight: 900;
  line-height: 1.2;
  text-decoration: none;
  white-space: nowrap;
  transition:
    background 160ms ease,
    color 160ms ease,
    transform 160ms ease;
}

.admin-nav__link :deep(.v-icon) {
  flex: 0 0 auto;
  font-size: 28px;
}

.admin-nav__link:hover,
.admin-nav__link:focus-visible {
  color: #ffffff;
  outline: none;
  transform: translateX(2px);
}

.admin-nav__link--active {
  background: linear-gradient(90deg, #b715f5 0%, #a516f0 100%);
  color: #ffffff;
}

.admin-sidebar__footer {
  margin-top: auto;
}

.admin-logout {
  display: flex;
  width: 100%;
  height: 42px;
  align-items: center;
  justify-content: center;
  gap: 13px;
  border: 1px solid #d8dde8;
  border-radius: 22px;
  background: #ffffff;
  color: #c5d2e5;
  font-size: 14px;
  font-weight: 900;
  text-decoration: none;
}

.admin-logout :deep(.v-icon) {
  font-size: 19px;
}

.admin-sidebar__footer p {
  margin: 22px 0 0;
  color: #7287ad;
  font-size: 13px;
  text-align: center;
}
</style>
