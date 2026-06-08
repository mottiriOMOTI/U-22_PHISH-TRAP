import { Router } from 'express'
import type { Request, Response } from 'express'
// 既存 arrows lib/supabase.ts のパスに合わせてインポート
import { supabaseAdmin } from '../lib/supabase'

const router = Router()

// 内部的（メモリ上）に問題データをキャッシュ・割り当てるための領域
let internalQuestionsMap: Record<string | number, any> = {}
let isInitialized = false // 起動時のクラッシュを防ぐための初期化フラグ

/**
 * データベース接続エラーなどの際、アプリを落とさずに稼働させるためのローカルフォールバックデータ
 */
const fallbackQuestions = [
  {
    id: 'sample-phishing-1',
    category: 'student',
    title: '【重要】学生アカウントのセキュリティ確認と緊急更新のお知らせ',
    sender_name: '大学ITサポートセンター',
    sender_email: 'security-alert@univ-support-portal.net',
    body: '学生の皆様へ\n\n最近、不審な第三者による学内ポータルサイトへの不正アクセスが複数確認されております。\n安全のため、すべての学生アカウントについてセキュリティ情報の確認とパスワードの再設定をお願いしております。\n\n以下のリンクより速やかにログインし、情報の更新を行ってください。\n24時間以内に更新が確認できない場合、一時的にアカウントが凍結される可能性があります。\n\n■ アカウント更新URL:\nhttp://univ-support-portal.net/secure/login.htmlnn※本メールは配信専用です。返信はできません。n------------------------------------n学内情報セキュリティ部会',
    is_phishing: true,
    phishing_type: 'フィッシング詐欺（アカウント乗っ取り）',
    question_explanations: {
      why_dangerous: 'このメールは、送信元のドメインが公式のものではありません。また、「24時間以内」などと緊急性を煽り、個人情報を詐取するフィッシングサイトへ誘導しています。',
      warning_signals: '["送信元のメールアドレスが非公式のもの", "緊急性を煽り口座や個人情報を要求する文面", "偽サイト（http://univ-support...）へのリンク"]',
      correct_action: '「メール内のリンクは絶対にクリックしない」ことが最優先です。大学の公式ホームページから直接ポータルサイトにアクセスし、お知らせやステータスを確認してください。不審な場合は学内の問い合わせ窓口に連絡しましょう。'
    }
  },
  {
    id: 'sample-safe-2',
    category: 'general',
    title: '【定期】サービスご利用明細確定のお知らせ',
    sender_name: '株式会社クレカサポート',
    sender_email: 'statement@credit-support.co.jp',
    body: 'いつも弊社サービスをご利用いただき誠にありがとうございます。\n\n2026年6月度のご利用明細が確定いたしましたのでお知らせいたします。\n今回の請求金額およびお支払日につきましては、会員専用Webサイト「マイページ」にてご確認ください。\n\n■ ご利用明細の確認はこちらから（要ログイン）:\nhttps://www.credit-support.co.jp/mypage/nn※弊社では、メール本文中で直接お客様のクレジットカード番号や暗証番号、個人情報を入力いただくよう求めることは一切ございません。不審なメールにご注意ください。nn------------------------------------n株式会社クレカサポートnカスタマーサービス窓口',
    is_phishing: false,
    phishing_type: '通常メール',
    question_explanations: {
      why_dangerous: 'このメールは安全な定期案内通知です。クレジットカード番号などの個人情報をメール本文中で直接求めておらず、セキュリティに対する注意喚起も記載されています。送信ドメイン（@credit-support.co.jp）も公式のURLと一致しています。',
      warning_signals: '["公式の暗号化されたドメイン（https）を使用している", "重要な個人情報の入力をメール内で求めていない", "不審なURLではなく公式マイページへの正しいログイン導線が用意されている"]',
      correct_action: 'ブックマークしている公式ページや、公式アプリを経由して明細を確認するのが最も安全な行動です。'
    }
  }
]

/**
 * フォールバック（ダミーデータ）を内部メモリに強制割り当てする関数
 */
function loadFallbackToInternalMemory(): void {
  console.log('💡 ローカルのフォールバックデータを内部メモリに適用します...')
  const tempMap: Record<string | number, any> = {}
  
  fallbackQuestions.forEach((q, index) => {
    const stringId = String(q.id)
    tempMap[stringId] = q
    tempMap[index + 1] = q // 1番目のデータをID「1」、2番目をID「2」としてもアクセスできるように割り当て
  })
  
  internalQuestionsMap = tempMap
  console.log(`✅ ローカルデータを内部に割り当てました（計 ${fallbackQuestions.length} 件）`)
}

