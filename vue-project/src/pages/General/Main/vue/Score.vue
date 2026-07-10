<template>
  <main class="score-page" :aria-busy="loading ? 'true' : 'false'" aria-labelledby="score-page-title">
    <header class="score-hero">
      <v-icon icon="mdi-trophy-outline" class="score-hero__icon" />
      <div>
        <h1 id="score-page-title">スコア</h1>
        <p>あなたの学習進捗</p>
      </div>
    </header>

    <section
      v-if="loading"
      class="score-panel score-panel--loading"
      aria-label="スコア読み込み中"
      role="status"
      aria-live="polite"
    >
      <div class="loading-card">
        <span class="loading-card__icon" />
        <div>
          <strong>スコアを読み込んでいます</strong>
          <p>最新の学習状況を集計中です。</p>
        </div>
      </div>
    </section>

    <section
      v-else-if="error"
      class="score-panel score-panel--message"
      role="alert"
      aria-labelledby="score-error-title"
    >
      <v-icon icon="mdi-alert-circle-outline" class="score-message-icon" />
      <div>
        <h2 id="score-error-title">スコアを読み込めませんでした</h2>
        <p>{{ error }}</p>
      </div>
      <button class="secondary-button" type="button" @click="load">再試行</button>
    </section>

    <template v-else-if="score">
      <section class="score-card-grid" aria-label="スコア内訳">
        <article class="score-stat-card score-stat-card--correct" :aria-label="`正解 ${score.total_correct}問`">
          <div class="score-stat-card__label">
            <v-icon icon="mdi-check-circle-outline" />
            <span>正解</span>
          </div>
          <strong>{{ score.total_correct }}</strong>
        </article>

        <article class="score-stat-card score-stat-card--wrong" :aria-label="`不正解 ${score.total_wrong}問`">
          <div class="score-stat-card__label">
            <v-icon icon="mdi-close-circle-outline" />
            <span>不正解</span>
          </div>
          <strong>{{ score.total_wrong }}</strong>
        </article>

        <article
          class="score-stat-card score-stat-card--unanswered"
          :aria-label="`未回答 ${score.total_unanswered}問`"
        >
          <div class="score-stat-card__label">
            <v-icon icon="mdi-email-outline" />
            <span>未回答</span>
          </div>
          <strong>{{ score.total_unanswered }}</strong>
        </article>
      </section>

      <section class="score-total-panel" aria-labelledby="score-total-title">
        <h2 id="score-total-title">総合スコア</h2>

        <div class="score-accuracy-row">
          <span>正解率</span>
          <strong>{{ accuracyPercent }}%</strong>
        </div>

        <div
          class="score-progress"
          :style="{ '--score-progress': `${accuracyPercent}%` }"
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuenow="accuracyPercent"
          :aria-label="`正解率 ${accuracyPercent}%`"
        >
          <span />
        </div>

        <div class="score-total-footer">
          <span>{{ score.total_correct }} / {{ score.total_questions }} 問正解</span>
          <strong>{{ scoreStatus }}</strong>
        </div>
      </section>

      <section class="score-insight-grid" aria-label="学習状況の詳細">
        <article class="score-insight-card">
          <span class="score-insight-card__label">
            <v-icon icon="mdi-repeat-variant" />
            受講回数
          </span>
          <strong>{{ score.session_count }}</strong>
          <p>{{ sessionSummary }}</p>
        </article>

        <article class="score-insight-card">
          <span class="score-insight-card__label">
            <v-icon icon="mdi-account-group-outline" />
            全体平均との差
          </span>
          <strong>{{ accuracyGapLabel }}</strong>
          <p>全体平均 {{ averageAccuracyLabel }}</p>
        </article>

        <article class="score-insight-card">
          <span class="score-insight-card__label">
            <v-icon icon="mdi-podium" />
            現在の順位
          </span>
          <strong>{{ rankingLabel }}</strong>
          <p>{{ rankingSummary }}</p>
        </article>

        <article class="score-insight-card score-insight-card--next">
          <span class="score-insight-card__label">
            <v-icon icon="mdi-compass-outline" />
            次の目標
          </span>
          <strong>{{ nextGoal.title }}</strong>
          <p>{{ nextGoal.description }}</p>
          <RouterLink class="score-action-link" :to="nextGoal.to">
            {{ nextGoal.actionLabel }}
          </RouterLink>
        </article>
      </section>

      <section class="score-breakdown-panel" aria-labelledby="score-breakdown-title">
        <div class="score-breakdown-panel__header">
          <h2 id="score-breakdown-title">回答内訳</h2>
          <p>{{ breakdownSummary }}</p>
        </div>

        <div class="score-breakdown-list">
          <div v-for="item in breakdownItems" :key="item.key" class="score-breakdown-item">
            <div class="score-breakdown-item__row">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}問 / {{ item.percent }}%</strong>
            </div>
            <div
              class="score-breakdown-track"
              role="progressbar"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-valuenow="item.percent"
              :aria-label="`${item.label} ${item.value}問 ${item.percent}%`"
            >
              <span :class="item.className" :style="{ width: `${item.percent}%` }" />
            </div>
          </div>
        </div>
      </section>
    </template>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  fetchAverageScoreStats,
  fetchScore,
  type AverageScoreSummary,
  type ScoreSummary,
} from '@/api/scoreApi'
import { getCurrentUser, type CurrentUser } from '@/api/users'

