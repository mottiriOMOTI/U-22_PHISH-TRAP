<template>
  <!--名前が入力されるたび、更新-->
  <h1 class="d-flex justify-center">Welcome! {{ userName }}</h1>

  <v-row cols="12" class="margin-3">
    <v-col v-for="item in cards" :key="item.id">
      <BaseCard
        :append-icon="item.appendIcon"
        :title="item.title"
        :subTitle="item.subTitle"
        :text="item.text"
      />
    </v-col>
  </v-row>

  <div class="d-flex flex-column align-center pa-16 margin-3" width="750">
    <h2 class="mb-1 align-self-start">Enter your name</h2>
    <v-text-field
      variant="outlined"
      label="Name"
      color="primary"
      v-model="userName"
      style="width: 100%"
    />
  </div>
</template>

<script setup lang="ts">
import BaseCard from '@/components/ui/BaseCard.vue'
import { useUserInput } from '@/stores/userInput'
import { ref, watch } from 'vue'

const userInput = useUserInput()

class Card {
  appendIcon: string
  title: string
  subTitle: string
  text: string

  constructor(appendIcon: string, title: string, subTitle: string, text: string) {
    this.appendIcon = appendIcon
    this.title = title
    this.subTitle = subTitle
    this.text = text
  }
}

const userName = ref('')
const cards: Card[] = [
  new Card(
    'mdi-check-bold',
    'check',
    'bold',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod.',
  ),
  new Card(
    'mdi-bell-check-outline',
    'bell',
    'outline',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod.',
  ),
]

//userNameが変更されるたび、ストアのuserNameが更新される
watch(userName, (s) => {
  userInput.userName = s
})
</script>

<style lang="css" scoped>
.margin-3 {
  margin-top: 2em;
}
</style>
