<template>
  <main
    class="overview-page"
    :aria-busy="loading || loadingAccuracy || loadingLearnerCount || adminCreating ? 'true' : 'false'"
  >
    <header class="overview-hero">
      <div class="overview-hero__title">
        <v-icon icon="mdi-account-group-outline" class="overview-hero__icon" />
        <div>
          <h1>概要</h1>
          <p>システム全体の統計情報</p>
        </div>
      </div>

      <div class="overview-hero__actions">
        <label class="scenario-field">
          <span class="sr-only">シチュエーション</span>
          <select
            v-model="selectedCategory"
            :disabled="loading || loadingAccuracy || loadingLearnerCount || adminCreating"
          >
            <option v-for="item in categoryOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </option>
          </select>
          <v-icon icon="mdi-chevron-down" class="scenario-field__icon" />
        </label>

        <button
          class="add-admin-button"
          type="button"
          :disabled="adminCreating"
          @click="openAdminDialog"
        >
          <v-icon icon="mdi-shield-account-outline" />
          <span>管理者を追加</span>
        </button>
      </div>
    </header>

    <p
      v-if="adminCreateSuccess"
      class="overview-message overview-message--success"
      role="status"
    >
      {{ adminCreateSuccess }}
    </p>

    <section class="metric-grid" aria-label="概要">
      <article class="metric-card">
        <div class="metric-card__heading">
          <v-icon icon="mdi-account-multiple-outline" />
          <span>総学習者数</span>
        </div>
        <strong v-if="loadingLearnerCount">...</strong>
        <strong v-else-if="learnerCountError">エラー</strong>
        <strong v-else>{{ selectedCategoryCount.toLocaleString() }}</strong>
        <p>アクティブユーザー</p>
      </article>

      <article class="metric-card">
        <div class="metric-card__heading">
          <v-icon icon="mdi-check-circle-outline" />
          <span>平均正答率</span>
        </div>
        <strong v-if="loadingAccuracy">...</strong>
        <strong v-else-if="accuracyError">エラー</strong>
        <strong v-else class="metric-card__value--success">{{ averageAccuracy.toFixed(0) }}%</strong>
        <p>改善傾向</p>
      </article>
    </section>

    <section class="learner-panel">
      <div class="learner-panel__header">
        <h2>学習者一覧</h2>
        <p>{{ selectedCategoryLabel }}（{{ users.length.toLocaleString() }}人）</p>
      </div>

      <div v-if="loading" class="learner-loading" role="status">
        <div v-for="n in 4" :key="n" class="learner-card-skeleton" />
      </div>

      <div v-else-if="error" class="panel-message panel-message--error" role="alert">
        <span>{{ error }}</span>
        <button type="button" @click="loadOverview">再試行</button>
      </div>

      <div v-else-if="users.length === 0" class="empty-state">
        <v-icon icon="mdi-account-search-outline" class="empty-state__icon" />
        <p>該当するユーザーがいません</p>
      </div>

      <div v-else class="learner-list" role="list">
        <article v-for="item in users" :key="item.id" class="learner-card" role="listitem">
          <div class="learner-card__identity">
            <div class="learner-card__name-row">
              <h3>{{ item.name }}</h3>
              <span class="scenario-chip">{{ scenarioLabel(item.current_scenario) }}</span>
            </div>
            <p>{{ item.email }}</p>
          </div>

          <dl class="learner-card__score">
            <dt>スコア</dt>
            <dd>{{ formatScore(item) }}</dd>
          </dl>

          <span class="time-pill">{{ formatDate(item.last_active_at) }}</span>

          <v-icon
            v-if="statusIcon(item)"
            :icon="statusIcon(item)"
            :class="['status-icon', `status-icon--${statusTone(item)}`]"
          />
        </article>
      </div>
    </section>

    <v-dialog v-model="adminDialog" max-width="560" persistent>
      <v-card class="admin-create-dialog">
        <v-card-title class="admin-create-dialog__title">
          <v-icon icon="mdi-shield-account-outline" />
          <span>管理者を追加</span>
        </v-card-title>

        <v-card-text>
          <form id="admin-create-form" class="admin-create-form" @submit.prevent="submitAdminCreate">
            <v-text-field
              v-model.trim="adminForm.name"
              label="名前"
              variant="outlined"
              density="comfortable"
              autocomplete="name"
              maxlength="80"
              :disabled="adminCreating"
              required
            />

            <v-text-field
              v-model.trim="adminForm.email"
              label="メールアドレス"
              type="email"
              variant="outlined"
              density="comfortable"
              autocomplete="email"
              maxlength="254"
              :disabled="adminCreating"
              required
            />

            <v-text-field
              v-model="adminForm.password"
              label="パスワード"
              type="password"
              variant="outlined"
              density="comfortable"
              autocomplete="new-password"
              minlength="12"
              maxlength="128"
              hint="12文字以上・英大小文字/数字/記号をすべて含めてください"
              persistent-hint
              :disabled="adminCreating"
              required
            />

            <v-text-field
              v-model="adminForm.passwordConfirm"
              label="パスワード確認"
              type="password"
              variant="outlined"
              density="comfortable"
              autocomplete="new-password"
              minlength="12"
              maxlength="128"
              :disabled="adminCreating"
              required
            />

            <p v-if="adminCreateError" class="dialog-message dialog-message--error" role="alert">
              {{ adminCreateError }}
            </p>
          </form>
        </v-card-text>

        <v-card-actions class="admin-create-dialog__actions">
          <v-btn variant="text" :disabled="adminCreating" @click="closeAdminDialog">
            キャンセル
          </v-btn>
          <v-btn
            color="primary"
            type="submit"
            form="admin-create-form"
            :loading="adminCreating"
          >
            追加する
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import {
  fetchAdminOverviewSummary,
  type AdminOverviewUser,
  type AverageAccuracies,
  type LearnerCounts,
  type Scenario,
} from '@/api/adminOverviewApi'
import { createAdminUser, getCurrentUser, validateNewPassword } from '@/api/users'

