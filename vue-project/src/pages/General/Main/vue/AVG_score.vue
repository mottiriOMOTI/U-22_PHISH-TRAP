<template>
<main class="avg-score-page" :aria-busy="loading ? 'true' : 'false'">
<header class="avg-score-hero">
    <v-icon icon="mdi-chart-bar" class="avg-score-hero__icon" />
    <div>
    <h1>全体統計</h1>
    <p>全ユーザーの回答結果と正解率</p>
    </div>
</header>

<section v-if="loading" class="avg-score-panel avg-score-panel--message" aria-label="統計読み込み中">
    <span class="avg-loading-icon" />
    <div>
    <strong>統計を読み込んでいます</strong>
    <p>完了済みトレーニングの結果を集計中です。</p>
    </div>
</section>

<section v-else-if="error" class="avg-score-panel avg-score-panel--message" role="alert">
    <v-icon icon="mdi-alert-circle-outline" class="avg-message-icon avg-message-icon--error" />
    <div>
    <h2>統計を読み込めませんでした</h2>
    <p>{{ error }}</p>
    </div>
    <button class="avg-secondary-button" type="button" @click="load">
    <v-icon icon="mdi-refresh" />
    <span>再試行</span>
    </button>
</section>

<section v-else-if="stats">
    <section class="avg-stat-grid" aria-label="全体統計サマリー">
    <article class="avg-stat-card avg-stat-card--primary">
        <div class="avg-stat-card__label">
        <v-icon icon="mdi-bullseye-arrow" />
        <span>全体正解率</span>
        </div>
        <strong>{{ overallAccuracyPercent }}%</strong>
        <p>{{ formatNumber(stats.total_correct) }} / {{ formatNumber(stats.total_questions) }} 問</p>
    </article>

    <article class="avg-stat-card">
        <div class="avg-stat-card__label">
        <v-icon icon="mdi-account-group-outline" />
        <span>参加ユーザー</span>
        </div>
        <strong>{{ formatNumber(stats.total_users) }}</strong>
        <p>集計対象ユーザー</p>
    </article>

    <article class="avg-stat-card">
        <div class="avg-stat-card__label">
        <v-icon icon="mdi-clipboard-check-outline" />
        <span>完了回数</span>
        </div>
        <strong>{{ formatNumber(stats.session_count) }}</strong>
        <p>完了済みセッション</p>
    </article>

    <article class="avg-stat-card">
        <div class="avg-stat-card__label">
        <v-icon icon="mdi-account-check-outline" />
        <span>ユーザー平均</span>
        </div>
        <strong>{{ averageUserAccuracyPercent }}%</strong>
        <p>ユーザー別正解率の平均</p>
    </article>
    </section>

    <section class="avg-dashboard-grid">
    <article class="avg-score-panel avg-score-panel--wide">
        <div class="avg-panel-heading">
        <h2>回答内訳</h2>
        <span>{{ formatNumber(stats.total_questions) }} 問</span>
        </div>

        <div class="avg-answer-bars">
        <div
            v-for="segment in answerSegments"
            :key="segment.key"
            class="avg-answer-row"
        >
            <div class="avg-answer-row__header">
            <span>{{ segment.label }}</span>
            <strong>{{ formatNumber(segment.value) }} 問</strong>
            </div>
            <div class="avg-answer-track">
            <span
                :class="['avg-answer-track__fill', segment.className]"
                :style="{ width: `${segment.percent}%` }"
            />
            </div>
            <small>{{ segment.percent }}%</small>
        </div>
        </div>
    </article>

    <article class="avg-score-panel">
        <div class="avg-panel-heading">
        <h2>正解率分布</h2>
        <span>{{ formatNumber(stats.total_users) }} 人</span>
        </div>

        <div class="avg-distribution-list">
        <div class="avg-distribution-item avg-distribution-item--excellent">
            <span>80%以上</span>
            <strong>{{ stats.distribution.excellent }}</strong>
        </div>
        <div class="avg-distribution-item avg-distribution-item--good">
            <span>60〜79%</span>
            <strong>{{ stats.distribution.good }}</strong>
        </div>
        <div class="avg-distribution-item avg-distribution-item--review">
            <span>60%未満</span>
            <strong>{{ stats.distribution.needs_review }}</strong>
        </div>
        </div>
    </article>
    </section>

    <section class="avg-score-panel">
    <div class="avg-panel-heading">
        <h2>ユーザー別統計</h2>
        <span>上位 {{ visibleUsers.length }} 件</span>
    </div>

    <div class="avg-user-table-wrap">
        <table class="avg-user-table">
        <thead>
            <tr>
            <th>順位</th>
            <th>ユーザー</th>
            <th>正解率</th>
            <th>正解</th>
            <th>問題数</th>
            <th>完了回数</th>
            </tr>
        </thead>
        <tbody>
              <tr v-for="user in visibleUsers" :key="user.rank">
                <td data-label="順位">{{ user.rank }}</td>
                <td data-label="ユーザー">{{ user.label }}</td>
                <td data-label="正解率">
                  <span class="avg-accuracy-pill">{{ formatAccuracy(user.accuracy) }}</span>
                </td>
                <td data-label="正解">{{ formatNumber(user.total_correct) }}</td>
                <td data-label="問題数">{{ formatNumber(user.total_questions) }}</td>
                <td data-label="完了回数">{{ formatNumber(user.session_count) }}</td>
              </tr>
        </tbody>
        </table>
    </div>

    <p v-if="hasMoreUsers" class="avg-table-note">
        {{ formatNumber(stats.users.length - visibleUsers.length) }} 件のユーザー統計を省略しています。
    </p>
    </section>
