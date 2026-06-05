import { ref } from 'vue'
import { type SituationTag } from './falseNotificationEffect'

export const showCall = ref(false)
export const callerName = ref('')
export const callStatus = ref('着信中...')
export const callDuration = ref(0)
export const isCallConnected = ref(false)
export const callAudioLog = ref('') // 🟢 上司・先生・サービスの怒鳴り声を切り替える用

let callTimer: any = null
let durationTimer: any = null

export const triggerCallEffect = (tag: SituationTag) => {
  if (callTimer) clearTimeout(callTimer)
  if (durationTimer) clearInterval(durationTimer)

  showCall.value = true
  isCallConnected.value = false
  callDuration.value = 0
  callStatus.value = '緊急通信プロトコルで着信中...'

  // 🟢 タグに合わせて発信者名と繋がりメッセージを変更
  if (tag === 'business') {
    callerName.value = 'システム開発部：山田課長 (緊急)'
    callAudioLog.value = '「もしもし！？おい、何メール破棄してんだ！現場が大混乱だぞ、今すぐデスクに戻れ！！」'
  } else if (tag === 'school') {
    callerName.value = '学年主任：小林先生 (学務携帯)'
    callAudioLog.value = '「もしもし！教務課からの留年警告メールをスパム報告したって本当か！？大至急職員室に来なさい！」'
  } else if (tag === 'daily') {
    callerName.value = 'ライフライン管理センター：担当窓口'
    callAudioLog.value = '「お電話繋がりました。料金通知メールをブロックされたため未払いです。10分後に電気を止めます」'
  }

  callTimer = setTimeout(() => {
    if (!isCallConnected.value) showCall.value = false
  }, 10000)
}

export const answerCall = () => {
  if (callTimer) clearTimeout(callTimer)
  isCallConnected.value = true
  callStatus.value = '通話中...'
  durationTimer = setInterval(() => { callDuration.value++ }, 1000)
}

export const hangUpCall = () => {
  if (callTimer) clearTimeout(callTimer)
  if (durationTimer) clearInterval(durationTimer)
  showCall.value = false
  isCallConnected.value = false
}

export const formatCallTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
