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
          <img
            v-if="profileImageUrl"
            :src="profileImageUrl"
            alt=""
            class="sidebar-profile-avatar__image"
            @error="handleAvatarImageError"
          />
          <span v-else>{{ profileInitial }}</span>
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

import { clearCurrentUser, fetchCurrentUserById, getCurrentUser } from '@/api/users'

const route = useRoute()
const currentUser = ref(getCurrentUser())
const avatarImageError = ref(false)

watch(
  () => route.fullPath,
  () => {
    void syncCurrentUser()
  },
  { immediate: true },
)

watch(
  () => currentUser.value?.image,
  () => {
    avatarImageError.value = false
  },
)

const profileImageUrl = computed(() => {
  const image = currentUser.value?.image?.trim()
  return image && !avatarImageError.value ? image : ''
})

const profileInitial = computed(() => {
  const user = currentUser.value
  const initial = user?.name.trim().charAt(0) || user?.email.trim().charAt(0)

  return initial ? initial.toUpperCase() : 'U'
})

function handleAvatarImageError() {
  avatarImageError.value = true
}

async function syncCurrentUser() {
  const user = getCurrentUser()
  currentUser.value = user

  if (!user) {
    return
  }

  try {
    currentUser.value = await fetchCurrentUserById(user.id)
  } catch (error) {
    console.error(error)
  }
}

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
  border-right: 1px solid var(--sidebar-border);
  background: var(--sidebar-bg) !important;
  color: var(--sidebar-text);
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
  color: var(--sidebar-text);
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
  overflow: hidden;
  text-decoration: none;
  transition:
    background-color 160ms ease,
    transform 160ms ease;
}

.sidebar-profile-avatar__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
  background: var(--sidebar-card-bg);
}

.score-card span {
  color: var(--muted);
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
  color: var(--sidebar-link-text);
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
  background: var(--sidebar-active-bg);
  color: var(--sidebar-active-text);
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
  background: var(--sidebar-logout-bg);
  color: var(--sidebar-logout-text);
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;
}

.logout-link :deep(.v-icon) {
  font-size: 18px;
}

.sidebar-footer p {
  margin: 12px 0 0;
  color: var(--sidebar-muted);
  font-size: 12px;
  text-align: center;
}
</style>