type Category = 'student' | 'company' | 'general' | 'all'
type StatusTone = 'success' | 'warning' | 'danger'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const selectedCategory = ref<Category>('all')
const categoryOptions: Array<{ label: string; value: Category }> = [
  { label: '全カテゴリ', value: 'all' },
  { label: '企業', value: 'company' },
  { label: '学生', value: 'student' },
  { label: '一般', value: 'general' },
]
const learnerCounts = ref<LearnerCounts>({
  total: 0,
  business: 0,
  school: 0,
  daily: 0,
})
const loadingLearnerCount = ref(true)
const learnerCountError = ref(false)

const averageAccuracies = ref<AverageAccuracies>({
  total: 0,
  business: 0,
  school: 0,
  daily: 0,
})
const loadingAccuracy = ref(true)
const accuracyError = ref(false)

const categoryMap: Record<Category, { label: string; key: keyof typeof learnerCounts.value; scenario?: Scenario }> = {
  all: { label: '全カテゴリ', key: 'total' },
  student: { label: '学生', key: 'school', scenario: 'school' },
  company: { label: '企業', key: 'business', scenario: 'business' },
  general: { label: '一般', key: 'daily', scenario: 'daily' },
}

const selectedCategoryLabel = computed(() => categoryMap[selectedCategory.value].label)
const selectedCategoryCount = computed(() => learnerCounts.value[categoryMap[selectedCategory.value].key])
const selectedCategoryScenario = computed(() => categoryMap[selectedCategory.value].scenario)
const averageAccuracy = computed(() => averageAccuracies.value[categoryMap[selectedCategory.value].key])

const allUsers = ref<AdminOverviewUser[]>([])
const users = computed(() => {
  const scenario = selectedCategoryScenario.value
  return scenario
    ? allUsers.value.filter((user) => user.current_scenario === scenario)
    : allUsers.value
})
const loading = ref(true)
const error = ref<string | null>(null)
const adminDialog = ref(false)
const adminCreating = ref(false)
const adminCreateError = ref('')
const adminCreateSuccess = ref('')
const adminForm = reactive({
  name: '',
  email: '',
  password: '',
  passwordConfirm: '',
})

const scenarioLabelMap: Record<Scenario, string> = {
  business: '企業',
  school: '学生',
  daily: '一般',
}

function resetAdminForm() {
  adminForm.name = ''
  adminForm.email = ''
  adminForm.password = ''
  adminForm.passwordConfirm = ''
}

function openAdminDialog() {
  adminCreateError.value = ''
  adminCreateSuccess.value = ''
  resetAdminForm()
  adminDialog.value = true
}

function closeAdminDialog() {
  if (adminCreating.value) return

  adminDialog.value = false
  adminCreateError.value = ''
  resetAdminForm()
}

