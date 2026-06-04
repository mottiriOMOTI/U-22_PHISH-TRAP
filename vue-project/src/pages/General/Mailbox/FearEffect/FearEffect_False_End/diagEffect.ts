import { ref } from 'vue'

// 画面表示に必要なフラグを管理
export const showDiag = ref(false)
export const mailSubject = ref('')
export const mailSender = ref('')
export const mailAddress = ref('')
export const mailBody = ref('')
export const popupColor = ref('')
export const popupBgColor = ref('')
// 🟢 【追加】強制開封（バツなしタイマー式）かどうかを親に伝える変数
export const isForcedMode = ref(false)

let falseTimer: any = null

/**
 * 演出3, 11, 12, およびその他の最前面ポップアップ共通処理
 * @param type 開封するメールの種類 ('overdue' | 'penalty' | 'fired')
 * @param isForced 🟢 追加: trueなら5秒で自動で閉じる、falseなら自動で閉じない（✖ボタン用）
 */
export const triggerDiagEffect = (type: 'overdue' | 'penalty' | 'fired', isForced: boolean = true) => {
  console.log(`📧 最前面メール開封を実行: [ ${type} ] (強制モード: ${isForced})`)

  if (falseTimer) clearTimeout(falseTimer)

  // 🟢 モードのフラグをセット
  isForcedMode.value = isForced

  // タイプ別に出し分けデータを注入
  switch (type) {
    case 'overdue':
      mailSubject.value = '【大至急】先ほど詐欺通報されたメールについて（至急確認してください）'
      mailSender.value = 'システム開発部：上司（課長）'
      mailAddress.value = 'boss_kacho@company.co.jp'
      mailBody.value = 'お疲れ様です。先ほどあなたがフィッシング詐欺としてシステム通報したメールですが、あれは公式クライアント（重要顧客）からの緊急案件メールですよ！！\n既に先方への回答納期を過ぎており、現場が大混乱しています。サボっている暇はありません、このメッセージを見たら大至急私のデスクに来るか、直接クライアントへ謝罪の連絡を入れてください。'
      popupColor.value = '#ff9800'
      popupBgColor.value = '#fff9f0'
      break

    case 'penalty':
      mailSubject.value = '【重要・公式通達】業務メールの虚偽報告（不適切行為）に関する服務調査について'
      mailSender.value = '人事労務部：コンプライアンス遵守委員会'
      mailAddress.value = 'jinji_compliance@company.co.jp'
      mailBody.value = '対象者に対しては、本日より事実関係のヒアリング調査を開始し、就業規則に基づき厳正な処分を検討いたします。'
      popupColor.value = '#ff5252'
      popupBgColor.value = '#fff5f5'
      break

    case 'fired':
      mailSubject.value = '【通達】就業規則に基づく懲戒解雇処分の決定について'
      mailSender.value = '経営審議会・法務部：人事最高責任者'
      mailAddress.value = 'board_executive@company.co.jp'
      mailBody.value = '度重なる重大な業務命令の拒否、虚偽通報による基幹システムへの混乱、および重大な職務怠慢（故意の業務放置）による会社への多大な損害を鑑み、経営審議会の全会一致により、あなたを【懲戒解雇処分】とすることを決定致しました。'
      popupColor.value = '#ff1a1a'
      popupBgColor.value = '#ffebee'
      break
  }

  // ダイアログを開く
  showDiag.value = true

  // 🟢 【重要】isForced（強制）が true の場合のみ、5秒の自動消滅タイマーを起動する
  if (isForced) {
    falseTimer = setTimeout(() => {
      showDiag.value = false
    }, 5000)
  }
}

/**
 * 状態リセット関数
 */
export const resetDiagEffect = () => {
  if (falseTimer) clearTimeout(falseTimer)
  showDiag.value = false
}
