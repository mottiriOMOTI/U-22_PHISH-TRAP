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
        <div class="profile-avatar">{{ avatarInitial }}</div>
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
import { getCurrentUser, type CurrentUser } from '@/api/users'

type AccountView = AccountSummary & {
  profile: AccountSummary['profile'] & {
    name: string
  }
}

const account = reactive<AccountView>({
  profile: {
    email: 'user@example.com',
    joinedAt: '2026-05-15T00:00:00.000Z',
    rank: '初心者',
    name: 'ユーザー',
  },
  stats: {
    completedTrainings: 1,
    totalLearningMinutes: null,
    averageAccuracy: null,
  },
})

const isLoading = ref(true)
const errorMessage = ref('')

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
}

async function loadAccountSummary() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const nextAccount = await fetchAccountSummary()
    applyAccountSummary(nextAccount)

    const currentUser = getCurrentUser()
    if (currentUser) {
      applyCurrentUser(currentUser)
    }
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

<style lang="css" scoped>
.account-page {
  position: relative;
  box-sizing: border-box;
  min-height: 100vh;
  padding: 18px 22px 14px;
  background: #172337;
  color: #ffffff;
}

.account-hero {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.account-hero__icon {
  color: #00c95f;
  font-size: 42px;
}

.account-hero h1 {
  margin: 0;
  font-size: 30px;
  font-weight: 800;
  line-height: 1.1;
}

.account-hero p {
  margin: 6px 0 0;
  color: #9fbbe0;
  font-size: 16px;
}

.account-panel {
  width: min(100%, 1040px);
  padding: 18px 22px 20px;
  border: 1px solid #34465f;
  border-radius: 12px;
  background: #172337;
}

.account-panel + .account-panel {
  margin-top: 16px;
}

.account-panel h2 {
  margin: 0 0 18px;
  font-size: 18px;
  font-weight: 800;
  line-height: 1.3;
}

.account-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.account-panel__header h2 {
  margin: 0;
}

.profile-edit-button {
  display: grid;
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid #4d6079;
  border-radius: 50%;
  background: #111a2f;
  color: #ffffff;
  text-decoration: none;
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    color 160ms ease;
}

.profile-edit-button:hover,
.profile-edit-button:focus-visible {
  border-color: #45a4ff;
  background: #1f55ca;
  color: #ffffff;
  outline: none;
}

.profile-edit-button :deep(.v-icon) {
  font-size: 20px;
}

.profile-card,
.profile-meta-card,
.stats-row {
  background: #111a2f;
}

.profile-card {
  display: flex;
  min-height: 82px;
  align-items: center;
  gap: 16px;
  padding: 0 16px;
  border-radius: 8px;
}

.profile-avatar {
  display: grid;
  width: 58px;
  height: 58px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  background: #00bf56;
  color: #ffffff;
  font-size: 24px;
  font-weight: 800;
}

.profile-summary {
  display: grid;
  gap: 5px;
  min-width: 0;
}

.profile-summary strong {
  overflow-wrap: anywhere;
  font-size: 19px;
  font-weight: 800;
  line-height: 1.2;
}

.profile-summary span,
.profile-meta-card span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #9fbbe0;
  font-size: 14px;
  line-height: 1.3;
}

.profile-summary :deep(.v-icon),
.profile-meta-card :deep(.v-icon) {
  font-size: 18px;
}

.profile-meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 14px;
}

.profile-meta-card {
  display: grid;
  min-height: 68px;
  align-content: center;
  gap: 8px;
  padding: 0 16px;
  border-radius: 8px;
}

.profile-meta-card strong {
  font-size: 17px;
  font-weight: 800;
  line-height: 1.2;
}

.account-panel--stats {
  padding-bottom: 20px;
}

.account-panel--stats h2 {
  margin-bottom: 18px;
}

.stats-list {
  display: grid;
  gap: 10px;
}

.stats-row {
  display: flex;
  min-height: 44px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 0 14px;
  border-radius: 4px;
}

.stats-row span,
.stats-row strong {
  font-size: 16px;
  line-height: 1.25;
}

.stats-row strong {
  flex: 0 0 auto;
  font-weight: 800;
}

.account-message {
  width: min(100%, 1040px);
  margin: 8px 0 0;
  color: #ff7382;
  font-size: 13px;
  font-weight: 700;
}

.help-button {
  position: fixed;
  right: 14px;
  bottom: 12px;
  width: 34px;
  height: 34px;
  border: 1px solid #d7dce7;
  border-radius: 50%;
  background: #ffffff;
  color: #1e2430;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}

@media (max-width: 900px) {
  .account-page {
    padding: 18px 14px 16px;
  }

  .account-panel {
    padding: 16px;
  }

  .profile-meta-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .account-hero {
    align-items: flex-start;
  }

  .account-hero h1 {
    font-size: 28px;
  }

  .profile-card {
    align-items: flex-start;
    padding: 18px;
  }

  .stats-row {
    align-items: flex-start;
    flex-direction: column;
    justify-content: center;
    padding: 14px 16px;
  }
}
</style>