/**
 * バックエンド内部でSupabaseからデータを先読みし、連想配列に「内部的」に割り当てる関数
 */
async function loadQuestionsToInternalMemory(): Promise<void> {
  try {
    console.log('🔄 Supabaseから問題データを内部メモリに読み込んでいます...')
    
    if (!supabaseAdmin) {
      throw new Error('supabaseAdmin が正しく初期化されていません。')
    }

    const { data, error } = await supabaseAdmin
      .from('questions')
      .select(`
        id, category, title, sender_name, sender_email, body, is_phishing, phishing_type,
        question_explanations ( why_dangerous, warning_signals, correct_action )
      `)
      .eq('is_active', true)

    if (error) {
      throw new Error(`Supabase Query Error: ${error.message} (Code: ${error.code})`)
    }

    if (data && data.length > 0) {
      const tempMap: Record<string | number, any> = {}
      data.forEach((q: any, index: number) => {
        if (!q) return
        
        const stringId = String(q.id)
        tempMap[stringId] = q
        tempMap[index + 1] = q // 1件目ならID: 1、2件目ならID: 2として内部割り当て
      })
      
      internalQuestionsMap = tempMap
      console.log(`✅ Supabaseから問題データを内部に割り当てました（計 ${data.length} 件）`)
    } else {
      console.warn('⚠️ Supabaseから有効なデータ（is_active: true）が1件も取得できませんでした。フォールバックデータを使用します。')
      loadFallbackToInternalMemory()
    }
  } catch (err: any) {
    console.error('❌ Supabaseからのデータ読み込みに失敗したため、ローカルデータに切り替えます。詳細:', err.message)
    loadFallbackToInternalMemory()
  }
}

/**
 * 初回リクエスト時に一度だけデータを初期化する関数
 * これにより、ファイル読み込み時の意図しないクラッシュ(500エラー)を防ぎます
 */
async function ensureInitialized(): Promise<void> {
  if (!isInitialized) {
    await loadQuestionsToInternalMemory()
    isInitialized = true
  }
}

/**
 * [APIルート1] GET /api/questions
 * 内部に割り当てられているデータから、自動で最初の1件を返す
 */
router.get('/', async (_req: Request, res: Response) => {
  console.log('====== 📥 GET /api/questions にリクエストが到達しました ======')
  try {
    await ensureInitialized()

    let allValues = Object.values(internalQuestionsMap)
    
    // 重複データをフィルタリング（UUIDキーと数値キーの両方が存在するため）
    const uniqueQuestions = allValues.filter(
      (value, index, self) => value && self.findIndex((v) => v && v.id === value.id) === index
    )

    const firstQuestion = uniqueQuestions[0]
    
    if (!firstQuestion) {
      console.log('🚨 キャッシュが未だに空のため、強制的にフォールバックデータ1件目を返却します')
      // status(200)を明示的につけることで500エラー上書きを防止
      return res.status(200).json(fallbackQuestions[0])
    }

    return res.status(200).json(firstQuestion)
  } catch (error: any) {
    console.error('❌ GET /api/questions でエラーが発生しました。最終セーフティネットを発動します:', error)
    return res.status(200).json(fallbackQuestions[0])
  }
})

/**
 * [APIルート2] GET /api/questions/:id
 * バックエンドの内部メモリ（配列）から指定されたIDを「内部処理」で瞬時に返却
 */
router.get('/:id', async (req: Request, res: Response) => {
  const targetId = String(req.params.id)
  console.log(`====== 📥 GET /api/questions/${targetId} にリクエストが到達しました ======`)
  
  try {
    await ensureInitialized()

    let matchedQuestion = internalQuestionsMap[targetId]

    // 数値のID (1, 2等) や直接の文字列でヒットしない場合、IDフィールド部分での安全なフォールバック検索も行う
    if (!matchedQuestion) {
      const allValues = Object.values(internalQuestionsMap)
      matchedQuestion = allValues.find((q: any) => q && String(q.id) === targetId)
    }

    if (!matchedQuestion) {
      console.warn(`⚠️ ID ${targetId} に合致する問題がなかったため、フォールバックの対応データを返します。`)
      const fallbackIdx = parseInt(targetId, 10) - 1
      const defaultData = fallbackQuestions[fallbackIdx] || fallbackQuestions[0]
      return res.status(200).json(defaultData)
    }

    return res.status(200).json(matchedQuestion)
  } catch (error: any) {
    console.error(`❌ GET /api/questions/${req.params.id} で内部エラーが発生しました。デフォルトデータを強制的に返します:`, error)
    return res.status(200).json(fallbackQuestions[0])
  }
})

export default router
