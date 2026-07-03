<template>
  <v-card
    :variant="variant || 'tonal'"
    :color="color || 'primary'"
    class="pa-4 mb-4"
  >
    <!-- 🟢 カード内部の動的タイトルレイアウト -->
    <div class="d-flex align-center mb-3">
      <v-icon :icon="computedIcon" class="me-2" size="large"></v-icon>
      <h3 class="text-h6 font-weight-bold">
        {{ title || computedTitle }}
      </h3>
    </div>

    <!-- 🟢 サブタイトル（送信元など） -->
    <v-card-subtitle v-if="subTitle" class="px-0 mb-3 d-flex align-center flex-wrap gap-2">
      <span class="text-caption me-2">送信元:</span>
      <v-chip size="small" variant="flat" color="surface-variant">
        {{ subTitle }}
      </v-chip>
    </v-card-subtitle>

    <!-- 🟢 本文コンテンツエリア -->
    <v-card-text class="px-0 pb-0 text-body-1 text-high-emphasis">
      
      <!-- 📄 リスト表示（配列データの場合） -->
      <v-list v-if="textList && textList.length > 0" bg-color="transparent" density="compact">
        <v-list-item v-for="(line, idx) in textList" :key="idx" class="px-0">
          <template v-slot:prepend>
            <v-icon icon="mdi-checkbox-blank-circle" size="8" color="primary" class="me-3"></v-icon>
          </template>
          <v-list-item-title class="text-wrap" style="line-height: 1.6;">
            {{ line }}
          </v-list-item-title>
        </v-list-item>
      </v-list>

      <!-- 📄 通常テキスト表示（文字列の場合） -->
      <p v-else-if="text" style="white-space: pre-wrap; line-height: 1.6;">
        {{ text }}
      </p>
      
    </v-card-text>
  </v-card>
</template>


<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  type?: 'danger' | 'DangerExplanation' | 'advice' | 'correctiveAction' | 'learningPoint' | string
  title?: string
  subTitle?: string
  text?: string
  textList?: string[]
  color?: string
  variant?: 'flat' | 'text' | 'elevated' | 'tonal' | 'outlined' | 'plain'
}

const props = withDefaults(defineProps<Props>(), {
  type: '',
  title: '',
  subTitle: '',
  text: '',
  textList: () => [],
  color: 'primary',
  variant: 'tonal',
})

const computedTitle = computed(() => {
  switch (props.type) {
    case 'danger':
      return 'メール詳細'
    case 'DangerExplanation':
      return 'なぜ危険なのか'
    case 'advice':
      return '安全に見分けるチェックリスト'
    case 'correctiveAction':
      return '正しい対処法'
    case 'learningPoint':
      return '学習ポイント'
    default:
      return '情報カード'
  }
})

const computedIcon = computed(() => {
  switch (props.type) {
    case 'danger':
      return 'mdi-alert-octagon'
    case 'DangerExplanation':
      return 'mdi-file-find'
    case 'advice':
      return 'mdi-lightbulb-on'
    case 'correctiveAction':
      return 'mdi-shield-check'
    case 'learningPoint':
      return 'mdi-book-open-page-variant'
    default:
      return 'mdi-information'
  }
})

export interface DangerCardData {
  id: string
  type: 'danger'
  CardTitle: string
  appendIcon: string
  Title: string
  Sender: string
  SenderAddress: string
  Judge: string
  text: string
  color?: string
  variant?: 'flat' | 'text' | 'elevated' | 'tonal' | 'outlined' | 'plain'
}

export interface DangerExplanation {
  id: string
  type: 'DangerExplanation'
  Explanation: string
  color?: string
  variant?: 'flat' | 'text' | 'elevated' | 'tonal' | 'outlined' | 'plain'
}

export interface AdviceCardData {
  id: string
  type: 'advice'
  CardTitle: string
  adviceIcon: string
  tipTitle: string
  checklist: string[]
  points: number
  color?: string
  variant?: 'flat' | 'text' | 'elevated' | 'tonal' | 'outlined' | 'plain'
}

export interface CorrectiveActionCardData {
  id: string
  type: 'correctiveAction'
  Explanation: string[]
  color?: string
  variant?: 'flat' | 'text' | 'elevated' | 'tonal' | 'outlined' | 'plain'
}

export interface LearningPointCardData {
  id: string
  type: 'learningPoint'
  Explanation: string
  color?: string
  variant?: 'flat' | 'text' | 'elevated' | 'tonal' | 'outlined' | 'plain'
}

export type CardItem =
  | DangerCardData
  | DangerExplanation
  | AdviceCardData
  | CorrectiveActionCardData
  | LearningPointCardData
</script>
