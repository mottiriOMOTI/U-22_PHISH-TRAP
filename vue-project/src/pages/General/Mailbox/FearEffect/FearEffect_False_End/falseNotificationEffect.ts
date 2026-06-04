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
 * False画面用: 疑似ビジネス通知をストックして積み重ねるエフェクト
 * @param notificationsList 親コンポーネントの通知配列（ref）
 * @param type 通知のバリエーションタイプ
 */
export const triggerFalseNotification = (notificationsList: Ref<NotificationConfig[]>, type: 'miss' | 'info' | 'overdue' | 'penalty' | 'fired') => {
  console.log(`🔔 誤判定ペナルティ通知を追加: [ ${type} ]`)

  const id = Date.now() + Math.random().toString(36).substr(2, 9)
  let newToast: NotificationConfig = {
    id,
    title: '',
    text: '',
    icon: '',
    color: '',
    borderClass: ''
  }

  switch (type) {
    case 'miss':
      newToast.title = '⚠ 判定ミスの可能性'
      newToast.text = 'このメールには不正なURLや不審なヘッダー情報は見つかりませんでした。'
      newToast.icon = 'mdi-alert-circle'
      newToast.color = '#ffb300' // 黄色
      newToast.borderClass = 'border-yellow'
      break

    case 'info':
      newToast.title = 'ℹ️ 正常な通信ドメイン'
      newToast.text = '送信元のドメイン（@以降）は公式の正規サーバーと一致しています。安全です。'
      newToast.icon = 'mdi-information-outline'
      newToast.color = '#03a9f4' // 青色
      newToast.borderClass = 'border-blue'
      break

    // 🟢 【追加】演出4: 納期超過の件について
    case 'overdue':
      newToast.title = '💬 上司 [ 納期超過の件について ]'
      newToast.text = '先ほど詐欺報告されたメール、公式のクライアントからの緊急案件ですよ！すでに締切を過ぎています。至急連絡してください。'
      newToast.icon = 'mdi-message-alert'
      newToast.color = '#ff9800' // オレンジ
      newToast.borderClass = 'border-orange'
      break

    // 🟢 【追加】演出5: 今回の処分について
    case 'penalty':
      newToast.title = '📧 人事部 [ 今回の処分について ]'
      newToast.text = '重要顧客からの業務メールを故意に破棄・または虚偽報告（サボり）した件について、社内規定に基づき事実関係の調査を行います。'
      newToast.icon = 'mdi-email-alert'
      newToast.color = '#ff5252' // 赤
      newToast.borderClass = 'border-red'
      break

    // 🟢 【追加】演出6: 解雇通知
    case 'fired':
      newToast.title = '🚨 経営審議会 [ 解雇通知 ]'
      newToast.text = '度重なる重大な業務放棄、および社内秩序の著しい乱れを鑑み、労働基準法に基づき令和◯年◯月◯日を以て懲戒解雇処分と致します。'
      newToast.icon = 'mdi-account-remove'
      newToast.color = '#ff1a1a' // 鮮やかな赤
      newToast.borderClass = 'border-red'
      break
  }

  notificationsList.value.push(newToast)

  // 4秒後に自動消滅するタイマー
  setTimeout(() => {
    notificationsList.value = notificationsList.value.filter(item => item.id !== id)
  }, 4000)
}