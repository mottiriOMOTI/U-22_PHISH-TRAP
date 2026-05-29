<template>
  <div class="dashboard">

    <!-- ヘッダー -->
    <div class="header">

      <div>
        <h1 class="title">
          概要
        </h1>

        <p class="subtitle">
          システム全体の統計情報
        </p>
      </div>

      <!-- プルダウン -->
      <select
        v-model="selectedCategory"
        class="select-box"
      >
        <option value="student">
          学生
        </option>

        <option value="company">
          企業
        </option>

        <option value="general">
          一般
        </option>
      </select>

    </div>

    <!-- 上カード -->
    <div class="card-grid">

      <!-- 総学習者数 -->
      <div class="card">

        <h2 class="card-title">
          総学習者数
        </h2>

        <div class="dummy-box"></div>

      </div>

      <!-- 平均正答率 -->
      <div class="card">

        <h2 class="card-title">
          平均正答率
        </h2>

        <div class="dummy-box"></div>

      </div>

    </div>

    <!-- 問題別正答率 -->
    <div class="card">

      <h2 class="card-title">
        問題別正答率
      </h2>

      <p class="description">
        各フィッシングタイプの統計
      </p>

      <div
        v-for="(item, index) in questionList"
        :key="index"
        class="question-item"
      >

        <div class="question-row">

          <span class="question-name">
            {{ item }}
          </span>

        </div>

        <!-- バー -->
        <div class="progress-bg">

          <div class="progress-bar"></div>

        </div>

      </div>

    </div>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const selectedCategory =
  ref('student')

const questionList = [
  'Amazon偽装',
  'CEO詐欺',
  '当選詐欺',
  'Microsoft偽装',
]
</script>

<style scoped>

/* 全体 */
.dashboard {
  min-height: 100vh;

  padding: 24px;

  background-color: #f8fafc;
}

/* ヘッダー */
.header {
  display: flex;

  justify-content: space-between;

  align-items: center;

  margin-bottom: 24px;
}

/* タイトル */
.title {
  font-size: 32px;

  font-weight: bold;

  color: #0f172a;
}

/* サブタイトル */
.subtitle {
  margin-top: 4px;

  color: #64748b;
}

/* select */
.select-box {
  width: 180px;

  padding: 10px 14px;

  border: none;

  border-radius: 8px;

  background-color: white;

  color: #0f172a;

  outline: none;
}

/* 2列 */
.card-grid {
  display: grid;

  grid-template-columns: 1fr 1fr;

  gap: 16px;

  margin-bottom: 24px;
}

/* カード */
.card {
  background-color: white;

  border-radius: 16px;

  padding: 24px;
}

/* タイトル */
.card-title {
  font-size: 20px;

  font-weight: bold;

  color: #0f172a;

  margin-bottom: 16px;
}

/* ダミー */
.dummy-box {
  width: 120px;

  height: 40px;

  border-radius: 8px;

  background-color: #e2e8f0;
}

/* 説明 */
.description {
  margin-bottom: 24px;

  color: #64748b;
}

/* 問題 */
.question-item {
  margin-bottom: 20px;
}

/* 行 */
.question-row {
  display: flex;

  justify-content: space-between;

  margin-bottom: 8px;
}

/* 問題名 */
.question-name {
  color: #0f172a;
}

/* バー背景 */
.progress-bg {
  width: 100%;

  height: 8px;

  background-color: #e2e8f0;

  border-radius: 9999px;

  overflow: hidden;
}

/* バー */
.progress-bar {
  width: 60%;

  height: 100%;

  border-radius: 9999px;

  background-color: #22c55e;
}

/* レスポンシブ */
@media (max-width: 768px) {

  .card-grid {
    grid-template-columns: 1fr;
  }

  .header {
    flex-direction: column;

    align-items: flex-start;

    gap: 16px;
  }

}

</style>