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

<style lang="css" scoped>
.score-page {
  position: relative;
  box-sizing: border-box;
  min-height: 100vh;
  padding: 28px 30px 30px;
  background: #172337;
  color: #ffffff;
}

.score-hero {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 34px;
}

.score-hero__icon {
  color: #ffd400;
  font-size: 48px;
}

.score-hero h1 {
  margin: 0;
  font-size: 36px;
  font-weight: 800;
  line-height: 1.1;
}

.score-hero p,
.score-panel--message p,
.loading-card p {
  margin: 0;
  color: #9fbbe0;
}

.score-hero p {
  margin-top: 14px;
  font-size: 18px;
}

.score-panel {
  width: min(100%, 1040px);
  padding: 26px 30px;
  border: 1px solid #34465f;
  border-radius: 8px;
  background: #172337;
}

.score-panel--message h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  line-height: 1.3;
}

.score-panel--message p {
  margin-top: 4px;
  font-size: 14px;
}

.score-card-grid {
  display: grid;
  width: min(100%, 1040px);
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.score-stat-card {
  display: grid;
  min-height: 174px;
  align-content: start;
  padding: 28px 30px;
  border: 1px solid #34465f;
  border-radius: 8px;
}

.score-stat-card__label {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 22px;
  font-weight: 800;
  line-height: 1.3;
}

.score-stat-card__label :deep(.v-icon) {
  font-size: 26px;
}

.score-stat-card strong {
  margin-top: 38px;
  font-size: 44px;
  font-weight: 900;
  line-height: 1;
}

.score-stat-card--correct {
  border-color: #00c86a;
  background: #102f35;
  color: #00ff88;
}

.score-stat-card--wrong {
  border-color: #ff1028;
  background: #322036;
  color: #ff5d66;
}

.score-stat-card--unanswered {
  border-color: #34465f;
  background: #192840;
  color: #9fbbe0;
}

.score-total-panel {
  width: min(100%, 1040px);
  min-height: 248px;
  padding: 28px 30px 30px;
  border: 1px solid #34465f;
  border-radius: 8px;
  background: #172337;
}

.score-total-panel h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  line-height: 1.3;
}

.score-accuracy-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-top: 38px;
}

.score-accuracy-row span {
  font-size: 20px;
  line-height: 1.2;
}

.score-accuracy-row strong {
  flex: 0 0 auto;
  font-size: 38px;
  font-weight: 900;
  line-height: 1;
}

.score-progress {
  overflow: hidden;
  width: 100%;
  height: 20px;
  margin-top: 22px;
  border-radius: 999px;
  background: #394c68;
}

.score-progress span {
  display: block;
  width: var(--score-progress);
  height: 100%;
  border-radius: inherit;
  background: #00ff88;
  transition: width 200ms ease;
}

.score-total-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-top: 22px;
}

.score-total-footer span {
  color: #9fbbe0;
  font-size: 17px;
  line-height: 1.3;
}

.score-total-footer strong {
  flex: 0 0 auto;
  color: #ffb000;
  font-size: 16px;
  font-weight: 900;
  line-height: 1.3;
}

.score-panel--loading,
.score-panel--message {
  display: flex;
  align-items: center;
  gap: 16px;
}

.loading-card {
  display: flex;
  align-items: center;
  gap: 14px;
}

.loading-card__icon {
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  border: 4px solid #26334a;
  border-top-color: #45a4ff;
  border-radius: 50%;
  animation: score-loading 900ms linear infinite;
}

.loading-card strong {
  font-size: 16px;
  font-weight: 800;
}

.loading-card p {
  margin-top: 4px;
  font-size: 14px;
}

.score-message-icon {
  flex: 0 0 auto;
  color: #ff7382;
  font-size: 34px;
}

.secondary-button {
  min-height: 38px;
  margin-left: auto;
  padding: 0 18px;
  border: 1px solid #4d6079;
  border-radius: 8px;
  background: transparent;
  color: #ffffff;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
}

.secondary-button:hover,
.secondary-button:focus-visible {
  background: #111a2f;
  outline: none;
}

.score-message {
  width: min(100%, 1040px);
  margin: 8px 0 0;
  font-size: 13px;
  font-weight: 700;
}

.score-message--info {
  color: #77d99a;
}

@keyframes score-loading {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 900px) {
  .score-page {
    padding: 18px 14px 16px;
  }

  .score-panel {
    padding: 16px;
  }

  .score-card-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .score-stat-card {
    min-height: 136px;
  }

  .score-total-panel {
    padding: 22px 20px;
  }
}

@media (max-width: 640px) {
  .score-hero {
    align-items: flex-start;
  }

  .score-hero h1 {
    font-size: 28px;
  }

  .score-hero p {
    font-size: 16px;
  }

  .score-panel--message {
    align-items: flex-start;
    flex-direction: column;
  }

  .secondary-button {
    width: 100%;
    margin-left: 0;
  }

  .score-accuracy-row,
  .score-total-footer {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }

  .score-accuracy-row strong {
    font-size: 34px;
  }
}
</style>
