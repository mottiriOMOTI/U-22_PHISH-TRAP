import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useUserInput = defineStore('userInput', {
  //変数宣言
  state: () => ({
    userName: '' as string,
  }),

  //関数宣言
  actions: {},
})
