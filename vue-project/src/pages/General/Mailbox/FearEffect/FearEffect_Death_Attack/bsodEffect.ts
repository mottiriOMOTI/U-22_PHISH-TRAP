// src/pages/General/Mailbox/FearEffect/FearEffect_Death_Attack/bsodEffect.ts
import { type Ref } from 'vue'

interface BsodConfig {
  show: Ref<boolean>
  percent: Ref<number>
}

export const triggerBsodEffect = (config: BsodConfig) => {
  console.log('💻 演出8: ブルースクリーンを起動します')

  // 🟢 .value をつけて画面を表示
  config.show.value = true
  config.percent.value = 0

  const timer = setInterval(() => {
    if (config.percent.value < 100) {
      // 🟢 カウントアップも .value に対して行う
      config.percent.value += Math.floor(Math.random() * 5) + 1
      if (config.percent.value > 100) config.percent.value = 100
    } else {
      clearInterval(timer)
      console.log('💻 BSOD完了')
    }
  }, 120)
}
