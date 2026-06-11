<template>
  <v-container class="score-page pa-4" max-width="900">
    <div v-if="loading">
      <v-skeleton-loader type="article" />
    </div>

    <v-alert
      v-else-if="error"
      type="error"
      variant="tonal"
    >
      {{ error }}
      <template #append>
        <v-btn size="small" variant="text" @click="load">再試行</v-btn>
      </template>
    </v-alert>

    <template v-else-if="score">
      <h2 v-if="currentUser" class="text-h6 mb-4">
        {{ currentUser.name }} さんのスコア
      </h2>

      <v-row align="center">
        <v-col cols="12" md="5" class="d-flex justify-center">
          <v-progress-circular
            :model-value="accuracyPercent"
            :size="200"
            :width="20"
            color="primary"
          >
            <div class="text-center">
              <div class="text-h4 font-weight-bold">{{ accuracyPercent }}%</div>
              <div class="text-caption text-grey">正答率</div>
            </div>
          </v-progress-circular>
        </v-col>

        <v-col cols="12" md="7">
          <v-table density="comfortable" class="rounded-lg">
            <tbody>
              <tr>
                <td class="text-grey">正解数</td>
                <td class="text-right text-h6">{{ score.total_correct }}</td>
              </tr>
              <tr>
                <td class="text-grey">不正解数</td>
                <td class="text-right text-h6">{{ score.total_wrong }}</td>
              </tr>
              <tr>
                <td class="text-grey">未回答数</td>
                <td class="text-right text-h6">{{ score.total_unanswered }}</td>
              </tr>
              <tr>
                <td class="text-grey">総合問題数</td>
                <td class="text-right text-h6">{{ score.total_questions }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-col>
      </v-row>

      <p
        v-if="score.session_count === 0"
        class="text-center text-grey mt-6"
      >
        まだ問題を解いたことがありません。
      </p>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { fetchScore, type ScoreSummary } from '@/api/scoreApi'
import { getCurrentUser, type CurrentUser } from '@/api/users'

const router = useRouter()

const currentUser = ref<CurrentUser | null>(getCurrentUser())
const score = ref<ScoreSummary | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const accuracyPercent = computed(() =>
  Math.round((score.value?.accuracy ?? 0) * 100),
)

async function load() {
  if (!currentUser.value) {
    error.value = 'ログインが必要です。ログイン画面に戻ります…'
    loading.value = false
    setTimeout(() => router.push('/'), 1500)
    return
  }

  loading.value = true
  error.value = null
  try {
    score.value = await fetchScore(currentUser.value.id)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'スコアの取得に失敗しました'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.score-page :deep(.v-table) {
  background-color: white;
}
</style>
