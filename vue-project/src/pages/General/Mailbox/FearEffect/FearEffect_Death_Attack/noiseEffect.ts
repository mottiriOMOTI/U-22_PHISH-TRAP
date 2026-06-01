// src/pages/General/Mailbox/FearEffect/FearEffect_Death_Attack/noiseEffect.ts
import { type Ref } from 'vue'

export const triggerNoiseEffect = (isNoiseActive: Ref<boolean>) => {
  console.log('📺 演出7: 画面ノイズエフェクトを実行します')

  // 🟢 必ず .value をつけて書き換えます
  isNoiseActive.value = true

  // 1.2秒後に自動でノイズを消去
  setTimeout(() => {
    isNoiseActive.value = false
  }, 1200)
}
