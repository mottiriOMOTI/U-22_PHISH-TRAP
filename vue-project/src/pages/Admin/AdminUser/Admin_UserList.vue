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
 
    <v-data-table
      v-else
      :headers="headers"
      :items="users"
      :items-per-page="-1"
      density="comfortable"
      class="rounded-lg"
      no-data-text="該当するユーザーがいません"
    >
      <template #item.current_scenario="{ item }">
        {{ scenarioLabel(item.current_scenario) }}
      </template>
      <template #item.score="{ item }">
        {{ formatScore(item) }}
      </template>
      <template #item.last_active_at="{ item }">
        {{ formatDate(item.last_active_at) }}
      </template>
      <template #bottom />
    </v-data-table>
  </v-container>
</template>
 
<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { fetchUsers, type Scenario, type UserListItem } from '@/api/usersListApi'
 
type ScenarioFilter = Scenario | 'all'
 
const scenarioOptions: Array<{ label: string; value: ScenarioFilter }> = [
  { label: '総ユーザー', value: 'all' },
  { label: '社会人 (business)', value: 'business' },
  { label: '学生 (school)', value: 'school' },
  { label: '一般 (daily)', value: 'daily' },
]
 
const scenarioLabelMap: Record<Scenario, string> = {
  business: '社会人',
  school: '学生',
  daily: '一般',
}
 
const headers = [
  { title: '名前', key: 'name', sortable: true },
  { title: 'メールアドレス', key: 'email', sortable: true },
  { title: 'シチュエーション', key: 'current_scenario', sortable: true },
  { title: 'スコア', key: 'score', sortable: false },
  
]
 
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
  return `${item.latest_total_questions} 問中 ${item.latest_correct_count} 問正解`
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
.admin-userlist :deep(.v-data-table) {
  background-color: white;
}
</style>