<template>
  <!-- 🟢 動的なクラスと動的なアイコン名が連動するようにバインド -->
  <div class="d-flex justify-center mt-6 mb-2">
    <v-icon
      :icon="pageIcon"
      size="160"
      :class="pageIconClass"
    ></v-icon>
  </div>

  <h1 class="d-flex justify-center">{{ pageTitle }}</h1>
  <h3 class="d-flex justify-center">{{ pageSubtitle }}</h3>

  <!-- 🔁 カードのループ処理 -->
  <v-row class="margin-3">
    <v-col v-for="item in cards" :key="item.id" cols="12">
      
      <!-- 🚨 type: danger -->
      <BaseCard
        v-if="item.type === 'danger'"
        :type="item.type"
        :subTitle="item.SenderAddress"
        :text="item.Title" 
        :color="item.color"
        :variant="item.variant"
      />
      
      <!-- ⚠ type: DangerExplanation (v-slotの重複ミスを修正しました) -->
      <BaseCard
        v-else-if="item.type === 'DangerExplanation'"
        :type="item.type"
        :text="item.Explanation"
        :color="item.color"
        :variant="item.variant"
      />

      <!-- 💡 type: advice -->
      <BaseCard
        v-else-if="item.type === 'advice'"
        :type="item.type"
        :textList="item.checklist"
        :color="item.color"
        :variant="item.variant"
      />

      <!-- ⚠ type: correctiveAction -->
      <BaseCard
        v-else-if="item.type === 'correctiveAction'"
        :type="item.type"
        :textList="item.Explanation"
        :color="item.color"
        :variant="item.variant"
      />

      <!-- ⚠ type: learningPoint -->
      <BaseCard
        v-else-if="item.type === 'learningPoint'"
        :type="item.type"
        :text="item.Explanation"
        :color="item.color"
        :variant="item.variant"
      />

    </v-col>
  </v-row>

  <!-- 固定カードを配置 -->
  <v-row class="mt-2">
    <v-col cols="12">
      <v-card
        variant="tonal"
        color="secondary"
        class="pa-4"
      >
        <div class="d-flex align-center mb-2">
          <v-icon icon="mdi-book-open-page-variant" class="me-2" size="large"></v-icon>
          <h3 class="text-h6 font-weight-bold">📝 学習のポイント</h3>
        </div>
        <v-card-text class="px-0 pb-0 text-body-1">
          今回体験した「恐怖」を忘れないでください。実際のフィッシング詐欺では、 本物のランサムウェア感染や個人情報の漏洩が発生します。 このトレーニングで学んだ警告サインを実生活でも必ず確認しましょう。
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <!-- ボタンレイアウト -->
  <v-row class="mt-4 px-1">
    <!-- 🟢 不正解解説ボタン（赤バツ点滅に戻すトリガー） -->
    <v-col cols="12" sm="3">
      <v-btn
        block
        color="error"
        variant="tonal"
        prepend-icon="mdi-refresh"
        @click="setToDanger"
      >
        不正解解説
      </v-btn>
    </v-col>

    <!-- 🟢 正解ボタン（緑チェック点滅停止トリガー） -->
    <v-col cols="12" sm="3">
      <v-btn
        block
        color="success"
        variant="flat"
        append-icon="mdi-arrow-right"
        @click="setToCorrect"
      >
        正解！！！！！！！
      </v-btn>
    </v-col>

    
    <!-- 💀 【追加】FearEffect_Death ページへの遷移ボタン -->
    <v-col cols="12" sm="3">
      <v-btn
        block
        color="grey-darken-3"
        variant="elevated"
        prepend-icon="mdi-skull"
        @click="goToPage('FearEffect_Death')"
      >
        Deathイベントへ
      </v-btn>
    </v-col>

    <!-- ❓ 【追加】FearEffect_False ページへの遷移ボタン -->
    <v-col cols="12" sm="3">
      <v-btn
        block
        color="amber-darken-2"
        variant="outlined"
        prepend-icon="mdi-alert"
        @click="goToPage('FearEffect_False')"
      >
        Falseイベントへ
      </v-btn>
    </v-col>

  </v-row>
</template>

<script setup lang="ts">
import BaseCard from '@/components/ui/IshikawaStyle.vue'
import { useUserInput } from '@/stores/userInput'
import { ref, watch } from 'vue'

// 🟢 【追加】Vue Routerからルーター機能をインポート
import { useRouter } from 'vue-router'


import { type CardItem } from '@/components/ui/IshikawaStyle.vue'

// 🟢 【追加】ルーターのインスタンスを作成
const router = useRouter()

