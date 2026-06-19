-- Create users table for storing user account information
create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  name text not null,
  role text not null default 'learner' check (role in ('admin', 'learner')),
  current_scenario text default 'school' check (current_scenario in ('business', 'school', 'daily')),
  created_at timestamptz not null default now(),
  last_active_at timestamptz,
  is_active boolean not null default true
);

-- Create an index on email for faster lookups
create index users_email_idx on public.users(email);

-- Enable Row Level Security
alter table public.users enable row level security;

-- Policies for users table
-- Users can view their own profile
create policy "users_select_own"
  on public.users for select
  using (auth.uid() = id);

-- Users can update their own profile
create policy "users_update_own"
  on public.users for update
  using (auth.uid() = id);

-- Admins can view all users
create policy "users_select_admin"
  on public.users for select
  using (
    (select role from public.users where auth.uid() = id limit 1) = 'admin'
  );
