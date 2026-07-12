import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase'
import {
  getSettings,
  updateSettings,
  type AppSettings,
} from '../services/settingsStore'

const router = Router()
type LearningScenario = 'business' | 'school' | 'daily'

const SCENARIO_CATEGORIES: Record<LearningScenario, string> = {
  business: 'company',
  school: 'student',
  daily: 'general',
}
const LEARNING_SCENARIOS = new Set<LearningScenario>(['business', 'school', 'daily'])

router.get('/', async (_req, res) => {
  try {
    const settings = await getSettings()
    return res.json({ ok: true, settings })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Failed to fetch settings' })
  }
})

router.put('/', async (req, res) => {
  try {
    const settings = await updateSettings(req.body as Partial<AppSettings>)
    return res.json({ ok: true, settings })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Failed to save settings' })
  }
})

// 🗑️ 学習履歴と回答履歴の完全消去
router.post('/reset-learning', async (req, res) => {
  const userId = typeof req.body?.userId === 'string' ? req.body.userId.trim() : ''
  const scenario = req.body?.scenario as LearningScenario

  if (!userId || !LEARNING_SCENARIOS.has(scenario)) {
    return res.status(400).json({ error: 'userId と有効な scenario が必要です' })
  }

  try {
    // 1. ユーザーの存在と権限チェック
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .eq('role', 'learner')
      .eq('is_active', true)
      .maybeSingle()

    if (userError) throw userError
    if (!user) return res.status(404).json({ error: 'Active learner not found' })

    // 2. そのシナリオ（カテゴリ）に該当する問題IDをすべて取得
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('questions')
      .select('id')
      .eq('category', SCENARIO_CATEGORIES[scenario])

    if (questionsError) throw questionsError

    const questionIds = (questions ?? []).map((question) => question.id)
    
    // 3. 該当する問題への回答履歴(user_answers)を完全に削除
    if (questionIds.length > 0) {
      const { error: answersError } = await supabaseAdmin
        .from('user_answers')
        .delete()
        .eq('user_id', userId)
        .in('question_id', questionIds)

      if (answersError) throw answersError

      // 旧仕様のセッションデータも安全に削除
      const { error: legacySessionsError } = await supabaseAdmin
        .from('training_sessions')
        .delete()
        .eq('user_id', userId)
        .is('scenario', null)
        .in('question_id', questionIds)

      if (legacySessionsError) throw legacySessionsError
    }

    // 4. 新仕様のセッションデータ(training_sessions)を削除
    const { error: sessionsError } = await supabaseAdmin
      .from('training_sessions')
      .delete()
      .eq('user_id', userId)
      .eq('scenario', scenario)

    if (sessionsError) throw sessionsError

    const resetAt = new Date().toISOString()
    return res.json({ ok: true, resetAt, scenario })
  } catch (error) {
    console.error('履歴リセットエラー:', error)
    return res.status(500).json({ error: 'Failed to reset learning history' })
  }
})

export default router