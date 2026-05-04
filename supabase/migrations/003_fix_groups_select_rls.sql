-- Fix: "new row violates row-level security policy for table groups"
--
-- Root cause: createGroupAction does INSERT ... RETURNING id.
-- PostgreSQL evaluates the SELECT policy against the RETURNING row.
-- At that point the creator has NOT been added to group_members yet, so
-- the SELECT policy (which only checks group_members) fails and the
-- whole statement aborts with an RLS error.
--
-- Fix: also allow the group creator (created_by = auth.uid()) to read
-- their own group. This lets INSERT ... RETURNING work, and is logically
-- correct — the person who created a group should always be able to see it.

-- Ensure the helper function exists (idempotent — safe to run even if 002 was already run)
create or replace function is_group_member(p_group_id uuid)
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (
    select 1 from group_members
    where group_id = p_group_id
      and user_id  = auth.uid()
  );
$$;

-- Drop and recreate the groups SELECT policy with the creator exception
drop policy if exists "groups_select_members" on groups;
drop policy if exists "groups_select" on groups;

create policy "groups_select" on groups for select
  using (
    auth.uid() = created_by    -- creator can always see their group (needed for INSERT RETURNING)
    or is_group_member(id)     -- members can see it too
  );
