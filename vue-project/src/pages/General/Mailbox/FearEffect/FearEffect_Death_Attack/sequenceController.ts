import { type Ref } from 'vue'
import { triggerNotificationEffect } from './notificationEffect'
import { triggerNoiseEffect } from './noiseEffect'
import { triggerEncryptEffect, showEncrypt } from './encryptEffect'

/**
 * 演出11（最前面ポップアップ）が閉じるまで非同期で待機するためのヘルパー関数
 */
const waitForPopupClose = (): Promise<void> => {
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      // showEncrypt が false になったら（ポップアップが自動消滅したら）
      if (!showEncrypt.value) {
        clearInterval(checkInterval)
        resolve() // 待機を解除して次に進む
      }
    }, 100)
  })
}

/**
 * 演出14: すべての演出をスタック＆同時多発で発動させるグランドコンボエフェクト
 * @param notificationsList 通知の配列（ref）
 * @param showNoise ノイズのフラグ（ref）
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
  // 各シチュエーション（会社・学校・日常）の不気味な警告ログ通知を
  // 0.2秒刻みで右下にガガガッと一斉に積み上げ（スタック）ます
  // ----------------------------------------------------
  triggerNoiseEffect(showNoise) // 画面にガガガッと砂嵐ノイズ

  // ビジネス警告ログ
  triggerNotificationEffect(notificationsList, 'business', 1)
  
  // 0.2秒後に学校警告ログ
  setTimeout(() => triggerNotificationEffect(notificationsList, 'school', 1), 200)
  
  // 0.4秒後に日常不正アクセスログ
  setTimeout(() => triggerNotificationEffect(notificationsList, 'daily', 1), 400)
  
  // 0.6秒後にビジネスロック完了ログ
  setTimeout(() => triggerNotificationEffect(notificationsList, 'business', 2), 600)
  
  // 0.8秒後に日常不正出金ログ
  setTimeout(() => triggerNotificationEffect(notificationsList, 'daily', 2), 800)

  // ----------------------------------------------------
  // 🟢 パート2: 【ポップアップのスタック（順番）エリア】
  // 最前面ダイアログは画面を塞ぐため、1つずつ順番に進行します
  // ----------------------------------------------------
  
  // ① まず最初のポップアップ（会社：社内データ暗号化）を起動
  triggerEncryptEffect('business')
  await waitForPopupClose() // ➔ 100%になって自動で消えるまでここでコードを「一時停止」して待つ

  // ② 消えたら間髪入れずに、2つ目のポップアップ（学校：大学サーバー上書き）を起動
  triggerEncryptEffect('school')
  await waitForPopupClose() // ➔ これが消えるまでさらに待つ

  // ③ 最後に3つ目のポップアップ（日常：全財産ハッキング）を起動
  triggerEncryptEffect('daily')
  await waitForPopupClose() // ➔ 最後のポップアップが消えるのを待つ

  // ----------------------------------------------------
  // 🟢 パート3: 【フィナーレ】
  // すべてのポップアップを潜り抜けた直後、最後にもう一度強烈なノイズを挟んでブルースクリーンへ
  // ----------------------------------------------------
  triggerNoiseEffect(showNoise) // 再び激しいデジタルノイズ
  
  setTimeout(() => {
    // 💻 ドカンとブルースクリーン強制起動（100%に達したら3秒待機➔自動一瞬暗転➔3秒後に自動フェード復帰）
    triggerBsodFn() 
  }, 1000)
}
