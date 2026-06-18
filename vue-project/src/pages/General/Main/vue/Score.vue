<template>
  <main class="score-page" :aria-busy="loading ? 'true' : 'false'">
    <header class="score-hero">
      <v-icon icon="mdi-trophy-outline" class="score-hero__icon" />
      <div>
        <h1>スコア</h1>
        <p>あなたの学習進捗</p>
      </div>
    </header>

    <section v-if="loading" class="score-panel score-panel--loading" aria-label="スコア読み込み中">
      <div class="loading-card">
        <span class="loading-card__icon" />
        <div>
          <strong>スコアを読み込んでいます</strong>
          <p>最新の学習状況を集計中です。</p>
        </div>
      </div>
    </section>

    <section v-else-if="error" class="score-panel score-panel--message" role="alert">
      <v-icon icon="mdi-alert-circle-outline" class="score-message-icon" />
      <div>
        <h2>スコアを読み込めませんでした</h2>
        <p>{{ error }}</p>
      </div>
      <button class="secondary-button" type="button" @click="load">再試行</button>
    </section>

    <template v-else-if="score">
      <section class="score-card-grid" aria-label="スコア内訳">
        <article class="score-stat-card score-stat-card--correct">
          <div class="score-stat-card__label">
            <v-icon icon="mdi-check-circle-outline" />
            <span>正解</span>
          </div>
          <strong>{{ score.total_correct }}</strong>
        </article>

        <article class="score-stat-card score-stat-card--wrong">
          <div class="score-stat-card__label">
            <v-icon icon="mdi-close-circle-outline" />
            <span>不正解</span>
          </div>
          <strong>{{ score.total_wrong }}</strong>
        </article>

        <article class="score-stat-card score-stat-card--unanswered">
          <div class="score-stat-card__label">
            <v-icon icon="mdi-email-outline" />
            <span>未回答</span>
          </div>
          <strong>{{ score.total_unanswered }}</strong>
        </article>
      </section>

      <section class="score-total-panel">
        <h2>総合スコア</h2>

        <div class="score-accuracy-row">
          <span>正解率</span>
          <strong>{{ accuracyPercent }}%</strong>
        </div>

        <div
          class="score-progress"
          :style="{ '--score-progress': `${accuracyPercent}%` }"
          role="img"
          :aria-label="`正解率 ${accuracyPercent}%`"
        >
          <span />
        </div>

        <div class="score-total-footer">
          <span>{{ score.total_correct }} / {{ score.total_questions }} 問正解</span>
          <strong>{{ scoreStatus }}</strong>
        </div>
      </section>
    </template>
  </main>
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

const scoreStatus = computed(() => {
  if (accuracyPercent.value >= 80) return '優秀'
  if (accuracyPercent.value >= 60) return '良好'
  return '要改善'
})

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

<style src="../../Main.css"></style>
<style lang="css" scoped src="../css/Score.css"></style>

