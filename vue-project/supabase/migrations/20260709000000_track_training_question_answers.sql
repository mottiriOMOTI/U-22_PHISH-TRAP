-- 回答した問題を識別し、同じ問題への再回答でスコアが二重加算されないようにする。
alter table public.training_sessions
  add column if not exists question_id uuid references public.questions(id) on delete set null;

create unique index if not exists training_sessions_user_question_idx
  on public.training_sessions(user_id, question_id)
  where question_id is not null;

create index if not exists training_sessions_question_id_idx
  on public.training_sessions(question_id);
