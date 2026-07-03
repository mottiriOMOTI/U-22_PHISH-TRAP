import { ref } from 'vue'

export const showEncrypt = ref(false)
export const encryptProgress = ref(0)
export const encryptStatusText = ref('')
export const encryptMainText = ref('')
export const encryptChecklist = ref<string[]>([])
export const popupTitle = ref('')
export const popupIcon = ref('')
export const popupColor = ref('')

let encryptTimer: any = null

/**
 * 最前面破滅ポップアップ（シチュエーションタグ対応版）
 */
export const triggerEncryptEffect = (tag: 'business' | 'school' | 'daily') => {
  console.log(`🔒 Death最前面ポップアップを実行: [ ${tag} ]`)

  if (encryptTimer) clearInterval(encryptTimer)
  showEncrypt.value = true
  encryptProgress.value = 0

  switch (tag) {
    case 'business':
      popupTitle.value = 'WARNING: 社内データ完全暗号化中'
      popupIcon.value = 'mdi-lock-alert'
      popupColor.value = '#aa00ff' // 妖しい紫
      encryptMainText.value = '社内機密ファイル、財務ログ、顧客の個人情報データすべての暗号化が開始されました。'
      encryptStatusText.value = '企業データベースをパッキング中...'
      encryptChecklist.value = [
        '独自の復号ツールを購入する必要があります。自身での修復試行はサーバーを完全破壊します。',
        '指定のBitcoinウォレットへ、期限内（48時間）に身代金を送金してください。',
        '期限が過ぎると復号キーは破棄され、企業の信頼性ごと全てのデータが永久に失われます。'
      ]
      break

    case 'school':
      popupTitle.value = 'CRITICAL: 大学サーバー上書きロック'
      popupIcon.value = 'mdi-skull'
      popupColor.value = '#d50000' // 赤
      encryptMainText.value = '学内ネットワークにインジェクションが完了。全学生の成績証明ログ、履修マスター、研究室ファイルの暗号化を実行中です。'
      encryptStatusText.value = 'C:\\University\\Gakumu_Data を書き換え中...'
      encryptChecklist.value = [
        '警告：この操作はハッカーによって遠隔から強制実行されています。',
        'セキュリティ管理者への通報は、暗号化スピードを2倍に加速させる自動プログラムを起動します。',
        '修復不可能なレベルまで学籍情報が上書きされる前に、要求に従ってください。'
      ]
      break

    case 'daily':
      popupTitle.value = 'ALERT: スマホ＆PC全財産ハッキング'
      popupIcon.value = 'mdi-incognito'
      popupColor.value = '#ff6d00' // ダークオレンジ
      encryptMainText.value = 'あなたのWebカメラ、写真、キー入力、SNSのパスワード、およびオンラインウォレットの全履歴を奪取・ロックしました。'
      encryptStatusText.value = '写真フォルダ（DCIM）をリモート転送中...'
      encryptChecklist.value = [
        'すべてのローカルファイルは強力な暗号（AES-256）で完全にロックされました。',
        '本日中に送金がない場合、あなたの非公開写真や個人データすべてを連絡先全員に自動暴露します。',
        '端末の初期化を行っても、クラウド上のリークサーバーからデータが消えることはありません。'
      ]
      break
  }

  encryptTimer = setInterval(() => {
    if (encryptProgress.value < 100) {
      encryptProgress.value += Math.random() * 1.2 + 0.6
      
      if (encryptProgress.value > 100) encryptProgress.value = 100
    } else {
      clearInterval(encryptTimer)
      encryptStatusText.value = '❌ プロセス完了。すべてのデータが失われました。'
      
      setTimeout(() => {
        showEncrypt.value = false
      }, 800)
    }
  }, 50)
}

export const resetEncryptEffect = () => {
  if (encryptTimer) clearInterval(encryptTimer)
  showEncrypt.value = false
  encryptProgress.value = 0
  encryptStatusText.value = ''
}
