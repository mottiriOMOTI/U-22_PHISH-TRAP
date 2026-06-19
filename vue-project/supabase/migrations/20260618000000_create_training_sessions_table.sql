-- training_sessions: ユーザーの学習セッション管理
create table if not exists public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  scenario text not null check (scenario in ('business', 'school', 'daily')),
  total_questions integer not null,
  correct_count integer not null default 0,
  wrong_count integer not null default 0,
  score integer not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  is_completed boolean not null default false
);

create index if not exists training_sessions_user_id_idx on public.training_sessions(user_id);
create index if not exists training_sessions_scenario_idx on public.training_sessions(scenario);

alter table public.training_sessions enable row level security;
