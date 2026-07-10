import { describe, expect, it } from 'vitest'

import { calculateScoreTotals } from './scoreCalculations'

describe('calculateScoreTotals', () => {
  it('uses the current active question count as the score denominator', () => {
    expect(calculateScoreTotals(2, 1, 3, 5)).toEqual({
      totalQuestions: 5,
      totalUnanswered: 2,
      accuracy: 0.4,
    })
  })

  it('automatically expands the denominator when questions are added', () => {
    const before = calculateScoreTotals(2, 1, 3, 3)
    const after = calculateScoreTotals(2, 1, 3, 8)

    expect(before.totalQuestions).toBe(3)
    expect(after.totalQuestions).toBe(8)
    expect(after.totalUnanswered).toBe(5)
  })

  it('does not make the denominator smaller than recorded historical answers', () => {
    expect(calculateScoreTotals(3, 1, 4, 2)).toEqual({
      totalQuestions: 4,
      totalUnanswered: 0,
      accuracy: 0.75,
    })
  })
})
