<template>
  <!--ストアから参照-->
  <div v-if="userInput.userName">
    <h1 class="d-flex justify-center">Store name is {{ userInput.userName }}</h1>
  </div>
  <div v-else>
    <h1 class="d-flex justify-center">What your name?</h1>
  </div>

  <!--TODO：ボタンを押したらjsonを取ってくるapiを叩き、api結果を表示するコードを書く-->

  <v-container class="d-flex flex-column align-center">
    <div class="d-flex ga-4">
      <v-btn @click="get" color="primary">json取得</v-btn>
      <v-btn @click="clear" color="error">削除</v-btn>
    </div>
    <div class="mt-4">
      <v-row>
        <!--12 / 4 = 3行(PC)  12 / 12 = 1行(スマホ)-->
        <!--mdはPC画面。smはスマホ画面-->
        <v-col md="4" sm="12" v-for="item in data" :key="item.id">
          <BaseCard :title="item.name" :subtitle="item.email" />
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUserInput } from '../stores/userInput'
import { jsonget } from '../api/jsongetApi'
import BaseCard from '@/components/ui/BaseCard.vue'

const userInput = useUserInput()
const data = ref<unknown>(null)

async function get() {
  //jsonデータを取得。本来はjsonデータはクラスを使って、型定義をする
  const r = await jsonget()
  data.value = r
}

function clear() {
  data.value = ''
}
</script>
