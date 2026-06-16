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

<section v-else-if="!hasAnsweredData" class="avg-score-panel avg-score-panel--message">
    <v-icon icon="mdi-chart-box-outline" class="avg-message-icon" />
    <div>
    <h2>まだ統計データがありません</h2>
    <p>ユーザーがトレーニングを完了すると、ここに全体統計が表示されます。</p>
    </div>
</section>

<template v-else-if="stats">
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
</template>
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

<style lang="css" scoped>
.avg-score-page {
box-sizing: border-box;
min-height: 100vh;
padding: 28px 30px 34px;
background: #172337;
color: #ffffff;
}

.avg-score-hero {
display: flex;
align-items: center;
gap: 16px;
margin-bottom: 30px;
}

.avg-score-hero__icon {
color: #4dd4ff;
font-size: 48px;
}

.avg-score-hero h1 {
margin: 0;
font-size: 36px;
font-weight: 800;
line-height: 1.1;
}

.avg-score-hero p,
.avg-score-panel--message p,
.avg-stat-card p,
.avg-table-note {
margin: 0;
color: #9fbbe0;
}

.avg-score-hero p {
margin-top: 10px;
font-size: 18px;
}

.avg-stat-grid {
display: grid;
width: min(100%, 1120px);
grid-template-columns: repeat(4, minmax(0, 1fr));
gap: 18px;
margin-bottom: 22px;
}

.avg-stat-card,
.avg-score-panel {
border: 1px solid #34465f;
border-radius: 8px;
background: #172337;
}

.avg-stat-card {
min-height: 164px;
padding: 22px 24px;
}

.avg-stat-card--primary {
border-color: #15c884;
background: #102f35;
}

.avg-stat-card__label {
display: inline-flex;
align-items: center;
gap: 10px;
color: #d9e8fb;
font-size: 15px;
font-weight: 800;
line-height: 1.3;
}

.avg-stat-card__label :deep(.v-icon) {
color: #64d6ff;
font-size: 22px;
}

.avg-stat-card strong {
display: block;
margin-top: 24px;
font-size: 38px;
font-weight: 900;
line-height: 1;
}

.avg-stat-card p {
margin-top: 12px;
font-size: 14px;
}

.avg-dashboard-grid {
display: grid;
width: min(100%, 1120px);
grid-template-columns: minmax(0, 1.55fr) minmax(280px, 0.75fr);
gap: 22px;
margin-bottom: 22px;
}

.avg-score-panel {
width: min(100%, 1120px);
padding: 24px;
}

.avg-score-panel--wide {
width: auto;
}

.avg-score-panel--message {
display: flex;
align-items: center;
gap: 16px;
min-height: 104px;
}

.avg-score-panel--message h2,
.avg-score-panel--message strong,
.avg-panel-heading h2 {
margin: 0;
font-size: 18px;
font-weight: 800;
line-height: 1.3;
}

.avg-score-panel--message p {
margin-top: 5px;
font-size: 14px;
}

.avg-panel-heading {
display: flex;
align-items: center;
justify-content: space-between;
gap: 16px;
margin-bottom: 22px;
}

.avg-panel-heading span {
color: #9fbbe0;
font-size: 14px;
font-weight: 800;
white-space: nowrap;
}

.avg-answer-bars {
display: grid;
gap: 18px;
}

.avg-answer-row__header {
display: flex;
align-items: center;
justify-content: space-between;
gap: 14px;
margin-bottom: 10px;
}

.avg-answer-row__header span,
.avg-answer-row__header strong {
font-size: 15px;
font-weight: 800;
line-height: 1.2;
}

.avg-answer-track {
overflow: hidden;
height: 14px;
border-radius: 999px;
background: #394c68;
}

.avg-answer-track__fill {
display: block;
min-width: 3px;
height: 100%;
border-radius: inherit;
transition: width 200ms ease;
}

.avg-answer-track__fill--correct {
background: #00d37f;
}

.avg-answer-track__fill--wrong {
background: #ff5d66;
}

.avg-answer-track__fill--unanswered {
background: #8ba6c9;
}

.avg-answer-row small {
display: block;
margin-top: 7px;
color: #9fbbe0;
font-size: 12px;
font-weight: 800;
text-align: right;
}