const router = useRouter()

const currentUser = ref<CurrentUser | null>(getCurrentUser())
const score = ref<ScoreSummary | null>(null)
const averageStats = ref<AverageScoreSummary | null>(null)
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

const averageAccuracyPercent = computed(() =>
  Math.round((averageStats.value?.average_user_accuracy ?? 0) * 100),
)

const averageAccuracyLabel = computed(() => {
  if (!averageStats.value || averageStats.value.total_users <= 0) {
    return '集計前'
  }

  return `${averageAccuracyPercent.value}%`
})

const accuracyGapLabel = computed(() => {
  if (!score.value || !averageStats.value || averageStats.value.total_users <= 0) {
    return '--'
  }

  const gap = Math.round((score.value.accuracy - averageStats.value.average_user_accuracy) * 100)
  return `${gap >= 0 ? '+' : ''}${gap}pt`
})

const currentUserRanking = computed(() => {
  if (!averageStats.value || !currentUser.value) {
    return null
  }

  return averageStats.value.users.find((user) => user.userId === currentUser.value?.id) ?? null
})

const rankingLabel = computed(() => {
  if (!averageStats.value || averageStats.value.total_users <= 0) {
    return '--'
  }

  if (!currentUserRanking.value) {
    return '未集計'
  }

  return `${currentUserRanking.value.rank}位`
})

const rankingSummary = computed(() => {
  if (!averageStats.value || averageStats.value.total_users <= 0) {
    return '全体データがまだありません'
  }

  return `${averageStats.value.total_users}人中の順位`
})

const sessionSummary = computed(() => {
  const count = score.value?.session_count ?? 0

  if (count <= 0) {
    return 'まずは1回受講しましょう'
  }

  return `${count}回の受講結果を集計`
})

const nextGoal = computed(() => {
  const currentScore = score.value

  if (!currentScore || currentScore.total_questions <= 0) {
    return {
      title: '初回訓練',
      description: 'メールボックスから最初の訓練に取り組みましょう。',
      actionLabel: 'メールボックスへ',
      to: '/mailbox',
    }
  }

  if (accuracyPercent.value < 60) {
    return {
      title: '基礎確認',
      description: 'まずはシチュエーションを確認して、判断基準を整えましょう。',
      actionLabel: 'シチュエーションへ',
      to: '/situation',
    }
  }

  if (currentScore.total_wrong > 0) {
    return {
      title: '不正解を減らす',
      description: '怪しい送信元、リンク、添付ファイルに注目して次の訓練へ進みましょう。',
      actionLabel: '次の訓練へ',
      to: '/mailbox',
    }
  }

  return {
    title: '高水準を維持',
    description: '正しい判断を保てています。別のシナリオでも確認してみましょう。',
    actionLabel: '訓練を続ける',
    to: '/mailbox',
  }
})

const breakdownItems = computed(() => {
  const currentScore = score.value
  const total = currentScore?.total_questions ?? 0
  const toPercent = (value: number) => (total > 0 ? Math.round((value / total) * 100) : 0)

  return [
    {
      key: 'correct',
      label: '正解',
      value: currentScore?.total_correct ?? 0,
      percent: toPercent(currentScore?.total_correct ?? 0),
      className: 'score-breakdown-track__fill score-breakdown-track__fill--correct',
    },
    {
      key: 'wrong',
      label: '不正解',
      value: currentScore?.total_wrong ?? 0,
      percent: toPercent(currentScore?.total_wrong ?? 0),
      className: 'score-breakdown-track__fill score-breakdown-track__fill--wrong',
    },
    {
      key: 'unanswered',
      label: '未回答',
      value: currentScore?.total_unanswered ?? 0,
      percent: toPercent(currentScore?.total_unanswered ?? 0),
      className: 'score-breakdown-track__fill score-breakdown-track__fill--unanswered',
    },
  ]
})

const breakdownSummary = computed(() => {
  const total = score.value?.total_questions ?? 0

  if (total <= 0) {
    return '回答データはまだありません。'
  }

  return `全${total}問の回答状況です。`
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
    const [scoreResult, averageResult] = await Promise.allSettled([
      fetchScore(currentUser.value.id),
      fetchAverageScoreStats(),
    ])

    if (scoreResult.status === 'rejected') throw scoreResult.reason
    score.value = scoreResult.value

    if (averageResult.status === 'fulfilled') {
      averageStats.value = averageResult.value
    } else {
      console.error(averageResult.reason)
      averageStats.value = null
    }
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
