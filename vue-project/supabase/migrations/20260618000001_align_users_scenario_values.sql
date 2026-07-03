-- users.current_scenario を設計書の値 (business / school / daily) に合わせる
alter table public.users drop constraint if exists users_current_scenario_check;

update public.users
set current_scenario = case current_scenario
  when 'student' then 'school'
  when 'adult' then 'business'
  when 'general' then 'daily'
  else current_scenario
end
where current_scenario in ('student', 'adult', 'general');

alter table public.users
  alter column current_scenario set default 'school';

alter table public.users
  add constraint users_current_scenario_check
  check (current_scenario in ('business', 'school', 'daily'));