.avg-distribution-list {
display: grid;
gap: 12px;
}

.avg-distribution-item {
display: flex;
min-height: 58px;
align-items: center;
justify-content: space-between;
gap: 14px;
padding: 0 16px;
border: 1px solid #34465f;
border-radius: 8px;
background: #192840;
}

.avg-distribution-item span {
color: #d9e8fb;
font-size: 15px;
font-weight: 800;
}

.avg-distribution-item strong {
font-size: 26px;
font-weight: 900;
line-height: 1;
}

.avg-distribution-item--excellent strong {
color: #00e08a;
}

.avg-distribution-item--good strong {
color: #ffc247;
}

.avg-distribution-item--review strong {
color: #ff6b76;
}

.avg-user-table-wrap {
  overflow: visible;
}

.avg-user-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.avg-user-table th,
.avg-user-table td {
padding: 14px 12px;
border-bottom: 1px solid #2f415b;
text-align: left;
vertical-align: middle;
}

.avg-user-table th {
color: #9fbbe0;
font-size: 12px;
font-weight: 900;
letter-spacing: 0;
}

.avg-user-table td {
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.avg-user-table tbody tr:last-child td {
border-bottom: 0;
}

.avg-accuracy-pill {
display: inline-flex;
min-width: 56px;
min-height: 28px;
align-items: center;
justify-content: center;
border-radius: 999px;
background: #123f46;
color: #3ef0a1;
font-size: 13px;
font-weight: 900;
}

.avg-table-note {
margin-top: 14px;
font-size: 13px;
font-weight: 700;
}

.avg-loading-icon {
width: 42px;
height: 42px;
flex: 0 0 auto;
border: 4px solid #26334a;
border-top-color: #4dd4ff;
border-radius: 50%;
animation: avg-score-loading 900ms linear infinite;
}

.avg-message-icon {
flex: 0 0 auto;
color: #4dd4ff;
font-size: 34px;
}

.avg-message-icon--error {
color: #ff7382;
}

.avg-secondary-button {
display: inline-flex;
min-height: 38px;
align-items: center;
gap: 8px;
margin-left: auto;
padding: 0 16px;
border: 1px solid #4d6079;
border-radius: 8px;
background: transparent;
color: #ffffff;
font-size: 14px;
font-weight: 800;
cursor: pointer;
}

.avg-secondary-button :deep(.v-icon) {
font-size: 18px;
}

.avg-secondary-button:hover,
.avg-secondary-button:focus-visible {
background: #111a2f;
outline: none;
}

@keyframes avg-score-loading {
to {
transform: rotate(360deg);
}
}

@media (max-width: 1100px) {
.avg-stat-grid {
grid-template-columns: repeat(2, minmax(0, 1fr));
}

.avg-dashboard-grid {
grid-template-columns: 1fr;
}
}

@media (max-width: 700px) {
.avg-score-page {
padding: 18px 14px 18px;
}

.avg-score-hero {
align-items: flex-start;
}

.avg-score-hero h1 {
font-size: 28px;
}

.avg-score-hero p {
font-size: 16px;
}

.avg-stat-grid {
grid-template-columns: 1fr;
gap: 14px;
}

.avg-stat-card,
.avg-score-panel {
padding: 18px;
}

.avg-score-panel--message,
.avg-panel-heading {
align-items: flex-start;
flex-direction: column;
}

  .avg-secondary-button {
    width: 100%;
    justify-content: center;
    margin-left: 0;
  }

  .avg-user-table,
  .avg-user-table tbody,
  .avg-user-table tr,
  .avg-user-table td {
    display: block;
    width: 100%;
  }

  .avg-user-table thead {
    display: none;
  }

  .avg-user-table tr {
    padding: 12px 0;
    border-bottom: 1px solid #2f415b;
  }

  .avg-user-table tr:last-child {
    border-bottom: 0;
  }

  .avg-user-table td {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 8px 0;
    border-bottom: 0;
    text-align: right;
  }

  .avg-user-table td::before {
    content: attr(data-label);
    flex: 0 0 auto;
    color: #9fbbe0;
    font-size: 12px;
    font-weight: 900;
    text-align: left;
  }
}
</style>
