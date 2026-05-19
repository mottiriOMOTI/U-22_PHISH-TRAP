<template>
  <v-card
    variant="tonal"
    prepend-icon="mdi-account"
    :append-icon="appendIcon"
    :title="title"
    :subtitle="subTitle"
    :text="text"
  >
  </v-card>
</template>

<script setup lang="ts">
//受け取る引数
const title = defineModel<string>('title')
const subTitle = defineModel<string>('subTitle')
const text = defineModel<string>('text')
const appendIcon = defineModel<string>('appendIcon')
</script>
