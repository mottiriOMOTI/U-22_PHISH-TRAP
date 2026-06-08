import { type CardItem } from '@/components/ui/IshikawaStyle.vue'

interface ApiDangerCard {
  id: string
  type: 'danger'
  category: 'student' | 'company' | 'general'
  title: string
  sender_name: string
  sender_email: string
  body: string
  is_phishing: boolean
  color?: string
  variant?: string
}
interface ApiExplanationCard {
  id: string
  type: 'DangerExplanation'
  why_dangerous: string
  color?: string
  variant?: string
}
interface ApiAdviceCard {
  id: string
  type: 'advice'
  warning_signals: string[]
  color?: string
  variant?: string
}
interface ApiActionCard {
  id: string
  type: 'correctiveAction'
  correct_action: string[]
  color?: string
  variant?: string
}
type LocalApiCardItem = ApiDangerCard | ApiExplanationCard | ApiAdviceCard | ApiActionCard

/**
 * Express API から内部処理されたフィッシング問題データをフェッチする（最終防衛ライン版）
 * @param questionId デバッグ用問題ID
 */
export const fetchQuestion = async (questionId?: number | string): Promise<CardItem[]> => {
  try {
    const url = questionId ? `/api/questions/${questionId}` : '/api/questions'
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`API 通信エラー: ${response.status}`)
    }

    const data = await response.json()
    console.log('📦 【デバッグ】Express API から届いた生のJSONデータ:', data)

    if (!data) {
      throw new Error('データが空っぽです')
    }

    // 🟢 【原因対策①】リレーションデータ (question_explanations) の安全な取り出し
    // オブジェクトの中に直接入っているか、配列に入っているかを100%安全に検知します
    let exp: any = null
    if (data.question_explanations) {
      exp = Array.isArray(data.question_explanations)
        ? data.question_explanations[0]
        : data.question_explanations
    }

    // 万が一解説データが空だった場合のためのセーフティフォールバック（強制表示用ダミー）
    if (!exp) {
      console.warn('⚠️ question_explanations が見つからないため、ダミーデータを割り当てます')
      exp = {
        why_dangerous: '解説データがデータベース内に見つかりません。',
        warning_signals: '["警告サインが未登録です"]',
        correct_action: '公式のサポート窓口へ直接お問い合わせください。'
      }
    }

    // 🟢 【原因対策②】warning_signals (JSON文字列) の安全なパース
    let parsedWarningSignals: string[] = []
    try {
      if (typeof exp.warning_signals === 'string') {
        parsedWarningSignals = JSON.parse(exp.warning_signals)
      } else if (Array.isArray(exp.warning_signals)) {
        parsedWarningSignals = exp.warning_signals
      }
    } catch (e) {
      console.warn('⚠️ warning_signals の解析に失敗したためフォールバックします:', e)
      parsedWarningSignals = [String(exp.warning_signals)]
    }
    if (!parsedWarningSignals || parsedWarningSignals.length === 0) {
      parsedWarningSignals = ['不審なリンクや、緊急性を煽る文面に注意してください。']
    }

    // 🟢 【原因対策③】correct_action の安全な配列化
    let parsedCorrectAction: string[] = []
    if (typeof exp.correct_action === 'string') {
      parsedCorrectAction = [exp.correct_action]
    } else if (Array.isArray(exp.correct_action)) {
      parsedCorrectAction = exp.correct_action
    } else {
      parsedCorrectAction = ['メール内のURLをクリックせず、公式アプリ等からステータスを確認してください。']
    }

    // 4つの画面用動的カード配列へ厳密にマッピングして強制描画させます
    const resultCards: LocalApiCardItem[] = [
      {
        id: `danger-${data.id || 'dummy-id'}`,
        type: 'danger',
        category: data.category || 'general',
        title: data.title || '無題のメール',
        sender_name: data.sender_name || '不明な差出人',
        sender_email: data.sender_email || 'security@example.com',
        body: data.body || '現在、データベースのメール本文を読み込んでいます...',
        is_phishing: !!data.is_phishing,
        color: 'error',
        variant: 'outlined'
      },
      {
        id: `explanation-${data.id || 'dummy-id'}`,
        type: 'DangerExplanation',
        why_dangerous: exp.why_dangerous,
        color: 'warning',
        variant: 'tonal'
      },
      {
        id: `advice-${data.id || 'dummy-id'}`,
        type: 'advice',
        warning_signals: parsedWarningSignals,
        color: 'success',
        variant: 'outlined'
      },
      {
        id: `action-${data.id || 'dummy-id'}`,
        type: 'correctiveAction',
        correct_action: parsedCorrectAction,
        color: 'info',
        variant: 'elevated'
      }
    ]

    return resultCards as unknown as CardItem[]
  } catch (err) {
    console.error('❌ QuestionApi.ts の最終変換で重大なエラーが発生しました:', err)
    // エラーが起きても画面のisLoadingを解除させて強制的に初期ダミーを出すためのセーフティネット
    return [
      { id: 'err-1', type: 'danger', category: 'general', title: '通信成功・データ成形エラー', sender_name: 'エラー窓口', sender_email: 'error@api.com', body: 'Expressとは繋がりましたが、データの形が壊れています。コンソールログ(F12)の「生データ」を確認してください。', is_phishing: true, color: 'error', variant: 'outlined' }
    ] as any
  }
}
