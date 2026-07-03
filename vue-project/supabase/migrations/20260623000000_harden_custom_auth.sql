alter table public.users
  add column if not exists failed_login_count integer not null default 0,
  add column if not exists locked_until timestamptz,
  add column if not exists password_changed_at timestamptz not null default now(),
  add column if not exists password_reset_token_hash text,
  add column if not exists password_reset_expires_at timestamptz,
  add column if not exists password_reset_requested_at timestamptz,
  add column if not exists password_reset_used_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_failed_login_count_nonnegative'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_failed_login_count_nonnegative
      check (failed_login_count >= 0)
      not valid;
  end if;
end
$$;

alter table public.users
  validate constraint users_failed_login_count_nonnegative;

create index if not exists users_password_reset_token_hash_idx
  on public.users(password_reset_token_hash)
  where password_reset_token_hash is not null;

notify pgrst, 'reload schema';
