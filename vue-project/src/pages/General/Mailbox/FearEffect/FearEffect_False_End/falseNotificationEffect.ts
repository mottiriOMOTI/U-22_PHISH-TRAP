import { type Ref } from 'vue'

interface NotificationConfig {
  id: string
  title: string
  text: string
  icon: string
  color: string
  borderClass: string
}

export type SituationTag = 'business' | 'school' | 'daily'

/**
 * False画面用: シチュエーション別の疑似ビジネス/学校/日常通知
 * @param notificationsList 親コンポーネントの通知配列（ref）
 * @param tag 🟢 シチュエーションタグ
 * @param level 深刻度レベル (1 = 警告, 2 = 処分)
 */
export const triggerFalseNotification = (
  notificationsList: Ref<NotificationConfig[]>, 
  tag: SituationTag,
  level: 1 | 2
) => {
  console.log(`🔔 疑似通知スタックを追加: [ ${tag} / Level: ${level} ]`)

  const id = Date.now() + Math.random().toString(36).substr(2, 9)
  let newToast: NotificationConfig = { id, title: '', text: '', icon: '', color: '', borderClass: '' }

  // 🟢 シチュエーション×深刻度レベル でテキストを全網羅
  if (tag === 'business') {
    if (level === 1) {
      newToast.title = '💬 上司 [ 納期超過の件について ]'
      newToast.text = '先ほど詐欺報告されたメール、公式クライアントの緊急案件ですよ！すでに締切を過ぎています。至急連絡を！'
      newToast.icon = 'mdi-message-alert'
      newToast.color = '#ff9800'
      newToast.borderClass = 'border-orange'
    } else {
      newToast.title = '📧 人事部 [ 今回の処分について ]'
      newToast.text = '重要顧客からの業務メールを故意に虚偽報告（サボり）した件について、就業規則に基づき事実関係の服務調査を行います。'
      newToast.icon = 'mdi-email-alert'
      newToast.color = '#ff5252'
      newToast.borderClass = 'border-red'
    }
  } else if (tag === 'school') {
    if (level === 1) {
      newToast.title = '🎓 学務課 [ 未提出課題の督促 ]'
      newToast.text = 'あなたが迷惑メール報告した「教務システム通知」、期末レポートの最終提出案内です！未提出だと留保になります。'
      newToast.icon = 'mdi-school'
      newToast.color = '#ff9800'
      newToast.borderClass = 'border-orange'
    } else {
      newToast.title = '🚨 学生委員会 [ 懲罰・呼出通達 ]'
      newToast.text = '重要システムからの公式案内を複数回にわたり虚偽のスパム通報し、サーバーログを混乱させた件で、明日親同伴で呼出です。'
      newToast.icon = 'mdi-alert-octagon'
      newToast.color = '#ff5252'
      newToast.borderClass = 'border-red'
    }
  } else if (tag === 'daily') {
    if (level === 1) {
      newToast.title = '💳 銀行アプリ [ 残高不足・再引落不可 ]'
      newToast.text = '安全な自動引き落としの正規通知をブロックしたため、家賃・光熱費の決済に失敗しました。遅延損害金が発生します。'
      newToast.icon = 'mdi-credit-card-remove'
      newToast.color = '#ff9800'
      newToast.borderClass = 'border-orange'
    } else {
      newToast.title = '⚖️ 裁判所ポータル [ 民事訴訟告知 ]'
      newToast.text = '正規の契約更新メールを詐欺として破棄・放置したため、規約違反による損害賠償請求訴訟の準備段階に入りました。'
      newToast.icon = 'mdi-gavel'
      newToast.color = '#ff1a1a'
      newToast.borderClass = 'border-red'
    }
  }

  notificationsList.value.push(newToast)

  setTimeout(() => {
    notificationsList.value = notificationsList.value.filter(item => item.id !== id)
  }, 4000)
}
