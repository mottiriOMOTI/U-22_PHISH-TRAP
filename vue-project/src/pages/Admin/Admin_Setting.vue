<template>
<v-container class="pa-6" max-width="1200">
    <!-- タイトル -->
    <div class="mb-6">
      <div class="d-flex align-center ga-3">
        <Settings :size="40" color="#a855f7" />
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
            <Bell :size="20" color="#60a5fa" />

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
            <Shield :size="20" color="#f87171" />

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
            <Mail :size="20" color="#c084fc" />

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
            <Database :size="20" color="#4ade80" />

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
import { ref, watch } from 'vue'
import {
  Settings,
  Bell,
  Shield,
  Database,
  Mail
} from 'lucide-vue-next'

const emailNotifications = ref(true)
const autoGenerate = ref(false)
const fearEffect = ref(true)
const dataCollection = ref(true)


</script>

<style lang="css" scoped>
.v-card {
  border: 1px solid rgba(255, 255, 255, 0.08);
}

</style>

