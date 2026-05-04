-- Allow group members to delete expenses and settlements in their groups.
-- expense_splits cascade-delete automatically when their parent expense is deleted.

create policy "expenses_delete" on expenses for delete
  using (is_group_member(group_id));

create policy "settlements_delete" on settlements for delete
  using (is_group_member(group_id));

create policy "settlements_update" on settlements for update
  using (is_group_member(group_id))
  with check (is_group_member(group_id));
