-- Allow the group creator to delete their group.
-- All related rows cascade automatically:
--   group_members, expenses → expense_splits, settlements

create policy "groups_delete_creator" on groups for delete
  using (auth.uid() = created_by);
