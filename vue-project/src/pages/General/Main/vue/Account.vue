<template>
  <main class="account-page" :aria-busy="isLoading ? 'true' : 'false'">
    <header class="account-hero">
      <v-icon icon="mdi-account-outline" class="account-hero__icon" />
      <div>
        <h1>アカウント</h1>
        <p>プロフィールと統計情報</p>
      </div>
    </header>

    <section class="account-panel">
      <div class="account-panel__header">
        <h2>プロフィール</h2>
        <RouterLink
          class="profile-edit-button"
          to="/accountsetting"
          aria-label="プロフィールを編集"
          title="プロフィールを編集"
        >
          <v-icon icon="mdi-pencil-outline" />
        </RouterLink>
      </div>

      <div class="profile-card">
        <div class="profile-avatar">
          <img
            v-if="profileImageUrl"
            :src="profileImageUrl"
            alt=""
            class="profile-avatar__image"
            @error="handleAvatarImageError"
          />
          <span v-else>{{ avatarInitial }}</span>
        </div>
        <div class="profile-summary">
          <strong>{{ account.profile.name }}</strong>
          <span>
            <v-icon icon="mdi-email-outline" />
            {{ account.profile.email }}
          </span>
        </div>
      </div>

      <div class="profile-meta-grid">
        <article class="profile-meta-card">
          <span>
            <v-icon icon="mdi-calendar-outline" />
            登録日
          </span>
          <strong>{{ formattedJoinedAt }}</strong>
        </article>

        <article class="profile-meta-card">
          <span>
            <v-icon icon="mdi-medal-outline" />
            ランク
          </span>
          <strong>{{ account.profile.rank }}</strong>
        </article>
      </div>
    </section>

    <section class="account-panel account-panel--stats">
      <h2>学習統計</h2>

      <div class="stats-list">
        <div class="stats-row">
          <span>トレーニング完了数</span>
          <strong>{{ account.stats.completedTrainings }} 回</strong>
        </div>
        <div class="stats-row">
          <span>合計学習時間</span>
          <strong>{{ learningTimeText }}</strong>
        </div>
        <div class="stats-row">
          <span>平均正解率</span>
          <strong>{{ averageAccuracyText }}</strong>
        </div>
      </div>
    </section>

    <p v-if="errorMessage" class="account-message" role="alert">
      {{ errorMessage }}
    </p>


  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import { fetchAccountSummary, type AccountSummary } from '@/api/account'
import { fetchCurrentUserById, getCurrentUser, type CurrentUser } from '@/api/users'

type AccountView = AccountSummary & {
  profile: AccountSummary['profile'] & {
    name: string
    image: string | null
  }
}

const account = reactive<AccountView>({
  profile: {
    email: 'user@example.com',
    joinedAt: '2026-05-15T00:00:00.000Z',
    rank: '初心者',
    name: 'ユーザー',
    image: null,
  },
  stats: {
    completedTrainings: 0,
    totalLearningMinutes: null,
    averageAccuracy: null,
  },
})

const isLoading = ref(true)
const errorMessage = ref('')
const avatarImageError = ref(false)

const profileImageUrl = computed(() => {
  const image = account.profile.image?.trim()
  return image && !avatarImageError.value ? image : ''
})

const avatarInitial = computed(() => {
  const initial = account.profile.name.trim().charAt(0) || account.profile.email.trim().charAt(0)
  return initial ? initial.toUpperCase() : 'U'
})

const formattedJoinedAt = computed(() => {
  const date = new Date(account.profile.joinedAt)

  if (Number.isNaN(date.getTime())) {
    return account.profile.joinedAt
  }

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
})

const learningTimeText = computed(() => {
  return typeof account.stats.totalLearningMinutes === 'number'
    ? `${account.stats.totalLearningMinutes}分`
    : '--分'
})

const averageAccuracyText = computed(() => {
  return typeof account.stats.averageAccuracy === 'number'
    ? `${account.stats.averageAccuracy}%`
    : '--%'
})

function applyAccountSummary(nextAccount: AccountSummary) {
  account.profile.email = nextAccount.profile.email
  account.profile.joinedAt = nextAccount.profile.joinedAt
  account.profile.rank = nextAccount.profile.rank
  account.stats.completedTrainings = nextAccount.stats.completedTrainings
  account.stats.totalLearningMinutes = nextAccount.stats.totalLearningMinutes
  account.stats.averageAccuracy = nextAccount.stats.averageAccuracy
}

function applyCurrentUser(user: CurrentUser) {
  account.profile.name = user.name.trim() || 'ユーザー'
  account.profile.email = user.email
  account.profile.joinedAt = user.created_at
  account.profile.image = user.image
  avatarImageError.value = false
}

function handleAvatarImageError() {
  avatarImageError.value = true
}

async function loadAccountSummary() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const currentUser = getCurrentUser()

    if (currentUser) {
      applyCurrentUser(currentUser)
      let resolvedUser = currentUser

      try {
        resolvedUser = await fetchCurrentUserById(currentUser.id)
        applyCurrentUser(resolvedUser)
      } catch (error) {
        console.error(error)
      }

      const nextAccount = await fetchAccountSummary(resolvedUser.id)
      applyAccountSummary(nextAccount)
      applyCurrentUser(resolvedUser)
      return
    }

    const nextAccount = await fetchAccountSummary()
    applyAccountSummary(nextAccount)
  } catch (error) {
    console.error(error)

    const currentUser = getCurrentUser()
    if (currentUser) {
      applyCurrentUser(currentUser)
      return
    }

    errorMessage.value = 'アカウント情報の読み込みに失敗しました'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadAccountSummary)

</script>

<style src="../../Main.css"></style>
<style lang="css" scoped src="../css/Account.css"></style>
