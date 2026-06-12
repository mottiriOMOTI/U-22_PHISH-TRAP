export type AccountProfile = {
  email: string
  joinedAt: string
  rank: string
}

export type AccountStats = {
  completedTrainings: number
  totalLearningMinutes: number | null
  averageAccuracy: number | null
}

export type AccountSummary = {
  profile: AccountProfile
  stats: AccountStats
}

const defaultAccount: AccountSummary = {
  profile: {
    email: 'user@example.com',
    joinedAt: '2026-05-15T00:00:00.000Z',
    rank: '初心者',
  },
  stats: {
    completedTrainings: 1,
    totalLearningMinutes: null,
    averageAccuracy: null,
  },
}

export async function getAccountSummary(): Promise<AccountSummary> {
  return {
    profile: { ...defaultAccount.profile },
    stats: { ...defaultAccount.stats },
  }
}
