export type ScoreTotals = {
  totalQuestions: number
  totalUnanswered: number
  accuracy: number
}

function toNonNegativeInteger(value: number): number {
  return Number.isFinite(value) ? Math.max(Math.trunc(value), 0) : 0
}

/**
 * 分母は現在の有効問題数を基準にする。
 * 過去の回答数が有効問題数を上回る場合も、既存スコアを壊さないよう回答記録数を下限にする。
 */
export function calculateScoreTotals(
  totalCorrect: number,
  totalWrong: number,
  recordedQuestions: number,
  activeQuestions: number,
): ScoreTotals {
  const correct = toNonNegativeInteger(totalCorrect)
  const wrong = toNonNegativeInteger(totalWrong)
  const answeredQuestions = correct + wrong
  const totalQuestions = Math.max(
    toNonNegativeInteger(activeQuestions),
    toNonNegativeInteger(recordedQuestions),
    answeredQuestions,
  )

  return {
    totalQuestions,
    totalUnanswered: Math.max(totalQuestions - answeredQuestions, 0),
    accuracy: totalQuestions > 0 ? correct / totalQuestions : 0,
  }
}
