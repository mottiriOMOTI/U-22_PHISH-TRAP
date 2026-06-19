<template>
<v-container class="pa-6" max-width="1200">
    <!-- タイトル -->
    <div class="mb-6">
      <div class="d-flex align-center ga-3">
        <v-icon icon="mdi-cog-outline" size="40" color="#a855f7" />
        <h1 class="text-h4 font-weight-bold">設定</h1>
      </div>
      <p class="text-medium-emphasis">システム管理設定</p>
    </div>

    <!-- 通知設定 -->
    <v-card class="mb-6">
      <v-card-title>通知設定</v-card-title>
      <v-card-subtitle>
        管理者への通知を管理します
      </v-card-subtitle>

      <v-card-text>
        <v-sheet
          class="d-flex justify-space-between align-center pa-4 rounded"
          color="grey-darken-4"
        >
          <div class="d-flex align-center ga-3">
            <v-icon icon="mdi-bell-outline" size="20" color="#60a5fa" />

            <div>
              <div class="font-weight-medium">メール通知</div>
              <div class="text-caption text-white">
                ユーザー活動の通知を受け取る
              </div>
            </div>
          </div>

          <v-switch
            v-model="emailNotifications"
            color="primary"
            hide-details
          />
        </v-sheet>
      </v-card-text>
    </v-card>

    <!-- トレーニング設定 -->
    <v-card class="mb-6">
      <v-card-title>トレーニング設定</v-card-title>
      <v-card-subtitle>
        学習者向けのトレーニング機能を設定します
      </v-card-subtitle>

      <v-card-text class="d-flex flex-column ga-4">
        <v-sheet
          class="d-flex justify-space-between align-center pa-4 rounded"
          color="grey-darken-4"
        >
          <div class="d-flex align-center ga-3">
            <v-icon icon="mdi-shield-outline" size="20" color="#f87171" />

            <div>
              <div class="font-weight-medium">恐怖演出</div>
              <div class="text-caption text-white">
                フィッシング攻撃時の演出を有効にする
              </div>
            </div>
          </div>

          <v-switch
            v-model="fearEffect"
            color="primary"
            hide-details
          />
        </v-sheet>

        <v-sheet
          class="d-flex justify-space-between align-center pa-4 rounded"
          color="grey-darken-4"
        >
          <div class="d-flex align-center ga-3">
            <v-icon icon="mdi-email-outline" size="20" color="#c084fc" />

            <div>
              <div class="font-weight-medium">自動問題生成</div>
              <div class="text-caption text-white">
                週次で新しい問題を自動生成
              </div>
            </div>
          </div>

          <v-switch
            v-model="autoGenerate"
            color="primary"
            hide-details
          />
        </v-sheet>
      </v-card-text>
    </v-card>

    <!-- データ管理 -->
    <v-card>
      <v-card-title>データ管理</v-card-title>
      <v-card-subtitle>
        学習データの収集と管理
      </v-card-subtitle>

      <v-card-text>
        <v-sheet
          class="d-flex justify-space-between align-center pa-4 rounded mb-4"
          color="grey-darken-4"
        >
          <div class="d-flex align-center ga-3">
            <v-icon icon="mdi-database-outline" size="20" color="#4ade80" />

            <div>
              <div class="font-weight-medium">
                学習データ収集
              </div>
              <div class="text-caption text-white">
                ユーザーの学習履歴を記録
              </div>
            </div>
          </div>

          <v-switch
            v-model="dataCollection"
            color="primary"
            hide-details
          />
        </v-sheet>

        <v-divider class="mb-4" />

        <v-btn
          variant="outlined"
          color="error"
          block
        >
          全データをエクスポート
        </v-btn>
      </v-card-text>
    </v-card>
  </v-container>


</template>

<script setup lang="ts">

import { ref, watch, onMounted } from 'vue'
const emailNotifications = ref(true)
const autoGenerate = ref(false)
const fearEffect = ref(true)
const dataCollection = ref(true)





// APIのベースURL（環境に合わせて変更してください）
const API_BASE_URL = 'http://localhost:3000'

// 1. 設定をサーバーから読み込む関数
const fetchSettings = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/settings`)
    if (!response.ok) {
      throw new Error(`Failed to fetch settings: ${response.status}`)
    }
    const data = await response.json()
    
    // 取得した値を各refに反映
    emailNotifications.value = data.emailNotifications
    autoGenerate.value = data.autoGenerate
    fearEffect.value = data.fearEffect
    dataCollection.value = data.dataCollection
  } catch (error) {
    console.error('設定の取得に失敗しました:', error)
  }
}

// 2. 設定をサーバーに保存する関数
const updateSetting = async (key: string, value: boolean) => {
  try {
    const response = await fetch(`${API_BASE_URL}/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ [key]: value }),
    })
    if (!response.ok) {
      throw new Error(`Failed to update ${key}: ${response.status}`)
    }
  } catch (error) {
    console.error(`${key} の更新に失敗しました:`, error)
  }
}

// ページ読み込み時にデータを取得
onMounted(() => {
  fetchSettings()
})

// 各スイッチの変更を監視して、個別に保存処理を呼ぶ
watch(emailNotifications, (val) => updateSetting('emailNotifications', val))
watch(autoGenerate, (val) => updateSetting('autoGenerate', val))
watch(fearEffect, (val) => updateSetting('fearEffect', val))
watch(dataCollection, (val) => updateSetting('dataCollection', val))



</script>

<style lang="css" scoped>
.v-card {
  border: 1px solid rgba(255, 255, 255, 0.08);
}

</style>
