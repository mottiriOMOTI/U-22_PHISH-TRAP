<template>
  <main class="mailbox-page" :aria-busy="loading ? 'true' : 'false'" :class="{ 'is-shaking': debugTimer !== null }">
    <header class="mailbox-hero">
      <v-icon icon="mdi-email-outline" class="mailbox-hero__icon" />
      <div>
        <h1>メールボックス</h1>
        <p>訓練メールの受信トレイ</p>
      </div>
    </header>

    <!-- 🛠 ポップアップを最前面に配置 & オプショナルチェイニングでエラー防止 -->
    <div v-if="debugTimer !== null" class="debug-popup-overlay">
      <div class="debug-popup-content">
        <v-icon icon="mdi-alert-decagram" color="error" size="large" />
        <div class="ms-3">
          <div class="text-caption font-weight-bold">DEBUG: まもなくイベント発生</div>
          <div class="text-h3 font-weight-black">{{ debugTimer?.toFixed(1) }}s</div>
          <div class="text-overline text-error">REDIRECT_ON_COUNTDOWN_ZERO</div>
        </div>
      </div>
    </div>

    <section class="mailbox-panel">
      <div class="mailbox-panel__header">
        <h2>受信トレイ</h2>
        <p>{{ loading ? 'メールを読み込んでいます' : `${mails.length}件のメール` }}</p>
      </div>

      <div v-if="loading" class="mail-list" aria-label="メール読み込み中">
        <article v-for="n in 5" :key="n" class="mail-row-skeleton">
          <span class="mail-row-skeleton__icon" />
          <div>
            <span class="mail-row-skeleton__line mail-row-skeleton__line--short" />
            <span class="mail-row-skeleton__line" />
            <span class="mail-row-skeleton__line mail-row-skeleton__line--medium" />
          </div>
        </article>
      </div>

      <div v-else-if="error" class="mailbox-state mailbox-state--error" role="alert">
        <v-icon icon="mdi-alert-circle-outline" class="mailbox-state__icon" />
        <div>
          <h3>メールを読み込めませんでした</h3>
          <p>{{ error }}</p>
        </div>
        <button class="secondary-button" type="button" @click="load">再試行</button>
      </div>

      <div v-else-if="mails.length === 0" class="mailbox-state" role="status">
        <v-icon icon="mdi-email-open-outline" class="mailbox-state__icon" />
        <div>
          <h3>表示できるメールがありません</h3>
          <p>シチュエーションを変更すると、新しい訓練メールが表示される場合があります。</p>
        </div>
      </div>

      <div v-else class="mail-list">
        <article v-for="mail in mails" :key="mail.id" class="mail-row">
          <button class="mail-row__button" type="button" @click="openMail(mail.id)">
            <span class="mail-row__icon">
              <v-icon icon="mdi-email-outline" />
            </span>

            <span class="mail-row__content">
              <span class="mail-row__sender">{{ mail.sender_name }}</span>
              <span class="mail-row__title">{{ mail.title }}</span>
              <span class="mail-row__preview">{{ preview(mail.body) }}</span>
            </span>

            <span class="mail-row__meta">
              <span>{{ formatDate(mail.created_at) }}</span>
              <v-icon icon="mdi-chevron-right" />
            </span>
          </button>
        </article>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { fetchMails, type MailListItem } from '@/api/mailApi'

const router = useRouter()

const mails = ref<MailListItem[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
let timerId: number | null = null
const debugTimer = ref<number | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    // TODO: 認証ストア完成後に currentUser.current_scenario を渡す
    mails.value = await fetchMails()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'メールの取得に失敗しました'
  } finally {
    loading.value = false
  }
}

function checkDeathSequence() {
  const state = window.history.state
  if (!state) return

  // 💀 潜伏期間をランダムにして緊張感を高める (1.5秒〜3.5秒)
  const delay = Math.floor(Math.random() * 2000) + 1500

  if (state.triggerDeath) {
    startDebugTimer(delay, () => {
      router.push({ path: '/feareffect_death', state: { mail: state.mail } })
    })
  } else if (state.triggerSocialDeath) {
    startDebugTimer(delay, () => {
      router.push({ 
        path: '/feareffect_false', 
        state: { mail: state.mail, isCorrect: false } 
      })
    })
  } else if (state.triggerSuccess) {
    startDebugTimer(delay, () => {
      router.push({ path: '/explanation', state: { mail: state.mail, isCorrect: true } })
    })
  }
}

/**
 * 🛠 デバッグ用タイマーを回して遷移する共通関数
 */
function startDebugTimer(ms: number, callback: () => void) {
  debugTimer.value = ms / 1000
  const interval = setInterval(() => {
    if (debugTimer.value !== null) {
      debugTimer.value = Math.max(0, debugTimer.value - 0.1)
    }
  }, 100)

  setTimeout(() => {
    clearInterval(interval)
    debugTimer.value = null
    callback()
  }, ms)
}

function openMail(id: string) {
  router.push({ name: 'MailOpen', query: { id } })
}

function preview(body: string): string {
  const plain = body.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  return plain.length > 60 ? plain.slice(0, 60) + '…' : plain
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(() => {
  // 💀 画面が開いた瞬間にフラグをチェック（API通信を待たない）
  checkDeathSequence()
  load()
})
</script>

<style lang="css" scoped>
/* 🛠 デバッグ用ポップアップスタイル（一箇所に統合） */
.debug-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000; /* 全ての要素より前面に */
  background: rgba(0, 0, 0, 0.4);
  pointer-events: none;
}

