import { describe, expect, it } from 'vitest'

import type { MailListItem } from '@/api/mailApi'
import type { UserAnswerSummary } from '@/api/userAnswers'
import { mergeMailAnswerState } from './mailAnswerState'

function createMail(id: string): MailListItem {
  return {
    id,
    category: 'company',
    title: `Mail ${id}`,
    sender_name: 'sender',
    sender_email: 'sender@example.com',
    body: 'body',
    is_phishing: true,
    phishing_type: 'fake_login',
    has_link: true,
    has_attachment: false,
    created_at: '2026-01-01T00:00:00.000Z',
  }
}

describe('mergeMailAnswerState', () => {
  it('marks mails as answered and preserves effect flag based on user answers', () => {
    const mails = [createMail('q1'), createMail('q2')]
    const answers: UserAnswerSummary[] = [
      {
        question_id: 'q1',
        is_correct: false,
        effect_flag: true,
      },
      {
        question_id: 'q2',
        is_correct: true,
        effect_flag: false,
      },
    ]

    const merged = mergeMailAnswerState(mails, answers)

    expect(merged).toMatchObject([
      { id: 'q1', isAnswered: true, answerEffectFlag: true },
      { id: 'q2', isAnswered: true, answerEffectFlag: false },
    ])
  })
})
