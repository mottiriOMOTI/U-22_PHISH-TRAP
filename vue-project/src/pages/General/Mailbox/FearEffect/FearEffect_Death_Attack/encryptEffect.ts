import { ref } from 'vue'

// 🟢 画面表示に必要なリアクティブデータを一元管理
export const showEncrypt = ref(false)
export const encryptProgress = ref(0)
export const encryptStatusText = ref('')
export const encryptMainText = ref('')
export const encryptChecklist = ref<string[]>([])
export const popupTitle = ref('')
export const popupIcon = ref('')
export const popupColor = ref('')

// タイマーの参照を保持する変数
let encryptTimer: any = null

/**
 * 演出11~13: 最前面警告ポップアップを種類別に出し分けるエフェクト
 * @param type ポップアップのバリエーションタイプ ('ransom' | 'scan' | 'destroy' | 'camera')
 */
export const triggerEncryptEffect = (type: 'ransom' | 'scan' | 'destroy' | 'camera') => {
  console.log(`🔒 最前面ポップアップを実行: [ ${type} ]`)

  // すでにタイマーが動いていたら一度クリア（連打対策）
  if (encryptTimer) clearInterval(encryptTimer)

  // 内部の状態を初期化して画面を表示
  showEncrypt.value = true
  encryptProgress.value = 0

  // 🟢 タイプ別に出し分けデータを注入
  switch (type) {
    case 'ransom':
      popupTitle.value = 'WARNING: ファイル暗号化中...'
      popupIcon.value = 'mdi-lock-alert'
      popupColor.value = 'purple-accent-4'
      encryptMainText.value = 'あなたのコンピュータ内にあるすべての重要ドキュメント、データベース、画像、およびシステムファイルが暗号化されました。'
      encryptStatusText.value = 'システムファイルをスキャン中...'
      encryptChecklist.value = [
        '独自の復号ツールを購入する必要があります。自身での修復試行はデータを破壊します。',
        '指定された暗号通貨（Bitcoin）ウォレットへ、期限内に身代金を送金してください。',
        '48時間を過ぎると復号キーは永久に消去され、二度と復元できなくなります。'
      ]
      break

    case 'scan':
      popupTitle.value = 'CRITICAL: 不審な活動を検出'
      popupIcon.value = 'mdi-shield-search'
      popupColor.value = 'red-accent-4'
      encryptMainText.value = 'システムバックグラウンドで悪意のあるトロイの木馬プロセスが実行されました。現在強制スキャンを実行しています。'
      encryptStatusText.value = 'ルートディレクトリを走査中...'
      encryptChecklist.value = [
        '検出された脅威: Trojan.Win32.Generic (深刻な危険)',
        'プロセスの強制終了を試みています。PCの電源を切らないでください。',
        'メモリハックの形跡が見つかりました。認証情報が漏洩している可能性があります。'
      ]
      break

    case 'destroy':
      popupTitle.value = 'ALERT: ハッカーによるシステム上書き'
      popupIcon.value = 'mdi-skull'
      popupColor.value = 'deep-orange-accent-4'
      encryptMainText.value = 'リモートアクセス（RAT）が確立されました。ローカルのシステムログおよびMBR（マスターブートレコード）の書き換えが開始されました。'
      encryptStatusText.value = 'C:\\Windows\\System32 を書き換え中...'
      encryptChecklist.value = [
        '警告：この操作はハッカーによって遠隔から強制実行されています。',
        'セキュリティソフトウェアは完全に無効化されました。',
        'まもなくオペレーティングシステムが崩壊します。'
      ]
      break

    case 'camera':
      popupTitle.value = 'Camera: カメラ作動中'
      popupIcon.value = 'mdi-webcam'
      popupColor.value = 'deep-yellow-accent-4'
      encryptMainText.value = '現在カメラが作動しています。周囲の映像がリアルタイムで外部に送信されています。'
      encryptStatusText.value = '映像を保存中...'
      encryptChecklist.value = [
        '現在の映像はすでに外部サーバーに保存されています。',
        '映像情報からあなたの位置情報が特定される可能性があります。',
        'この機能の利用は、規約に同意したものとみなされます。'
      ]
      break
  }

  // 🟢 進捗を進めるタイマー処理
  encryptTimer = setInterval(() => {
    if (encryptProgress.value < 100) {
      // リアルなランダム進捗
      encryptProgress.value += Math.random() * 1.2 + 0.6
      
      // ランサムウェアタイプの場合のみ進捗テキストを細かく変える
      if (type === 'ransom') {
        if (encryptProgress.value > 15 && encryptProgress.value <= 45) {
          encryptStatusText.value = 'ドキュメント・画像を暗号化中...'
        } else if (encryptProgress.value > 45 && encryptProgress.value <= 80) {
          encryptStatusText.value = 'データベースおよび認証ログを暗号化中...'
        } else if (encryptProgress.value > 80 && encryptProgress.value < 100) {
          encryptStatusText.value = 'バックアップデータを完全消去中...'
        }
      } else if (type === 'scan') {
        encryptStatusText.value = `メモリダンプを解析中... (${Math.floor(encryptProgress.value)}/100)`
      } else if (type === 'destroy') {
        encryptStatusText.value = `MBRセクター領域を物理上書き中...`
      } else if (type === 'camera') {
        if (encryptProgress.value > 15 && encryptProgress.value <= 45) {
          encryptStatusText.value = '映像を暗号化中...'
        } else if (encryptProgress.value > 45 && encryptProgress.value <= 80) {
          encryptStatusText.value = '映像をアップロード中...'
        } else if (encryptProgress.value > 80 && encryptProgress.value < 100) {
          encryptStatusText.value = 'アップロードはもうすぐ完了します'
        }
      }
      
      if (encryptProgress.value > 100) encryptProgress.value = 100

    } else {
      clearInterval(encryptTimer)
      encryptStatusText.value = '❌ プロセス完了'
      
      // 100%になったら0.8秒後に自動でポップアップを閉じる
      setTimeout(() => {
        showEncrypt.value = false
      }, 800)
    }
  }, 50)
}

/**
 * 状態リセット関数
 */
export const resetEncryptEffect = () => {
  if (encryptTimer) clearInterval(encryptTimer)
  showEncrypt.value = false
  encryptProgress.value = 0
  encryptStatusText.value = ''
}
