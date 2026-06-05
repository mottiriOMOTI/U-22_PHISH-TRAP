import { ref } from 'vue'

// 🟢 着信画面に必要なデータをすべて集中管理
export const showCall = ref(false)
export const callerName = ref('')
export const callStatus = ref('着信中...')
export const callDuration = ref(0)
export const isCallConnected = ref(false) // 通話が繋がったかどうかのフラグ

let callTimer: any = null
let durationTimer: any = null

/**
 * 演出15: 緊急社内通話の着信ポップアップを開始する
 * @param type かけてくる相手 ('boss' | 'hr')
 */
export const triggerCallEffect = (type: 'boss' | 'hr') => {
  console.log(`📞 演出15: 緊急着信を実行します [ ${type} ]`)

  // タイマーの初期リセット
  if (callTimer) clearTimeout(callTimer)
  if (durationTimer) clearInterval(durationTimer)

  // 状態の初期化
  showCall.value = true
  isCallConnected.value = false
  callDuration.value = 0
  callStatus.value = '社内ネットワークから着信中...'

  if (type === 'boss') {
    callerName.value = 'システム開発部：山田課長 (緊急)'
  } else {
    callerName.value = '人事労務部：コンプライアンス統括'
  }

  // 🔴 応答も拒否もせず放置した場合、10秒後に自動的に「不在着信」として閉じるタイマー
  callTimer = setTimeout(() => {
    if (!isCallConnected.value) {
      console.log('📞 応答がなかったため、不在着信となりました')
      showCall.value = false
    }
  }, 10000)
}

/**
 * 🟢 通話に応答した（緑のボタンを押した）時の処理
 */
export const answerCall = () => {
  if (callTimer) clearTimeout(callTimer) // 不在着信タイマーを解除
  
  isCallConnected.value = true
  callStatus.value = '通話中...'
  
  // 1秒ごとに通話時間をカウントアップするタイマー
  durationTimer = setInterval(() => {
    callDuration.value++
  }, 1000)
}

/**
 * 🟢 通話を拒否した、または切断した（赤のボタンを押した）時の処理
 */
export const hangUpCall = () => {
  if (callTimer) clearTimeout(callTimer)
  if (durationTimer) clearInterval(durationTimer)
  
  showCall.value = false
  isCallConnected.value = false
  callDuration.value = 0
  console.log('📞 通話が切断されました')
}

/**
 * 通話時間を 「00:00」 の形式の文字列に変換するヘルパー関数
 */
export const formatCallTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
