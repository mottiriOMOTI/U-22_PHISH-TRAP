import type { MailListItem } from '@/api/mailApi'
import type { UserAnswerSummary } from '@/api/userAnswers'

export type MailListItemWithAnswerState = MailListItem & {
  isAnswered: boolean
  answerEffectFlag: boolean | null
}

export function mergeMailAnswerState(
  mails: MailListItem[],
  answers: UserAnswerSummary[],
): MailListItemWithAnswerState[] {
  const answerMap = new Map<string, UserAnswerSummary>()

  for (const answer of answers) {
    if (!answer.question_id) continue
    answerMap.set(answer.question_id, answer)
  }

  return mails.map((mail) => {
    const answer = answerMap.get(mail.id)

    return {
      ...mail,
      isAnswered: Boolean(answer),
      answerEffectFlag: answer?.effect_flag ?? null,
    }
  })
}
