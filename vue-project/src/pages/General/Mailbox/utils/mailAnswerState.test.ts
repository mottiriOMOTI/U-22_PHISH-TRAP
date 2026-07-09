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
        user_id: 'user-1',
        question_id: 'q1',
        action_type: 'ignored',
        is_correct: false,
        effect_flag: true,
      },
      {
        user_id: 'user-1',
        question_id: 'q2',
        action_type: 'reported',
        is_correct: true,
        effect_flag: false,
      },
    ]

    const merged = mergeMailAnswerState(mails, answers)

    expect(merged[0].isAnswered).toBe(true)
    expect(merged[0].answerEffectFlag).toBe(true)
    expect(merged[1].isAnswered).toBe(true)
    expect(merged[1].answerEffectFlag).toBe(false)
  })
})
