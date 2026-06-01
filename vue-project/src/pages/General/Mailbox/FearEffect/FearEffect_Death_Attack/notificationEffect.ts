import { type Ref } from 'vue'

/**
 * 演出4~6: 疑似デスクトップ通知をストックして積み重ねるエフェクト
 * @param notificationsList 親コンポーネントの通知配列（ref）
 * @param type 通知のバリエーションタイプ
 */
export const triggerNotificationEffect = (notificationsList: Ref<any[]>, type: 'warning' | 'trojan' | 'ransom' | 'Shatter' | 'message') => {
  console.log(`🔔 疑似通知スタックを追加: [ ${type} ]`)

  // 各通知を識別するためのユニークなIDと、初期データオブジェクトを作成
  const id = Date.now() + Math.random().toString(36).substr(2, 9)
  let newToast = {
    id,
    title: '',
    text: '',
    icon: '',
    color: '',
    borderClass: ''
  }

  // タイプ別に出し分け
  switch (type) {
    case 'warning':
      newToast.title = '⚠️ セキュリティ警告'
      newToast.text = 'システムが危険にさらされています。今すぐ対策が必要です。'
      newToast.icon = 'mdi-shield-alert'
      newToast.color = '#ff5252'
      newToast.borderClass = 'border-red'
      break

    case 'trojan':
      newToast.title = '🚨 トロイの木馬検出'
      newToast.text = 'バックグラウンドで不審な通信ログを検知しました。スキャンを推奨します。'
      newToast.icon = 'mdi-virus'
      newToast.color = '#ff9800'
      newToast.borderClass = 'border-orange'
      break

    case 'ransom':
      newToast.title = '🔒 CRITICAL LOCKOUT'
      newToast.text = 'すべてのローカルファイルが暗号化されました。解除キーを要求します。'
      newToast.icon = 'mdi-lock-alert'
      newToast.color = '#ff1a1a'
      newToast.borderClass = 'border-red'
      break

    case 'Shatter':
      newToast.title = '📸 写真を保存'
      newToast.text = '写真を送信しました。'
      newToast.icon = 'mdi-camera'
      newToast.color = '#4caf50'
      newToast.borderClass = 'border-green'
      break

    case 'message':
      newToast.title = '✉ 請求書が届きました'
      newToast.text = '今すぐ指定のURLにアクセスして、支払いを完了してください。'
      newToast.icon = 'mdi-email'
      newToast.color = '#05b0ff'
      newToast.borderClass = 'border-green'
      break
  }

  // 🟢 親の配列にデータを追加（これで画面に新しい通知が生成される）
  notificationsList.value.push(newToast)

  // 🟢 3.5秒後に、追加したこの通知だけをピンポイントで削除するタイマーを起動
  setTimeout(() => {
    notificationsList.value = notificationsList.value.filter(item => item.id !== id)
  }, 3500)
}
