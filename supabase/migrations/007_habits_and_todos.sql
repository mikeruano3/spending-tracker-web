-- ============================================================
-- Habits & Todos — schema for the per-user trackers
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query)
-- ============================================================

-- ---------------------------------------------------------------
-- habits: a named recurring habit the user wants to track
-- ---------------------------------------------------------------
create table if not exists habits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  name        text not null,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists habits_user_idx on habits(user_id);

-- ---------------------------------------------------------------
-- habit_completions: one row per (habit, day) the user marked done
-- ---------------------------------------------------------------
create table if not exists habit_completions (
  habit_id      uuid not null references habits(id) on delete cascade,
  user_id       uuid not null references profiles(id) on delete cascade,
  completed_on  date not null,
  created_at    timestamptz not null default now(),
  primary key (habit_id, completed_on)
);

create index if not exists habit_completions_user_date_idx
  on habit_completions(user_id, completed_on);

-- ---------------------------------------------------------------
-- todos: one-shot tasks
-- ---------------------------------------------------------------
create table if not exists todos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  title         text not null,
  is_done       boolean not null default false,
  completed_at  timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists todos_user_idx on todos(user_id);

-- ============================================================
-- Row Level Security — strictly per-user
-- ============================================================

alter table habits             enable row level security;
alter table habit_completions  enable row level security;
alter table todos              enable row level security;

create policy "habits_own_select" on habits for select
  using (auth.uid() = user_id);
create policy "habits_own_insert" on habits for insert
  with check (auth.uid() = user_id);
create policy "habits_own_update" on habits for update
  using (auth.uid() = user_id);
create policy "habits_own_delete" on habits for delete
  using (auth.uid() = user_id);

create policy "habit_completions_own_select" on habit_completions for select
  using (auth.uid() = user_id);
create policy "habit_completions_own_insert" on habit_completions for insert
  with check (auth.uid() = user_id);
create policy "habit_completions_own_delete" on habit_completions for delete
  using (auth.uid() = user_id);

create policy "todos_own_select" on todos for select
  using (auth.uid() = user_id);
create policy "todos_own_insert" on todos for insert
  with check (auth.uid() = user_id);
create policy "todos_own_update" on todos for update
  using (auth.uid() = user_id);
create policy "todos_own_delete" on todos for delete
  using (auth.uid() = user_id);
