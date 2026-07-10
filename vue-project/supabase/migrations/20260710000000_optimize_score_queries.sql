-- 個人スコアとシチュエーション別統計で使用する完了済み回答を高速に集計する。
create index if not exists training_sessions_completed_scenario_user_idx
  on public.training_sessions (scenario, user_id)
  include (correct_count, wrong_count, total_questions)
  where is_completed = true;

-- 有効な訓練問題数をカテゴリ別に数えるクエリを高速化する。
create index if not exists questions_active_category_idx
  on public.questions (category)
  where is_active = true and is_decoy = false;

-- 全体統計で対象となる有効な学習者の取得を高速化する。
create index if not exists users_active_learner_idx
  on public.users (id)
  where role = 'learner' and is_active = true;
