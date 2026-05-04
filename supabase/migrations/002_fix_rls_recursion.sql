-- Fix: 42P17 infinite recursion in group_members RLS policies.
-- Root cause: the group_members SELECT policy used a subquery on group_members
-- itself, causing PostgreSQL to recurse infinitely when evaluating it.
-- Solution: a security definer function that reads group_members without
-- triggering RLS, used by all membership-check policies.

-- ---------------------------------------------------------------
-- 1. Drop all affected policies
-- ---------------------------------------------------------------
drop policy if exists "group_members_select" on group_members;
drop policy if exists "group_members_insert" on group_members;
drop policy if exists "groups_select_members"  on groups;
drop policy if exists "groups_insert_auth"     on groups;
drop policy if exists "groups_update_creator"  on groups;
drop policy if exists "expenses_select"        on expenses;
drop policy if exists "expenses_insert"        on expenses;
drop policy if exists "splits_select"          on expense_splits;
drop policy if exists "splits_insert"          on expense_splits;
drop policy if exists "settlements_select"     on settlements;
drop policy if exists "settlements_insert"     on settlements;

-- ---------------------------------------------------------------
-- 2. Helper function — reads group_members bypassing RLS
-- ---------------------------------------------------------------
create or replace function is_group_member(p_group_id uuid)
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (
    select 1 from group_members
    where group_id = p_group_id
      and user_id  = auth.uid()
  );
$$;

-- ---------------------------------------------------------------
-- 3. Recreate policies using the helper (no self-referencing queries)
-- ---------------------------------------------------------------

-- group_members
create policy "group_members_select" on group_members for select
  using (is_group_member(group_id));

create policy "group_members_insert" on group_members for insert
  with check (
    auth.uid() = user_id           -- allow user to insert themselves (creator bootstrap)
    or is_group_member(group_id)   -- or an existing member adding someone else
  );

-- groups
create policy "groups_select_members" on groups for select
  using (is_group_member(id));

create policy "groups_insert_auth" on groups for insert
  with check (auth.uid() = created_by);

create policy "groups_update_creator" on groups for update
  using (auth.uid() = created_by);

-- expenses
create policy "expenses_select" on expenses for select
  using (is_group_member(group_id));

create policy "expenses_insert" on expenses for insert
  with check (is_group_member(group_id));

-- expense_splits (join through expenses to get group_id)
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