async function submitAdminCreate() {
  if (adminCreating.value) return

  adminCreateError.value = ''
  adminCreateSuccess.value = ''

  const name = adminForm.name.trim()
  const email = adminForm.email.trim()
  const creator = getCurrentUser()

  if (!creator || creator.role !== 'admin') {
    adminCreateError.value = '管理者としてログインしてください。'
    return
  }

  if (!name || !email || !adminForm.password || !adminForm.passwordConfirm) {
    adminCreateError.value = 'すべての項目を入力してください。'
    return
  }

  if (!EMAIL_PATTERN.test(email)) {
    adminCreateError.value = 'メールアドレスを正しく入力してください。'
    return
  }

  if (adminForm.password !== adminForm.passwordConfirm) {
    adminCreateError.value = 'パスワードが一致しません。'
    return
  }

  const passwordValidationError = validateNewPassword(adminForm.password, {
    email,
    name,
  })

  if (passwordValidationError) {
    adminCreateError.value = passwordValidationError
    return
  }

  try {
    adminCreating.value = true
    const createdAdmin = await createAdminUser({
      name,
      email,
      password: adminForm.password,
      creatorUserId: creator.id,
    })

    adminDialog.value = false
    resetAdminForm()
    adminCreateSuccess.value = `${createdAdmin.name} を管理者として追加しました。`
  } catch (e) {
    adminCreateError.value =
      e instanceof Error ? e.message : '管理者アカウントの作成に失敗しました。'
  } finally {
    adminCreating.value = false
  }
}

async function loadOverview() {
  loading.value = true
  loadingLearnerCount.value = true
  loadingAccuracy.value = true
  error.value = null
  learnerCountError.value = false
  accuracyError.value = false

  try {
    const summary = await fetchAdminOverviewSummary()
    learnerCounts.value = summary.learnerCounts
    averageAccuracies.value = summary.averageAccuracies
    allUsers.value = summary.users
  } catch (e) {
    learnerCountError.value = true
    accuracyError.value = true
    learnerCounts.value = { total: 0, business: 0, school: 0, daily: 0 }
    averageAccuracies.value = { total: 0, business: 0, school: 0, daily: 0 }
    allUsers.value = []
    error.value =
      e instanceof Error
        ? e.message
        : 'ユーザーの取得に失敗しました'
  } finally {
    loading.value = false
    loadingLearnerCount.value = false
    loadingAccuracy.value = false
  }
}

function scenarioLabel(s: Scenario): string {
  return scenarioLabelMap[s] ?? s
}

function scoreRatio(item: AdminOverviewUser): number | null {
  if (
    item.latest_correct_count === null ||
    item.latest_total_questions === null ||
    item.latest_total_questions === 0
  ) {
    return null
  }

  return item.latest_correct_count / item.latest_total_questions
}

function statusTone(item: AdminOverviewUser): StatusTone {
  const ratio = scoreRatio(item)

  if (ratio === null) return item.is_active ? 'warning' : 'danger'
  if (ratio >= 0.875) return 'success'
  if (ratio >= 0.625) return 'warning'

  return 'danger'
}

function statusIcon(item: AdminOverviewUser): string | undefined {
  switch (statusTone(item)) {
    case 'success':
      return 'mdi-check-circle-outline'
    case 'warning':
      return undefined
    default:
      return 'mdi-close-circle-outline'
  }
}

function formatScore(item: AdminOverviewUser): string {
  if (
    item.latest_correct_count === null ||
    item.latest_total_questions === null
  ) {
    return '未受講'
  }

  return `${item.latest_correct_count} / ${item.latest_total_questions}`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'

  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  if (!Number.isFinite(diffMs) || diffMs < 0) return '—'

  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'たった今'
  if (minutes < 60) return `${minutes}分前`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}時間前`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}日前`

  return date.toLocaleDateString('ja-JP', {
    month: '2-digit',
    day: '2-digit',
  })
}

onMounted(loadOverview)
</script>

<style scoped>
.overview-page {
  min-height: 100vh;
  padding: 22px 26px 40px 32px;
  background: var(--page-bg);
  color: var(--page-text);
}

.overview-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  max-width: 1038px;
  margin-bottom: 33px;
}

.overview-hero__title {
  display: flex;
  align-items: flex-start;
  gap: 18px;
}

.overview-hero__actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
}

.overview-hero__icon {
  color: var(--accent);
  font-size: 52px;
  margin-top: -2px;
}

.overview-hero h1 {
  margin: 0;
  color: var(--heading-text);
  font-size: 40px;
  font-weight: 900;
  letter-spacing: 0;
  line-height: 1;
}

.overview-hero p {
  margin: 8px 0 0;
  color: var(--muted);
  font-size: 18px;
  font-weight: 500;
}

