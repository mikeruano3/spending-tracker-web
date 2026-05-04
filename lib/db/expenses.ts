import { createClient } from '@/lib/supabase/server'

export interface ExpenseSplit {
  userId: string
  displayName: string
  amount: string
}

export interface Expense {
  id: string
  groupId: string
  paidBy: string
  paidByName: string
  description: string
  amount: string
  currency: string
  expenseDate: string
  createdAt: string
  splits: ExpenseSplit[]
}

export async function getGroupExpenses(groupId: string): Promise<Expense[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('expenses')
    .select(`
      id, group_id, paid_by, description, amount, currency, expense_date, created_at,
      profiles!expenses_paid_by_fkey(display_name, email),
      expense_splits(user_id, amount, profiles(display_name, email))
    `)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map(e => {
    const payer = e.profiles as unknown as { display_name: string; email: string } | null
    const rawSplits = e.expense_splits as unknown as Array<{
      user_id: string
      amount: string | number
      profiles: { display_name: string; email: string } | null
    }>
    return {
      id: e.id,
      groupId: e.group_id,
      paidBy: e.paid_by,
      paidByName: payer?.display_name || payer?.email?.split('@')[0] || 'Unknown',
      description: e.description,
      amount: String(e.amount),
      currency: e.currency,
      expenseDate: e.expense_date,
      createdAt: e.created_at,
      splits: (rawSplits ?? []).map(s => ({
        userId: s.user_id,
        displayName: s.profiles?.display_name || s.profiles?.email?.split('@')[0] || 'Unknown',
        amount: String(s.amount),
      })),
    }
  })
}
