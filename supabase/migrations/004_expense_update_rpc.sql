-- RPC: atomically update an expense and replace all its splits.
-- Uses security definer to bypass RLS; membership is verified manually.
create or replace function update_expense_with_splits(
  p_expense_id  uuid,
  p_description text,
  p_amount      numeric,
  p_currency    text,
  p_splits      jsonb   -- [{"user_id": "...", "amount": "..."}]
) returns void language plpgsql security definer set search_path = public as $$
declare
  v_split    jsonb;
  v_group_id uuid;
begin
  select group_id into v_group_id from expenses where id = p_expense_id;

  if not exists (
    select 1 from group_members
    where group_id = v_group_id and user_id = auth.uid()
  ) then
    raise exception 'Not a member of this group';
  end if;

  update expenses
     set description = p_description,
         amount      = p_amount,
         currency    = p_currency
   where id = p_expense_id;

  delete from expense_splits where expense_id = p_expense_id;

  for v_split in select * from jsonb_array_elements(p_splits) loop
    insert into expense_splits(expense_id, user_id, amount)
    values (
      p_expense_id,
      (v_split->>'user_id')::uuid,
      (v_split->>'amount')::numeric
    );
  end loop;
end;
$$;