</section>
</main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { fetchAverageScoreStats, type AverageScoreSummary } from '@/api/scoreApi'

type AnswerSegment = {
key: string
label: string
value: number
percent: number
className: string
}

const stats = ref<AverageScoreSummary | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const numberFormatter = new Intl.NumberFormat('ja-JP')

const hasAnsweredData = computed(() => (stats.value?.total_questions ?? 0) > 0)

const overallAccuracyPercent = computed(() => toPercent(stats.value?.accuracy ?? 0))

const averageUserAccuracyPercent = computed(() =>
toPercent(stats.value?.average_user_accuracy ?? 0),
)

const answerSegments = computed<AnswerSegment[]>(() => {
if (!stats.value || stats.value.total_questions === 0) {
return []
}

const total = stats.value.total_questions

return [
{
    key: 'correct',
    label: '正解',
    value: stats.value.total_correct,
    percent: toPercent(stats.value.total_correct / total),
    className: 'avg-answer-track__fill--correct',
},
{
    key: 'wrong',
    label: '不正解',
    value: stats.value.total_wrong,
    percent: toPercent(stats.value.total_wrong / total),
    className: 'avg-answer-track__fill--wrong',
},
{
    key: 'unanswered',
    label: '未回答',
    value: stats.value.total_unanswered,
    percent: toPercent(stats.value.total_unanswered / total),
    className: 'avg-answer-track__fill--unanswered',
},
]
})

const visibleUsers = computed(() => stats.value?.users.slice(0, 10) ?? [])

const hasMoreUsers = computed(() => (stats.value?.users.length ?? 0) > visibleUsers.value.length)

function toPercent(value: number) {
return Math.round(value * 100)
}

function formatNumber(value: number) {
return numberFormatter.format(value)
}

function formatAccuracy(value: number) {
return `${toPercent(value)}%`
}

async function load() {
loading.value = true
error.value = null

try {
stats.value = await fetchAverageScoreStats()
} catch (e) {
error.value = e instanceof Error ? e.message : '統計データの取得に失敗しました'
} finally {
loading.value = false
}
}

onMounted(load)

</script>

<style src="../../Main.css"></style>
<style lang="css" scoped src="../css/AVG_score.css"></style>

