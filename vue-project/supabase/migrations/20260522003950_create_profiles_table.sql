-- profiles: auth.users と 1:1 で紐づくユーザープロフィール
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- 自分の行のみ参照
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

-- 自分の行のみ挿入
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 自分の行のみ更新
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- auth.users への INSERT 時に profiles 行を自動作成
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
