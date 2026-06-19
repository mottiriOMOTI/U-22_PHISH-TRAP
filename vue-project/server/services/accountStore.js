import { supabaseAdmin } from '../lib/supabase';
const defaultAccount = {
    profile: {
        email: 'user@example.com',
        joinedAt: '2026-05-15T00:00:00.000Z',
        rank: '\u521d\u5fc3\u8005',
    },
    stats: {
        completedTrainings: 0,
        totalLearningMinutes: null,
        averageAccuracy: null,
    },
};
function cloneDefaultAccount() {
    return {
        profile: { ...defaultAccount.profile },
        stats: { ...defaultAccount.stats },
    };
}
function calculateRank(completedTrainings, averageAccuracy) {
    if (completedTrainings <= 0) {
        return '\u672a\u53d7\u8b1b';
    }
    const accuracy = averageAccuracy ?? 0;
    if (completedTrainings >= 10 && accuracy >= 90) {
        return '\u9054\u4eba';
    }
    if (completedTrainings >= 5 && accuracy >= 80) {
        return '\u4e0a\u7d1a\u8005';
    }
    if (completedTrainings >= 3 && accuracy >= 60) {
        return '\u4e2d\u7d1a\u8005';
    }
    return '\u521d\u5fc3\u8005';
}
function calculateAverageAccuracy(sessions) {
    const totals = sessions.reduce((acc, session) => {
        const correctCount = Math.max(Number(session.correct_count ?? 0), 0);
        const wrongCount = Math.max(Number(session.wrong_count ?? 0), 0);
        const totalQuestions = Math.max(Number(session.total_questions ?? 0), correctCount + wrongCount);
        return {
            correctCount: acc.correctCount + correctCount,
            totalQuestions: acc.totalQuestions + totalQuestions,
        };
    }, { correctCount: 0, totalQuestions: 0 });
    if (totals.totalQuestions <= 0) {
        return null;
    }
    return Math.round((totals.correctCount / totals.totalQuestions) * 100);
}
function calculateTotalLearningMinutes(sessions) {
    const totalMilliseconds = sessions.reduce((total, session) => {
        if (!session.started_at || !session.completed_at) {
            return total;
        }
        const startedAt = new Date(session.started_at).getTime();
        const completedAt = new Date(session.completed_at).getTime();
        if (Number.isNaN(startedAt) || Number.isNaN(completedAt) || completedAt <= startedAt) {
            return total;
        }
        return total + completedAt - startedAt;
    }, 0);
    if (totalMilliseconds <= 0) {
        return null;
    }
    return Math.round(totalMilliseconds / 60000);
}
export async function getAccountSummary(userId) {
    if (!userId) {
        return cloneDefaultAccount();
    }
    const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('email, created_at, is_active')
        .eq('id', userId)
        .maybeSingle();
    if (userError) {
        throw userError;
    }
    if (!user || user.is_active === false) {
        return cloneDefaultAccount();
    }
    const { data: sessions, error: sessionsError } = await supabaseAdmin
        .from('training_sessions')
        .select('correct_count, wrong_count, total_questions, started_at, completed_at')
        .eq('user_id', userId)
        .eq('is_completed', true);
    if (sessionsError) {
        throw sessionsError;
    }
    const completedSessions = (sessions ?? []);
    const completedTrainings = completedSessions.length;
    const averageAccuracy = calculateAverageAccuracy(completedSessions);
    const totalLearningMinutes = calculateTotalLearningMinutes(completedSessions);
    return {
        profile: {
            email: user.email ?? defaultAccount.profile.email,
            joinedAt: user.created_at ?? defaultAccount.profile.joinedAt,
            rank: calculateRank(completedTrainings, averageAccuracy),
        },
        stats: {
            completedTrainings,
            totalLearningMinutes,
            averageAccuracy,
        },
    };
}
