import { type Ref } from 'vue'

interface NotificationConfig {
  id: string
  title: string
  text: string
  icon: string
  color: string
  borderClass: string
}

/**
 * Death画面用: シチュエーション別の破滅通知スタック
 */
export const triggerNotificationEffect = (
  notificationsList: Ref<NotificationConfig[]>, 
  tag: 'business' | 'school' | 'daily',
  level: 1 | 2
) => {
  console.log(`🔔 Death疑似通知スタックを追加: [ ${tag} / Level: ${level} ]`)

  const id = Date.now() + Math.random().toString(36).substr(2, 9)
  let newToast: NotificationConfig = { id, title: '', text: '', icon: '', color: '', borderClass: '' }

  if (tag === 'business') {
    if (level === 1) {
      newToast.title = '🚨 SYSTEM COMPROMISED'
      newToast.text = '社内ファイルサーバーの全域に不正アクセスを検知。感染拡大中。'
      newToast.icon = 'mdi-shield-alert'
      newToast.color = '#ff9800'
      newToast.borderClass = 'border-orange'
    } else {
      newToast.title = '🔒 CRITICAL LOCKOUT'
      newToast.text = '社外秘の顧客データベースが完全に暗号化されました。身代金要求ノートを確認してください。'
      newToast.icon = 'mdi-lock-alert'
      newToast.color = '#ff1a1a'
      newToast.borderClass = 'border-red'
    }
  } else if (tag === 'school') {
    if (level === 1) {
      newToast.title = '⚠️ NETWORK ALERT'
      newToast.text = '大学統合認証システム（教務ポータル）へのDDoS、およびマルウェアのバックドアを確認。'
      newToast.icon = 'mdi-lan-disconnect'
      newToast.color = '#ff9800'
      newToast.borderClass = 'border-orange'
    } else {
      newToast.title = '💀 DISASTER: DATA LOST'
      newToast.text = '学籍データ、履修登録ログ、および教員の研究論文データが完全消去されました。'
      newToast.icon = 'mdi-virus'
      newToast.color = '#ff5252'
      newToast.borderClass = 'border-red'
    }
  } else if (tag === 'daily') {
    if (level === 1) {
      newToast.title = '🔒 ID COMPROMISED'
      newToast.text = 'Apple ID / Google アカウントのパスワードが不正に変更されました。セッションを強制切断。'
      newToast.icon = 'mdi-account-key'
      newToast.color = '#ff9800'
      newToast.borderClass = 'border-orange'
    } else {
      newToast.title = '💸 BANKING FRAUD'
      newToast.text = 'オンラインバンキング、および紐付けられた全クレジットカードから限度額いっぱいの不正出金を検知。'
      newToast.icon = 'mdi-cash-remove'
      newToast.color = '#ff1a1a'
      newToast.borderClass = 'border-red'
    }
  }

  notificationsList.value.push(newToast)

  setTimeout(() => {
    notificationsList.value = notificationsList.value.filter(item => item.id !== id)
  }, 4000)
}
