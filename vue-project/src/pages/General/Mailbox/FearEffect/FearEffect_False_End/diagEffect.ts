import { ref } from 'vue'
import { type SituationTag } from './falseNotificationEffect'

export const showDiag = ref(false)
export const mailSubject = ref('')
export const mailSender = ref('')
export const mailAddress = ref('')
export const mailBody = ref('')
export const popupColor = ref('')
export const popupBgColor = ref('')
export const isForcedMode = ref(false)

let falseTimer: any = null

/**
 * 最前面メール開封ペナルティポップアップ（シチュエーションタグ対応）
 */
export const triggerDiagEffect = (tag: SituationTag, isForced: boolean = true) => {
  console.log(`📧 最前面メール開封: [ ${tag} ] (強制: ${isForced})`)

  if (falseTimer) clearTimeout(falseTimer)
  isForcedMode.value = isForced
  showDiag.value = true

  // 🟢 タグに応じて最前面に割り込むメールの中身を切り替え
  if (tag === 'business') {
    mailSubject.value = '【重要】服務規程違反および重要案件放置に関する顛末書の提出要請'
    mailSender.value = '総務人事部：コンプライアンス管理委員会'
    mailAddress.value = 'jinji_rules@company.co.jp'
    mailBody.value = '本日発生した、正規取引先からの緊急業務メールを「フィッシング詐欺」として虚偽システム報告を行った事案について、社内セキュリティ服務規程に著しく違反したと判断いたします。本件に伴う損失および経緯を記した顛末書を大至急提出してください。'
    popupColor.value = '#ff5252'
    popupBgColor.value = '#fff5f5'
  } else if (tag === 'school') {
    mailSubject.value = '【通知】大学教務規程に基づく特別面談（親同伴）と指導書の交付について'
    mailSender.value = '学生支援・教学統括本部：学部長室'
    mailAddress.value = 'gakumu_support@university.ac.jp'
    mailBody.value = '重要課題の提出案内メールを故意に虚偽通報・破棄し、大学の管理システム運用を妨害した件について確認を行います。就業・就学態度に重大な問題があると認められるため、保証人（親）同伴の上、教授会による緊急面談を行います。'
    popupColor.value = '#ff9800'
    popupBgColor.value = '#fff9f0'
  } else if (tag === 'daily') {
    mailSubject.value = '【電子送達】債務不履行による契約解除通告および損害賠償督促状'
    mailSender.value = '法務大臣認証・オンライン民事調停センター'
    mailAddress.value = 'notice@civil-court.go.jp'
    mailBody.value = '正規の利用料金請求メールを一方的に詐欺として破棄・放置し、催促を無視し続けたため、契約は強制解除となりました。本日より年利14.6%の遅延損害金が加算されます。期日までに指定口座へ振込がない場合、法的措置に移行します。'
    popupColor.value = '#ff1a1a'
    popupBgColor.value = '#ffebee'
  }

  if (isForced) {
    falseTimer = setTimeout(() => {
      showDiag.value = false
    }, 5000)
  }
}

export const resetDiagEffect = () => {
  if (falseTimer) clearTimeout(falseTimer)
  showDiag.value = false
}
