import { type Ref } from 'vue'

interface BsodConfig {
  show: Ref<boolean>
  percent: Ref<number>
  isBlackout: Ref<boolean>
  onComplete: () => void 
}

export const triggerBsodEffect = (config: BsodConfig) => {
  console.log('💻 演出10: ブルースクリーンを自動タイムラインで起動します')

  config.show.value = true
  config.percent.value = 0
  config.isBlackout.value = false

  const timer = setInterval(() => {
    if (config.percent.value < 100) {
      config.percent.value += Math.floor(Math.random() * 5) + 1
      if (config.percent.value > 100) config.percent.value = 100
    } else {
      clearInterval(timer)
      console.log('💻 BSOD完了。3秒後に【自動で暗転】します...')

      // ① 3秒後に自動で画面を真っ暗（暗転）にする
      setTimeout(() => {
        config.isBlackout.value = true
        console.log('🔌 暗転中... さらに3秒後に【自動で元の画面に復帰】します...')

        // ② 暗転してからさらに3秒後、自動的に元の画面へ戻す
        setTimeout(() => {
          config.isBlackout.value = false // 🟢 【重要】ここで真っ黒な画面を非表示に戻す！
          config.onComplete()             // 親コンポーネントの全変数（BSOD等）を完全リセット
          console.log('♻️ タイムライン終了。自動復帰しました。')
        }, 3000)

      }, 3000)
    }
  }, 120)
}