.debug-popup-content {
  background: #2a1212;
  border: 1px solid white;
  border-radius: 12px;
  padding: 20px 40px;
  display: flex;
  align-items: center;
  font-family: monospace;
  color: white;
  box-shadow: 0 0 40px rgba(255, 0, 0, 0.3);
}

/* ⚡ 画面をガタガタ揺らすアニメーション */
.is-shaking {
  animation: shake 0.1s infinite;
  pointer-events: none; /* 揺れている間は操作不能感を出す */
}

@keyframes shake {
  0% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(2px, 2px) rotate(0.5deg); }
  50% { transform: translate(-2px, -2px) rotate(-0.5deg); }
  75% { transform: translate(-2px, 2px) rotate(0.5deg); }
  100% { transform: translate(2px, -2px) rotate(0deg); }
}

.mailbox-page {
  position: relative;
  box-sizing: border-box;
  min-height: 100vh;
  padding: 18px 22px 14px;
  background: #172337;
  color: #ffffff;
}

.mailbox-hero {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.mailbox-hero__icon {
  color: #45a4ff;
  font-size: 42px;
}

.mailbox-hero h1 {
  margin: 0;
  font-size: 30px;
  font-weight: 800;
  line-height: 1.1;
}

.mailbox-hero p,
.mailbox-panel__header p,
.mail-row__preview,
.mail-row__meta,
.mailbox-state p {
  margin: 0;
  color: #9fbbe0;
}

.mailbox-hero p {
  margin-top: 6px;
  font-size: 16px;
}

.mailbox-panel {
  width: min(100%, 1040px);
  padding: 18px 22px 20px;
  border: 1px solid #34465f;
  border-radius: 12px;
  background: #172337;
}

.mailbox-panel__header {
  margin-bottom: 18px;
}

.mailbox-panel__header h2 {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 800;
  line-height: 1.3;
}

.mailbox-panel__header p {
  font-size: 14px;
}

.mail-list {
  display: grid;
  gap: 10px;
}

.mail-row {
  min-width: 0;
}

.mail-row__button {
  display: grid;
  width: 100%;
  min-height: 88px;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: #111a2f;
  color: #ffffff;
  cursor: pointer;
  text-align: left;
  transition:
    border-color 160ms ease,
    background-color 160ms ease;
}

.mail-row__button:hover,
.mail-row__button:focus-visible {
  border-color: #45a4ff;
  background: #162444;
  outline: none;
}

.mail-row__icon {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 8px;
  background: #1c3574;
  color: #5da2ff;
}

.mail-row__icon :deep(.v-icon) {
  font-size: 24px;
}

.mail-row__content {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.mail-row__sender,
.mail-row__title,
.mail-row__preview {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mail-row__sender {
  font-size: 15px;
  font-weight: 800;
  line-height: 1.25;
}

.mail-row__title {
  font-size: 16px;
  font-weight: 800;
  line-height: 1.3;
}

.mail-row__preview {
  font-size: 13px;
  line-height: 1.35;
}

.mail-row__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  line-height: 1.2;
  white-space: nowrap;
}

.mail-row__meta :deep(.v-icon) {
  color: #ffffff;
  font-size: 20px;
}

.mailbox-state {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 92px;
  padding: 18px;
  border-radius: 8px;
  background: #111a2f;
}

.mailbox-state__icon {
  flex: 0 0 auto;
  color: #45a4ff;
  font-size: 34px;
}

.mailbox-state--error .mailbox-state__icon {
  color: #ff7382;
}

.mailbox-state h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  line-height: 1.3;
}

.mailbox-state p {
  margin-top: 4px;
  font-size: 14px;
  line-height: 1.45;
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
  background: #172337;
  outline: none;
}

.mail-row-skeleton {
  display: grid;
  min-height: 88px;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 8px;
  background: #111a2f;
}

.mail-row-skeleton__icon,
.mail-row-skeleton__line {
  display: block;
  border-radius: 999px;
  background: linear-gradient(90deg, #26334a, #34465f, #26334a);
  background-size: 220% 100%;
  animation: mailbox-loading 1200ms ease-in-out infinite;
}

.mail-row-skeleton__icon {
  width: 42px;
  height: 42px;
  border-radius: 8px;
}

.mail-row-skeleton__line {
  width: 100%;
  height: 10px;
  margin-top: 9px;
}

.mail-row-skeleton__line:first-child {
  margin-top: 0;
}

.mail-row-skeleton__line--short {
  width: 32%;
}

.mail-row-skeleton__line--medium {
  width: 64%;
}

@keyframes mailbox-loading {
  to {
    background-position: -220% 0;
  }
}

@media (max-width: 900px) {
  .mailbox-page {
    padding: 18px 14px 16px;
  }

  .mailbox-panel {
    padding: 16px;
  }
}

@media (max-width: 640px) {
  .mailbox-hero {
    align-items: flex-start;
  }

  .mailbox-hero h1 {
    font-size: 28px;
  }

  .mail-row__button {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .mail-row__meta {
    grid-column: 2;
    justify-content: space-between;
  }

  .mailbox-state {
    align-items: flex-start;
    flex-direction: column;
  }

  .secondary-button {
    width: 100%;
    margin-left: 0;
  }
}
</style>
