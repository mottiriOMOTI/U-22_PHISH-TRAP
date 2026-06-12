const defaultAccount = {
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
};
export async function getAccountSummary() {
    return {
        profile: { ...defaultAccount.profile },
        stats: { ...defaultAccount.stats },
    };
}
