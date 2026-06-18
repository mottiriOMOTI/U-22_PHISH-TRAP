<template>
  <main class="mailbox-page" :aria-busy="loading ? 'true' : 'false'">
    <header class="mailbox-hero">
      <v-icon icon="mdi-email-outline" class="mailbox-hero__icon" />
      <div>
        <h1>メールボックス</h1>
        <p>訓練メールの受信トレイ</p>
      </div>
    </header>

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

    <!-- ==========================================
         🚨 【メールボックス画面】本格恐怖・バッドエンド演出用オーバーレイ群 
         ========================================== -->
    
    <!-- 疑似デスクトップ通知スタック固定コンテナ -->
    <div class="custom-notification-stack">
      <transition-group name="list">
        <v-card
          v-for="item in notifications"
          :key="item.id"
          color="#1e1e1e"
          elevation="24"
          :class="['mb-2 pa-4 d-flex align-center custom-toast-card', item.borderClass]"
          style="width: 340px;"
        >
          <v-icon :icon="item.icon" :color="item.color" class="me-3" size="large"></v-icon>
          <div>
            <div class="text-subtitle-2 font-weight-bold" :style="{ color: item.color }">{{ item.title }}</div>
            <div class="text-caption text-white" style="line-height: 1.3;">{{ item.text }}</div>
          </div>
        </v-card>
      </transition-group>
    </div>

    <!-- 画面ノイズ用オーバーレイ -->
    <div v-if="showNoise" class="vivid-noise-overlay"></div>

    <!-- ブルースクリーン全画面（BSOD）オーバーレイ -->
    <div v-if="showBsod" class="bsod-screen">
      <div class="bsod-content">
        <div class="bsod-smiley">:(</div>
        <h1 class="bsod-title">PC で問題が発生したため、再起動する必要があります。</h1>
        <p class="bsod-text">エラー情報を収集しています。自動的に再起動します。</p>
        <p class="bsod-percent">{{ bsodPercent }}% 完了</p>
        
        <div class="bsod-footer d-flex gap-4 mt-8">
          <v-icon icon="mdi-qrcode" size="80" color="white" class="me-4"></v-icon>
          <div>
            <p class="text-caption text-white">この問題＋解決策の詳細：</p>
            <p class="text-caption font-weight-bold text-white">https://windows.com</p>
            <p class="text-caption text-white mt-2">停止コード: CRITICAL_PROCESS_DIED (FEAR_EFFECT_ATTACK)</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 最前面の暗号化警告ダイアログ -->
    <v-dialog v-model="showEncrypt" persistent width="600">
      <v-card color="#150505" variant="flat" :style="{ border: `1px solid ${popupColor}`, boxShadow: `0 0 15px ${popupColor}66` }" class="pa-6 rounded-lg text-left">
        <div class="d-flex align-center mb-4">
          <v-icon :icon="popupIcon" :color="popupColor" size="40" class="blink-fast me-3"></v-icon>
          <h2 class="text-h5 font-weight-bold" :style="{ color: popupColor }">{{ popupTitle }}</h2>
        </div>
        <v-card-text class="px-0 py-0 mb-4 text-body-1 text-white font-weight-bold" style="line-height: 1.5;">{{ encryptMainText }}</v-card-text>
        <div class="mb-4">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="text-caption text-grey-lighten-1 font-mono">>> {{ encryptStatusText }}</span>
            <span class="text-h6 font-weight-bold font-mono" :style="{ color: popupColor }">{{ encryptProgress.toFixed(1) }}%</span>
          </div>
          <v-progress-linear v-model="encryptProgress" :color="popupColor" height="16" striped class="rounded-pill"></v-progress-linear>
        </div>
        <v-divider :color="popupColor" class="border-opacity-30 my-4"></v-divider>
        <div class="text-body-2 text-grey-lighten-2" style="line-height: 1.6;">
          <p class="font-weight-bold text-grey-lighten-1 mb-2">■ 以下のステータスを確認してください：</p>
          <v-list bg-color="transparent" density="compact" class="py-0">
            <v-list-item v-for="(text, index) in encryptChecklist" :key="index" class="px-0 min-height-zero mb-1">
              <template v-slot:prepend>
                <v-icon icon="mdi-radiobox-marked" :color="popupColor" size="16" class="me-2"></v-icon>
              </template>
              <v-list-item-title class="text-wrap text-body-2 text-grey-lighten-2">{{ text }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </div>
      </v-card>
    </v-dialog>

    <!-- 完全シャットダウン（暗転）用オーバーレイ -->
    <div :class="['blackout-screen', { 'active': showBlackout }]"></div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { fetchMails, type MailListItem } from '@/api/mailApi'

// ==========================================
// 🚨 本格演出用の外部ユーティリティ群をインポート
// ==========================================
import { triggerNotificationEffect } from '@/pages/General/Mailbox/FearEffect/FearEffect_Death_Attack/notificationEffect'
import { triggerNoiseEffect } from '@/pages/General/Mailbox/FearEffect/FearEffect_Death_Attack/noiseEffect'
import { triggerBsodEffect } from '@/pages/General/Mailbox/FearEffect/FearEffect_Death_Attack/bsodEffect'
import { 
  triggerEncryptEffect, 
  resetEncryptEffect, 
  showEncrypt, 
  encryptProgress, 
  encryptStatusText, 
  encryptMainText, 
  encryptChecklist, 
  popupTitle, 
  popupIcon, 
  popupColor 
} from '@/pages/General/Mailbox/FearEffect/FearEffect_Death_Attack/encryptEffect'
import { triggerSequenceEffect } from '@/pages/General/Mailbox/FearEffect/FearEffect_Death_Attack/sequenceController'

const router = useRouter()

const mails = ref<MailListItem[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

// 🚨 演出コントロール用リアクティブ変数群
const notifications = ref<any[]>([])
const showNoise = ref(false)
const showBsod = ref(false)
const bsodPercent = ref(0)
const showBlackout = ref(false)

async function load() {
  loading.value = true
  error.value = null
  try {
    mails.value = await fetchMails()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'メールの取得に失敗しました'
  } finally {
    loading.value = false
  }
}

/**
 * 🚨 すべての演出状態をリセットするクリーンアップ処理
 */
const resetAllEffects = () => {
  showBsod.value = false
  showNoise.value = false
  showBlackout.value = false
  bsodPercent.value = 0
  resetEncryptEffect()
}

/**
 * 🎬 フィッシング詐欺バッドエンドの本格ホラー自動演出シーケンス
 * 演出完了後、自動的に解説ページ（Explanation）に状態を引き継ぎながら遷移します。
 * 🛠 修正：引数 scenarioType の型を 'business' | 'school' | 'daily' に厳密化
 */
const startBadEndSequence = (state: any, scenarioType: 'business' | 'school' | 'daily' = 'business') => {
  console.log(`💀 バッドエンド演出を開始。対象メール: ${state.mail.title}`)
  
  // 2. 0.5秒後に警告通知ログの送信開始
  setTimeout(() => {
    triggerNotificationEffect(notifications, scenarioType, 1)
  }, 500)

  // 3. 1.5秒後にさらなる重大ログを追加
  setTimeout(() => {
    triggerNotificationEffect(notifications, scenarioType, 2)
  }, 1500)

  // 4. 2.5秒後にフラッシュとともに最前面に暗号化ランサム警告ポップアップを出現させる
  setTimeout(() => {
    triggerEncryptEffect(scenarioType)
  }, 2500)

  // 5. 6.5秒後にランサム警告を消去し、不気味な砂嵐ノイズを発生
  setTimeout(() => {
    resetEncryptEffect()
    triggerNoiseEffect(showNoise)
  }, 6500)

  // 6. 8.0秒後にノイズからブルースクリーンへと雪崩れ込み、カウントが完了したらブラックアウト（暗転）
  //    そして、暗転完了時に「解説ページ」へと自動的に遷移させます！
  setTimeout(() => {
    triggerSequenceEffect(
      notifications,
      showNoise,
      () => triggerBsodEffect({ 
        show: showBsod, 
        percent: bsodPercent, 
        isBlackout: showBlackout, 
        onComplete: () => {
          // すべての演出が完全完了（画面暗転完了）した後の処理
          resetAllEffects()
          
          // ✨ 自動的に解説ページ（Explanation）へ
          // 騙されてバッドエンドになったため、isCorrect: false で送ります。
          // 🛠 追加：解説ページにブラックアウト状態のまま入ってもらうため `needFadeIn: true` を渡します。
          router.push({ 
            path: '/explanation', 
            state: { mail: state.mail, isCorrect: false, needFadeIn: true } 
          })
        } 
      })
    )
  }, 8000)
}

function checkDeathSequence() {
  const state = window.history.state
  if (!state) return

  if (state.triggerDeath) {
    // 💀 フィッシングに引っかかった（実機ホラーフルコンボ演出➔演出終了後に解説ページへ自動遷移）
    // 🛠 修正：代入する変数 scenarioType も明示的にリテラルユニオン型で定義します
    let scenarioType: 'business' | 'school' | 'daily' = 'business'
    const senderEmail = state.mail?.sender_email?.toLowerCase() || ''
    if (senderEmail.includes('.ac.jp') || senderEmail.includes('school') || senderEmail.includes('univ')) {
      scenarioType = 'school'
    } else if (senderEmail.includes('daily') || senderEmail.includes('gmail') || senderEmail.includes('payment')) {
      scenarioType = 'daily'
    }
    
    // ホラー演出シーケンス開始
    startBadEndSequence(state, scenarioType)

  } else if (state.triggerSocialDeath) {
    // 👔 安全なメールを誤報告した（今回は即時解説へ移行。必要に応じて専用演出を追加可能）
    router.push({ 
      path: '/explanation', 
      state: { mail: state.mail, isCorrect: false } 
    })
  } else if (state.triggerSuccess) {
    // ✨ 正しい対処（即座に解説ページへ！）
    // 正解時は `needFadeIn` を渡さないため、通常の即時遷移になります。
    router.push({ 
      path: '/explanation', 
      state: { mail: state.mail, isCorrect: true } 
    })
  }
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
  // 💀 受信トレイに戻った瞬間にフラグ判定
  checkDeathSequence()
  load()
})
</script>

<style lang="css" scoped>
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

/* ==========================================
     🚨 【演出用】恐怖・ウイルス感染演出CSS
   ========================================== */
.font-mono { font-family: 'Courier New', Courier, monospace; }
.min-height-zero { min-height: unset !important; }

/* 通知スタック用 */
.custom-notification-stack { 
  position: fixed; 
  bottom: 16px; 
  right: 16px; 
  z-index: 9000; 
  display: flex; 
  flex-direction: column-reverse; 
  pointer-events: none; 
}
.custom-toast-card { pointer-events: auto; }
.border-red { border-left: 4px solid #ff5252 !important; border-radius: 4px; }
.border-orange { border-left: 4px solid #ff9800 !important; border-radius: 4px; }
.border-green { border-left: 4px solid #00c853 !important; border-radius: 4px; }
.list-enter-active, .list-leave-active { transition: all 0.4s ease; }
.list-enter-from { opacity: 0; transform: translateX(100px); }
.list-leave-to { opacity: 0; transform: translateY(-20px); }

/* ポップアップ点滅 */
.blink-fast { animation: blink-fast-anim 0.4s infinite alternate; }
@keyframes blink-fast-anim { 0% { opacity: 1; } 100% { opacity: 0.3; } }

/* 砂嵐ノイズ */
.vivid-noise-overlay { 
  position: fixed; 
  top: 0; 
  left: 0; 
  width: 100vw; 
  height: 100vh; 
  z-index: 9998; 
  pointer-events: none; 
  background: repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.15) 1px, transparent 1px, transparent 2px), 
              repeating-linear-gradient(90deg, rgba(255, 0, 0, 0.1), rgba(0, 255, 0, 0.1) 2px, rgba(0, 0, 255, 0.1) 3px); 
  background-size: 100% 4px, 6px 100%; 
  animation: glitch-flicker 0.15s infinite; 
}
@keyframes glitch-flicker { 
  0% { transform: translate(2px, 1px) skewX(1deg); filter: invert(0); background-color: rgba(255, 255, 255, 0.05); } 
  50% { transform: translate(-1px, -1px) skewX(-2deg); filter: invert(0.1); background-color: rgba(0, 0, 0, 0.1); } 
  100% { transform: translate(1px, 2px) skewX(0deg); filter: invert(0); background-color: rgba(255, 255, 255, 0.05); } 
}

/* ブルースクリーン */
.bsod-screen { 
  position: fixed; 
  top: 0; 
  left: 0; 
  width: 100vw; 
  height: 100vh; 
  background-color: #0078d7 !important; 
  color: #ffffff !important; 
  z-index: 9999; 
  font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; 
}
.bsod-content { padding: 10% 12%; text-align: left; }
.bsod-smiley { font-size: 120px; line-height: 1; margin-bottom: 20px; }
.bsod-title { font-size: 28px; font-weight: 300; margin-bottom: 20px; line-height: 1.4; }
.bsod-text, .bsod-percent { font-size: 20px; font-weight: 300; margin-bottom: 10px; }

/* 完全暗転（シャットダウン） */
.blackout-screen {
  position: fixed;
  top: 0; 
  left: 0; 
  width: 100vw; 
  height: 100vh;
  background-color: #000000 !important;
  z-index: 99999;
  opacity: 0;
  pointer-events: none;
  transition: opacity 2.0s ease-in-out;
}
.blackout-screen.active {
  opacity: 1;
  pointer-events: auto;
  transition: opacity 0s !important;
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