.scenario-field {
  position: relative;
  display: block;
  width: 240px;
  flex: 0 0 auto;
  margin-top: 0;
}

.scenario-field select {
  width: 100%;
  height: 45px;
  padding: 0 48px 0 16px;
  border: 1px solid var(--surface-border);
  border-radius: 9px;
  appearance: none;
  background: color-mix(in srgb, var(--panel-bg) 82%, var(--surface-bg));
  color: var(--heading-text);
  cursor: pointer;
  font: inherit;
  font-size: 16px;
  font-weight: 900;
  outline: none;
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--page-text) 4%, transparent);
}

.scenario-field select:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--muted) 58%, transparent);
}

.scenario-field select option {
  background: var(--panel-bg);
  color: var(--page-text);
}

.scenario-field select:disabled {
  cursor: default;
  opacity: 0.7;
}

.scenario-field select:focus-visible {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 24%, transparent);
}

.scenario-field__icon {
  position: absolute;
  top: 50%;
  right: 15px;
  color: color-mix(in srgb, var(--muted) 70%, transparent);
  font-size: 20px;
  pointer-events: none;
  transform: translateY(-50%);
}

.add-admin-button {
  display: inline-flex;
  height: 45px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 0 0 auto;
  padding: 0 16px;
  border: 1px solid var(--accent);
  border-radius: 9px;
  background: var(--button-bg);
  color: var(--button-text);
  cursor: pointer;
  font: inherit;
  font-size: 15px;
  font-weight: 900;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    opacity 160ms ease,
    transform 160ms ease;
}

.add-admin-button:hover:not(:disabled),
.add-admin-button:focus-visible {
  border-color: var(--accent-strong);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 24%, transparent);
  outline: none;
  transform: translateY(-1px);
}

.add-admin-button:disabled {
  cursor: default;
  opacity: 0.7;
  transform: none;
}

.add-admin-button :deep(.v-icon) {
  font-size: 21px;
}

.overview-message {
  width: 100%;
  max-width: 1038px;
  margin: -17px 0 24px;
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 800;
}

.overview-message--success {
  border: 1px solid color-mix(in srgb, var(--success) 42%, transparent);
  background: color-mix(in srgb, var(--success) 12%, transparent);
  color: var(--success);
}

.metric-grid {
  display: grid;
  width: 100%;
  max-width: 1038px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  margin-bottom: 28px;
}

.metric-card {
  display: grid;
  min-height: 210px;
  align-content: space-between;
  padding: 30px 31px;
  border: 1px solid var(--panel-border);
  border-radius: 15px;
  background: transparent;
}

.metric-card__heading {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--heading-text);
  font-size: 20px;
  font-weight: 900;
}

.metric-card__heading :deep(.v-icon) {
  color: var(--heading-text);
  font-size: 26px;
}

.metric-card strong {
  color: var(--heading-text);
  font-size: 42px;
  font-weight: 900;
  letter-spacing: 0;
  line-height: 1;
}

.metric-card__value--success {
  color: var(--success) !important;
}

.metric-card p {
  margin: -4px 0 0;
  color: var(--muted);
  font-size: 16px;
  font-weight: 500;
}

.learner-panel {
  width: 100%;
  max-width: 1038px;
  padding: 27px 28px 30px;
  border: 1px solid var(--panel-border);
  border-radius: 15px;
  background: transparent;
}

.learner-panel__header {
  margin-bottom: 33px;
}

.learner-panel__header h2 {
  margin: 0;
  color: var(--heading-text);
  font-size: 21px;
  font-weight: 900;
  letter-spacing: 0;
}

.learner-panel__header p {
  margin: 9px 0 0;
  color: var(--muted);
  font-size: 18px;
  font-weight: 500;
}

.learner-loading,
.learner-list {
  display: grid;
  gap: 16px;
}

.learner-card,
.learner-card-skeleton {
  min-height: 97px;
  border: 1px solid color-mix(in srgb, var(--muted) 48%, transparent);
  border-radius: 12px;
  background: color-mix(in srgb, var(--surface-bg) 82%, var(--panel-bg));
}

.learner-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 76px 78px 30px;
  align-items: center;
  gap: 20px;
  padding: 18px 21px;
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--page-text) 6%, transparent),
    0 10px 22px rgba(2, 8, 23, 0.12);
}

.learner-card-skeleton {
  background:
    linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--page-text) 7%, transparent) 50%, transparent 100%),
    color-mix(in srgb, var(--surface-bg) 76%, var(--panel-bg));
  background-size: 220px 100%, 100% 100%;
  animation: shimmer 1.2s infinite linear;
}

