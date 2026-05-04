-- ============================================================
-- Spending Tracker — initial schema
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query)
-- ============================================================

-- ---------------------------------------------------------------
-- profiles: 1:1 with auth.users
-- email stored here so we can look up users by email when adding members
-- ---------------------------------------------------------------
create table if not exists profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  email              text unique not null,
  display_name       text not null default '',
  preferred_currency text not null default 'USD',
  created_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- groups
-- ---------------------------------------------------------------
create table if not exists groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  currency    text not null default 'USD',
  created_by  uuid not null references profiles(id),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- group_members (composite PK prevents duplicates)
-- ---------------------------------------------------------------
create table if not exists group_members (
  group_id  uuid not null references groups(id) on delete cascade,
  user_id   uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- ---------------------------------------------------------------
-- expenses
-- numeric(14,4) for money — never float
-- ---------------------------------------------------------------
create table if not exists expenses (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references groups(id) on delete cascade,
  paid_by      uuid not null references profiles(id),
  description  text not null,
  amount       numeric(14,4) not null check (amount > 0),
  currency     text not null,
  expense_date date not null default current_date,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- expense_splits: one row per member per expense
-- sum of all splits for an expense = expenses.amount
-- ---------------------------------------------------------------
create table if not exists expense_splits (
  id          uuid primary key default gen_random_uuid(),
  expense_id  uuid not null references expenses(id) on delete cascade,
  user_id     uuid not null references profiles(id),
  amount      numeric(14,4) not null check (amount >= 0),
  unique(expense_id, user_id)
);

-- ---------------------------------------------------------------
-- settlements: recorded debt payments between two users
-- ---------------------------------------------------------------
create table if not exists settlements (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references groups(id) on delete cascade,
  paid_by     uuid not null references profiles(id),
  paid_to     uuid not null references profiles(id),
  amount      numeric(14,4) not null check (amount > 0),
  currency    text not null,
  settled_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- currency_settings: per-user fixed exchange rate overrides
-- ---------------------------------------------------------------
create table if not exists currency_settings (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  from_currency text not null,
  to_currency   text not null,
  rate          numeric(14,6) not null check (rate > 0),
  is_fixed      boolean not null default false,
  updated_at    timestamptz not null default now(),
  unique(user_id, from_currency, to_currency)
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table profiles          enable row level security;
alter table groups            enable row level security;
alter table group_members     enable row level security;
alter table expenses          enable row level security;
alter table expense_splits    enable row level security;
alter table settlements       enable row level security;
alter table currency_settings enable row level security;

-- profiles
create policy "profiles_select_all"  on profiles for select using (true);
create policy "profiles_insert_own"  on profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own"  on profiles for update using (auth.uid() = id);

-- groups: only members can see/modify
create policy "groups_select_members" on groups for select
  using (exists (
    select 1 from group_members where group_id = groups.id and user_id = auth.uid()
  ));
create policy "groups_insert_auth" on groups for insert
  with check (auth.uid() = created_by);
create policy "groups_update_creator" on groups for update
  using (auth.uid() = created_by);

-- Helper function: checks group membership without triggering RLS
-- (security definer bypasses policies, preventing infinite recursion)
create or replace function is_group_member(p_group_id uuid)
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (
    select 1 from group_members
    where group_id = p_group_id
      and user_id  = auth.uid()
  );
$$;

-- group_members: use the helper to avoid self-referencing recursion
create policy "group_members_select" on group_members for select
  using (is_group_member(group_id));

create policy "group_members_insert" on group_members for insert
  with check (
    auth.uid() = user_id          -- allow inserting yourself (creator bootstrap)
    or is_group_member(group_id)  -- or existing member adding someone else
  );

-- expenses
create policy "expenses_select" on expenses for select
  using (is_group_member(group_id));

create policy "expenses_insert" on expenses for insert
  with check (is_group_member(group_id));

-- expense_splits
create policy "splits_select" on expense_splits for select
  using (exists (
    select 1 from expenses e
    where e.id = expense_splits.expense_id
      and is_group_member(e.group_id)
  ));

create policy "splits_insert" on expense_splits for insert
  with check (exists (
    select 1 from expenses e
    where e.id = expense_splits.expense_id
      and is_group_member(e.group_id)
  ));

-- settlements
create policy "settlements_select" on settlements for select
  using (is_group_member(group_id));

create policy "settlements_insert" on settlements for insert
  with check (is_group_member(group_id));

-- currency_settings: private per user
create policy "currency_settings_own" on currency_settings
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- Trigger: auto-create profile on signup
-- ============================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles(id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- RPC: create_expense_with_splits (atomic — prevents orphaned expenses)
-- ============================================================
create or replace function create_expense_with_splits(
  p_group_id    uuid,
  p_paid_by     uuid,
  p_description text,
  p_amount      numeric,
  p_currency    text,
  p_splits      jsonb  -- [{"user_id": "...", "amount": "..."}]
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_expense_id uuid;
  v_split      jsonb;
begin
  -- Verify the caller is a group member
  if not exists (
    select 1 from group_members
    where group_id = p_group_id and user_id = auth.uid()
  ) then
    raise exception 'Not a member of this group';
  end if;

  insert into expenses(group_id, paid_by, description, amount, currency)
  values (p_group_id, p_paid_by, p_description, p_amount, p_currency)
  returning id into v_expense_id;

  for v_split in select * from jsonb_array_elements(p_splits) loop
    insert into expense_splits(expense_id, user_id, amount)
    values (
      v_expense_id,
      (v_split->>'user_id')::uuid,
      (v_split->>'amount')::numeric
    );
  end loop;

  return v_expense_id;
end;
$$;
