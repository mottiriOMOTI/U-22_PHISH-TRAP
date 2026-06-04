import { type Ref } from 'vue'
import { triggerNotificationEffect } from './notificationEffect'
import { triggerNoiseEffect } from './noiseEffect'
import { triggerEncryptEffect, showEncrypt } from './encryptEffect'
import { triggerFlashEffect } from './flashEffect'

/**
 * 演出11（最前面ポップアップ）が閉じるまで非同期で待機するためのヘルパー関数
 */
const waitForPopupClose = (): Promise<void> => {
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      // encryptEffect.ts 内の showEncrypt が false になったら（ポップアップが自動消滅したら）
      if (!showEncrypt.value) {
        clearInterval(checkInterval)
        resolve() // 待機を解除して次に進む
      }
    }, 100)
  });
}

/**
 * 演出14: すべての演出をスタック＆同時多発で発動させるグランドコンボエフェクト
 * @param notificationsList 通知の配列（ref）
 * @param triggerBsodFn 親から渡されるブルースクリーン起動関数
 */
export const triggerSequenceEffect = async (
  notificationsList: Ref<any[]>,
  showNoise: Ref<boolean>,
  triggerBsodFn: () => void
) => {
  console.log('☣️ 演出14: 全演出同時多発・絶望のシーケンスを開始します')

  // ----------------------------------------------------
  // 🟢 パート1: 【同時並列エリア】
  // 通知の大量ストック連打と、画面の砂嵐ノイズを同時に一斉発動！
  // ----------------------------------------------------

   triggerFlashEffect()

  // ----------------------------------------------------
  // 🟢 パート2: 【ポップアップのスタック（順番）エリア】
  // 最前面ダイアログは画面を塞ぐため、1つずつ順番に処理します
  // ----------------------------------------------------
  
  // ① まず最初のポップアップ（ウイルス強制スキャン）を起動
  triggerEncryptEffect('scan')
  await waitForPopupClose() // ➔ 100%になって自動で消えるまで、ここでコードを「一時停止」して待つ

  // ② 消えたら間髪入れずに、2つ目のポップアップ（システム破壊）を起動
  triggerEncryptEffect('destroy')
  await waitForPopupClose() // ➔ これが消えるまでさらに待つ

  // ③ 最後に3つ目のポップアップ（身代金要求）を起動
  triggerEncryptEffect('ransom')
  await waitForPopupClose() // ➔ 最後のポップアップが消えるのを待つ

  // ----------------------------------------------------
  // 🟢 パート3: 【フィナーレ】
  // すべてのポップアップを潜り抜けた直後、最後にもう一度強烈なノイズを挟んでブルースクリーンへ
  // ----------------------------------------------------
  
triggerNotificationEffect(notificationsList, 'warning')
  setTimeout(() => triggerNotificationEffect(notificationsList, 'warning'), 100)
  setTimeout(() => triggerNotificationEffect(notificationsList, 'warning'), 200)
  setTimeout(() => triggerNotificationEffect(notificationsList, 'warning'), 300)
  setTimeout(() => triggerNotificationEffect(notificationsList, 'warning'), 400)
  setTimeout(() => triggerNotificationEffect(notificationsList, 'warning'), 500)
  setTimeout(() => triggerNotificationEffect(notificationsList, 'warning'), 600)

  setTimeout(() => {
    triggerBsodFn() // 💻 ブルースクリーン強制起動 ➔ 100%後に自動暗転へ
  }, 1000)
}