.learner-card__identity {
  min-width: 0;
}

.learner-card__name-row {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 9px;
}

.learner-card__identity h3 {
  margin: 0;
  overflow: hidden;
  color: var(--heading-text);
  font-size: 22px;
  font-weight: 900;
  letter-spacing: 0;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.learner-card__identity p {
  margin: 5px 0 0;
  overflow: hidden;
  color: var(--muted);
  font-size: 18px;
  font-weight: 500;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scenario-chip {
  display: inline-flex;
  height: 29px;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  padding: 0 11px;
  border: 1px solid var(--accent);
  border-radius: 10px;
  color: var(--accent);
  font-size: 15px;
  font-weight: 900;
  line-height: 1;
  white-space: nowrap;
}

.learner-card__score {
  display: flex;
  min-width: 0;
  flex-direction: column-reverse;
  align-items: center;
  gap: 3px;
  margin: 0;
}

.learner-card__score dt {
  color: var(--muted);
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
}

.learner-card__score dd {
  margin: 0;
  color: var(--heading-text);
  font-size: 20px;
  font-weight: 900;
  line-height: 1;
  white-space: nowrap;
}

.time-pill {
  display: inline-flex;
  min-width: 74px;
  height: 29px;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  border: 1px solid color-mix(in srgb, var(--muted) 50%, transparent);
  border-radius: 999px;
  color: var(--heading-text);
  font-size: 15px;
  font-weight: 900;
  line-height: 1;
  white-space: nowrap;
}

.status-icon {
  justify-self: end;
  font-size: 28px;
}

.status-icon--success {
  color: var(--success);
}

.status-icon--danger {
  color: var(--danger);
}

.panel-message {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 700;
}

.panel-message--error {
  border: 1px solid color-mix(in srgb, var(--danger) 42%, transparent);
  background: color-mix(in srgb, var(--danger) 12%, transparent);
  color: var(--danger);
}

.panel-message button {
  flex: 0 0 auto;
  border: 0;
  border-radius: 8px;
  background: var(--button-bg);
  color: var(--button-text);
  cursor: pointer;
  font: inherit;
  font-size: 14px;
  font-weight: 900;
  padding: 8px 12px;
}

.empty-state {
  display: flex;
  min-height: 260px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 20px;
  color: var(--muted);
  text-align: center;
}

.empty-state__icon {
  color: var(--muted);
  font-size: 72px;
}

.empty-state p {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.admin-create-dialog {
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  background: var(--panel-bg);
  color: var(--page-text);
}

.admin-create-dialog__title {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--heading-text);
  font-size: 20px;
  font-weight: 900;
}

.admin-create-dialog__title :deep(.v-icon) {
  color: var(--accent);
}

.admin-create-form {
  display: grid;
  gap: 14px;
}

.dialog-message {
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 800;
}

.dialog-message--error {
  border: 1px solid color-mix(in srgb, var(--danger) 42%, transparent);
  background: color-mix(in srgb, var(--danger) 12%, transparent);
  color: var(--danger);
}

.admin-create-dialog__actions {
  padding: 0 24px 20px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@keyframes shimmer {
  from {
    background-position: -220px 0, 0 0;
  }

  to {
    background-position: calc(100% + 220px) 0, 0 0;
  }
}

@media (max-width: 980px) {
  .overview-page {
    padding: 28px 18px 36px;
  }

  .overview-hero {
    align-items: stretch;
    flex-direction: column;
  }

  .overview-hero h1 {
    font-size: 34px;
  }

  .scenario-field {
    width: 100%;
  }

  .overview-hero__actions {
    width: 100%;
    align-items: stretch;
    flex-direction: column;
    margin-top: 0;
  }

  .add-admin-button {
    width: 100%;
  }

  .metric-grid {
    grid-template-columns: 1fr;
  }

  .learner-card {
    grid-template-columns: minmax(0, 1fr) 74px 78px 30px;
  }
}

@media (max-width: 700px) {
  .learner-panel {
    padding: 24px 14px 20px;
  }

  .learner-card {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 16px;
  }

  .learner-card__score {
    align-items: flex-start;
  }

  .time-pill {
    justify-content: center;
  }

  .status-icon {
    justify-self: start;
  }
}

@media (max-width: 520px) {
  .metric-card {
    min-height: 180px;
    padding: 24px 22px;
  }

  .learner-card {
    grid-template-columns: 1fr;
  }

  .learner-card__name-row {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
