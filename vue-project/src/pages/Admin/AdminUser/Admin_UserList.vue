<template>
  <v-container class="admin-userlist pa-4" max-width="1200">
    <div class="d-flex align-center mb-4 ga-4">
      <h2 class="text-h5">ユーザー一覧</h2>
      <v-spacer />
      <v-select
        v-model="selectedScenario"
        :items="scenarioOptions"
        item-title="label"
        item-value="value"
        label="シチュエーション"
        density="compact"
        variant="outlined"
        hide-details
        style="max-width: 240px;"
      />
    </div>
 
    <div v-if="loading">
      <v-skeleton-loader type="table" />
    </div>
 
    <v-alert
      v-else-if="error"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ error }}
      <template #append>
        <v-btn size="small" variant="text" @click="load">再試行</v-btn>
      </template>
    </v-alert>
 
    <div v-else>
      <v-row class="user-card-list" dense>
        <v-col cols="12" sm="6" v-for="item in users" :key="item.id">
          <v-card class="user-card" elevation="1">
            <v-card-text class="user-card-header py-4">
              <div class="user-card-main">
                <div class="user-card-info">
                  <div class="user-card-name">{{ item.name }}</div>
                  <div class="user-card-email">{{ item.email }}</div>
                </div>
                <div class="user-card-status">
                  <v-chip size="small" variant="tonal" class="user-card-chip">
                    {{ scenarioLabel(item.current_scenario) }}
                  </v-chip>
                  <v-icon :color="item.is_active ? 'success' : 'grey'" size="24">
                    {{ item.is_active ? 'mdi-check-circle' : 'mdi-clock-outline' }}
                  </v-icon>
                </div>
              </div>
              <div class="user-card-sub">
                <div>
                  <div class="text-caption text--secondary">スコア</div>
                  <div class="text-body-2 fw-semibold">{{ formatScore(item) }}</div>
                </div>
                <div>
                  <div class="text-caption text--secondary">最終アクティブ</div>
                  <div class="text-body-2">{{ formatDate(item.last_active_at) }}</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      <v-alert v-if="!loading && users.length === 0" type="info" variant="tonal">
        該当するユーザーがいません
      </v-alert>
    </div>
  </v-container>
</template>
 
<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { fetchUsers, type Scenario, type UserListItem } from '@/api/usersListApi'
type ScenarioFilter = Scenario | 'all'
 
const scenarioOptions: Array<{ label: string; value: ScenarioFilter }> = [
  { label: '全学習者', value: 'all' },
  { label: '社会人 (business)', value: 'business' },
  { label: '学生 (school)', value: 'school' },
  { label: '一般 (daily)', value: 'daily' },
]
 
const scenarioLabelMap: Record<Scenario, string> = {
  business: '社会人',
  school: '学生',
  daily: '一般',
}
 
const selectedScenario = ref<ScenarioFilter>('all')
const users = ref<UserListItem[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
 
async function load() {
  loading.value = true
  error.value = null
  try {
    const scenario = selectedScenario.value === 'all' ? undefined : selectedScenario.value
    users.value = await fetchUsers(scenario)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'ユーザーの取得に失敗しました'
  } finally {
    loading.value = false
  }
}
 
function scenarioLabel(s: Scenario): string {
  return scenarioLabelMap[s] ?? s
}
 
function formatScore(item: UserListItem): string {
  if (item.latest_correct_count === null || item.latest_total_questions === null) {
    return '未受講'
  }
  return `${item.latest_correct_count} / ${item.latest_total_questions}問正解`
}
 
function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
 
watch(selectedScenario, load)
onMounted(load)
</script>
 
<style scoped>
.user-card-list {
  row-gap: 24px;
  column-gap: 24px;
}

.user-card {
  width: 200%;
  min-height: 100px;
  border-radius: 20px;
}

.user-card-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;

  justify-content: flex-start;
  gap: 300px;
}

/*.user-card-main {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;

  flex: 0;
}*/

.user-card-main {
  flex: none;
}


.user-card-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-card-name {
  font-size: 1.05rem;
  font-weight: 700;
  padding: 5px;
}

.user-card-email {
  color: rgba(0, 0, 0, 0.65);
  font-size: 0.95rem;
}

.user-card-email {
  width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-card-status {
  display: flex;
  align-items: center;
  gap: 5px;
}

.user-card-chip {
  text-transform: none;
}

.user-card-sub {
  display: flex;
  justify-content: flex-start;
  gap: 44px;
}

.user-card-sub > div {
  flex: 1;
  min-width: 120px;
}

.text-caption {
  white-space: nowrap;
}

.text-body-2 {
  font-weight: 600;
}
</style>