import { createClient } from '@/lib/supabase/server'
import Decimal from 'decimal.js'
import { simplifyDebts, type NetBalance, type Transfer } from '@/lib/debt-simplification'

export interface GroupBalances {
  netBalances: NetBalance[]
  transfers: Transfer[]
  memberNames: Record<string, string>
  memberPaid: Record<string, Decimal>
  memberOwed: Record<string, Decimal>
}

export async function getGroupBalances(groupId: string): Promise<GroupBalances> {
  const supabase = await createClient()

  // Fetch members
  const { data: members } = await supabase
    .from('group_members')
    .select('user_id, profiles(display_name, email)')
    .eq('group_id', groupId)

  const memberNames: Record<string, string> = {}
  for (const m of members ?? []) {
    const p = m.profiles as unknown as { display_name: string; email: string } | null
    memberNames[m.user_id] = p?.display_name || p?.email?.split('@')[0] || 'Unknown'
  }

  // Amount paid by each user (as payer of an expense)
  const { data: paidData } = await supabase
    .from('expenses')
    .select('paid_by, amount')
    .eq('group_id', groupId)

  const paid: Record<string, Decimal> = {}
  for (const row of paidData ?? []) {
    paid[row.paid_by] = (paid[row.paid_by] ?? new Decimal(0)).plus(new Decimal(String(row.amount)))
  }

  // Amount owed by each user (their split share)
  const { data: splitData } = await supabase
    .from('expense_splits')
    .select('user_id, amount, expenses!inner(group_id)')
    .eq('expenses.group_id', groupId)

  const owed: Record<string, Decimal> = {}
  for (const row of splitData ?? []) {
    owed[row.user_id] = (owed[row.user_id] ?? new Decimal(0)).plus(new Decimal(String(row.amount)))
  }

  // Net = expenses_paid - split_owed
  // Positive = others owe you; Negative = you owe others.
  const allUserIds = Object.keys(memberNames)
  const netBalances: NetBalance[] = allUserIds.map(userId => ({
    userId,
    displayName: memberNames[userId],
    amount: (paid[userId] ?? new Decimal(0))
      .minus(owed[userId] ?? new Decimal(0)),
  }))

  const transfers = simplifyDebts(netBalances)

  return { netBalances, transfers, memberNames, memberPaid: paid, memberOwed: owed }
}

export interface Settlement {
  id: string
  payerId: string
  payerName: string
  payeeId: string
  payeeName: string
  amount: string
  currency: string
  settledAt: string
}

export async function getGroupSettlements(groupId: string): Promise<Settlement[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('settlements')
    .select(`
      id, paid_by, paid_to, amount, currency, settled_at,
      payer:profiles!settlements_paid_by_fkey(display_name, email),
      payee:profiles!settlements_paid_to_fkey(display_name, email)
    `)
    .eq('group_id', groupId)
    .order('settled_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map(s => {
    const payer = s.payer as unknown as { display_name: string; email: string } | null
    const payee = s.payee as unknown as { display_name: string; email: string } | null
    return {
      id: s.id,
      payerId: s.paid_by,
      payerName: payer?.display_name || payer?.email?.split('@')[0] || 'Unknown',
      payeeId: s.paid_to,
      payeeName: payee?.display_name || payee?.email?.split('@')[0] || 'Unknown',
      amount: String(s.amount),
      currency: s.currency,
      settledAt: s.settled_at,
    }
  })
}

export interface UserTotalBalance {
  totalOwed: Decimal   // others owe you
  totalOwe: Decimal    // you owe others
  net: Decimal
}

export async function getUserTotalBalance(userId: string): Promise<UserTotalBalance> {
  const supabase = await createClient()

  // Get all groups the user is in
  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId)

  const groupIds = (memberships ?? []).map(m => m.group_id)
  if (groupIds.length === 0) {
    return { totalOwed: new Decimal(0), totalOwe: new Decimal(0), net: new Decimal(0) }
  }

  let totalOwed = new Decimal(0)
  let totalOwe = new Decimal(0)

  for (const groupId of groupIds) {
    const { netBalances } = await getGroupBalances(groupId)
    const myBalance = netBalances.find(b => b.userId === userId)
    if (!myBalance) continue
    if (myBalance.amount.gt(0)) {
      totalOwed = totalOwed.plus(myBalance.amount)
    } else if (myBalance.amount.lt(0)) {
      totalOwe = totalOwe.plus(myBalance.amount.abs())
    }
  }

  return { totalOwed, totalOwe, net: totalOwed.minus(totalOwe) }
}