const userInput = useUserInput()
const userName = ref('')

// 見出し文字をコントロールするためのリアクティブな変数
const pageTitle = ref('フィッシング詐欺に遭遇')
const pageSubtitle = ref('今のは危険なメールでした')

// 🟢 【追加】最上部アイコンの種類とCSSスタイルクラスを管理するリアクティブ変数
const pageIcon = ref('mdi-close-circle-outline')
const pageIconClass = ref('slow-pulse super-vivid-red')

// 🟢 【追加】別ページへ安全に遷移するための関数
const goToPage = (pageName: string) => {
  // ルーターのルーティング設定（src/router/index.ts など）で指定している path や name に合わせて遷移させます
  // 今回は名前（name属性）で指定して移動する書き方にしています
  router.push({ name: pageName })
  
  // もしルーターの設定がURLパス（例: /mailbox/feareffect/death）で管理されている場合は、以下のようにパスを直接書くことも可能です
  // router.push(`/General/Mailbox/FearEffect/${pageName}`)
}

// 🟢 トリガー処理A: 「正解」状態へ切り替える（緑のチェックに変化し、点滅が止まる）
const setToCorrect = () => {
  pageTitle.value = '正解'
  pageSubtitle.value = '適切な判断ができました'
  
  pageIcon.value = 'mdi-check-circle-outline' // 🟢 緑のチェックマークに変更
  pageIconClass.value = 'super-vivid-green'    // 🟢 点滅クラス(slow-pulse)を外し、緑クラスを適用
}

// 🟢 トリガー処理B: 「不正解」状態に戻す（赤のバツに変化し、ゆっくり点滅する）
const setToDanger = () => {
  pageTitle.value = 'フィッシング詐欺に遭遇'
  pageSubtitle.value = '今のは危険なメールでした'
  
  pageIcon.value = 'mdi-close-circle-outline'  // 🔴 赤のバツマークに戻す
  pageIconClass.value = 'slow-pulse super-vivid-red' // 🔴 点滅クラスと赤クラスを再適用
}

const cards = ref<CardItem[]>([
  {
    id: 'danger-1',
    type: 'danger',
    color: 'error',
    variant: 'outlined',
    CardTitle: 'メール詳細',
    appendIcon: 'mdi-alert-octagon',
    Title: '偽のサインイン通知に注意',
    Sender: 'Microsoft セキュリティチーム',
    SenderAddress: 'security@microsoft-365-support.com',
    Judge: 'フィッシングメールです',
    text: '24時間以内に確認しないとアカウントを停止しますといった文面です。'
  },
  {
    id: 'DangerExplanation-1',
    type: 'DangerExplanation',
    color: 'warning',
    variant: 'tonal',
    Explanation: 'このメールは、Microsoftを装ったフィッシングメールの典型的な例です。送信元のメールアドレスが公式のものと異なっている点や、緊急性を煽る文面が特徴적です。ユーザーは、送信元のメールアドレスを確認し、メール内のURLを直接クリックせずに公式アプリやウェブサイトから確認することが重要です。'
  },
  {
    id: 'advice-1',
    type: 'advice',
    color: 'success',
    variant: 'outlined',
    CardTitle: 'なぜ危険なのか',
    adviceIcon: 'mdi-lightbulb-on',
    tipTitle: '安全に見破るチェックリスト',
    checklist: [
      '送信元のメールアドレス（@以降のドメイン）を確認する',
      'メール内のURLを直接クリックせず、公式アプリ等から確認する'
    ],
    points: 100
  },
  {
    id: 'correctiveAction-1',
    type: 'correctiveAction',
    color: 'info',
    variant: 'elevated',
    Explanation: [
      'メールを開かずに削除する',
      '公式アプリやウェブサイトからアカウントの安全を確認する',
      '不審なメールはセキュリティチームに報告する'
    ]
  }
])

watch(userName, (s) => {
  userInput.userName = s
})
</script>

<style lang="css" scoped>
.margin-3 {
  margin-top: 2em;
}

/* 🔴 鮮やかな純赤を強制適用 */
.super-vivid-red {
  color: #FF0000 !important;
}

/* 🟢 鮮やかな純緑を強制適用 */
.super-vivid-green {
  color: #00FF00 !important;
}

/* 🟢 ゆっくり点滅させるアニメーションの設定（スピードを少し調整可能） */
.slow-pulse {
  animation: pulse-animation 1.5s ease-in-out infinite alternate;
}

/* アニメーションの具体的な動き（透明度の変化） */
@keyframes pulse-animation {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0.15; /* 一番薄いときの設定 */
  }
}
</style>
