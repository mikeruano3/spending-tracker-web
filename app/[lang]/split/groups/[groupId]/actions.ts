'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { locales } from '@/lib/locales'
import { splitEqually } from '@/lib/split'
import Decimal from 'decimal.js'

type ActionState = { error?: string; success?: boolean }

export async function updateExpenseAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const expenseId = formData.get('expenseId') as string
  const groupId = formData.get('groupId') as string
  const description = (formData.get('description') as string)?.trim()
  const amountStr = formData.get('amount') as string
  const currency = formData.get('currency') as string
  const memberIds = formData.getAll('members') as string[]

  if (!description) return { error: 'Description is required.' }
  if (!memberIds.length) return { error: 'Select at least one member.' }

  let amount: Decimal
  try {
    amount = new Decimal(amountStr)
    if (amount.lte(0)) throw new Error()
  } catch {
    return { error: 'Invalid amount.' }
  }

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims) return { error: 'Unauthorized' }

  const splits = splitEqually(amount, memberIds.length)
  const splitsPayload = memberIds.map((id, i) => ({
    user_id: id,
    amount: splits[i].toFixed(4),
  }))

  const { error: rpcError } = await supabase.rpc('update_expense_with_splits', {
    p_expense_id: expenseId,
    p_description: description,
    p_amount: amount.toFixed(4),
    p_currency: currency,
    p_splits: splitsPayload,
  })

  if (rpcError) return { error: rpcError.message }

  for (const locale of locales) {
    revalidatePath(`/${locale}/split/groups/${groupId}`, 'page')
    revalidatePath(`/${locale}/split`, 'page')
  }

  return { success: true }
}

export async function updateSettlementAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const settlementId = formData.get('settlementId') as string
  const groupId = formData.get('groupId') as string
  const paidTo = formData.get('paidTo') as string
  const amountStr = formData.get('amount') as string
  const currency = formData.get('currency') as string

  let amount: Decimal
  try {
    amount = new Decimal(amountStr)
    if (amount.lte(0)) throw new Error()
  } catch {
    return { error: 'Invalid amount.' }
  }

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('settlements')
    .update({ paid_to: paidTo, amount: amount.toFixed(4), currency })
    .eq('id', settlementId)

  if (error) return { error: error.message }

  for (const locale of locales) {
    revalidatePath(`/${locale}/split/groups/${groupId}`, 'page')
    revalidatePath(`/${locale}/split`, 'page')
  }

  return { success: true }
}

export async function deleteExpenseAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const expenseId = formData.get('expenseId') as string
  const groupId = formData.get('groupId') as string

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims) return { error: 'Unauthorized' }

  const { error } = await supabase.from('expenses').delete().eq('id', expenseId)
  if (error) return { error: error.message }

  for (const locale of locales) {
    revalidatePath(`/${locale}/split/groups/${groupId}`, 'page')
    revalidatePath(`/${locale}/split`, 'page')
  }

  return { success: true }
}

export async function deleteSettlementAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const settlementId = formData.get('settlementId') as string
  const groupId = formData.get('groupId') as string

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims) return { error: 'Unauthorized' }

  const { error } = await supabase.from('settlements').delete().eq('id', settlementId)
  if (error) return { error: error.message }

  for (const locale of locales) {
    revalidatePath(`/${locale}/split/groups/${groupId}`, 'page')
    revalidatePath(`/${locale}/split`, 'page')
  }

  return { success: true }
}

export async function addMemberAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const groupId = formData.get('groupId') as string

  if (!email) return { error: 'Email is required.' }

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims) return { error: 'Unauthorized' }

  // Look up the user by email in profiles
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (profileError || !profile) return { error: 'notFound' }

  // Check not already a member
  const { data: existing } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('user_id', profile.id)
    .single()

  if (existing) return { error: 'alreadyMember' }

  const { error } = await supabase
    .from('group_members')
    .insert({ group_id: groupId, user_id: profile.id })

  if (error) return { error: error.message }

  for (const locale of locales) {
    revalidatePath(`/${locale}/split/groups/${groupId}`, 'page')
  }

  return { success: true }
}

export async function updateGroupNameAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const groupId = formData.get('groupId') as string
  const name = (formData.get('name') as string)?.trim()

  if (!name) return { error: 'Name is required.' }

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('groups')
    .update({ name })
    .eq('id', groupId)

  if (error) return { error: error.message }

  for (const locale of locales) {
    revalidatePath(`/${locale}/split/groups/${groupId}`, 'page')
    revalidatePath(`/${locale}/split/groups`, 'page')
    revalidatePath(`/${locale}/split`, 'page')
  }

  return { success: true }
}

export async function removeMemberAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const groupId = formData.get('groupId') as string
  const memberId = formData.get('memberId') as string

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims) return { error: 'Unauthorized' }

  const { count: payerCount, error: payerError } = await supabase
    .from('expenses')
    .select('id', { count: 'exact', head: true })
    .eq('group_id', groupId)
    .eq('paid_by', memberId)

  if (payerError) return { error: payerError.message }
  if ((payerCount ?? 0) > 0) return { error: 'Cannot remove a member with registered expenses.' }

  const { data: groupExpenses, error: expError } = await supabase
    .from('expenses')
    .select('id')
    .eq('group_id', groupId)

  if (expError) return { error: expError.message }

  if (groupExpenses && groupExpenses.length > 0) {
    const expenseIds = groupExpenses.map(e => e.id)
    const { count: splitCount, error: splitError } = await supabase
      .from('expense_splits')
      .select('id', { count: 'exact', head: true })
      .in('expense_id', expenseIds)
      .eq('user_id', memberId)

    if (splitError) return { error: splitError.message }
    if ((splitCount ?? 0) > 0) return { error: 'Cannot remove a member with registered expenses.' }
  }

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', memberId)

  if (error) return { error: error.message }

  for (const locale of locales) {
    revalidatePath(`/${locale}/split/groups/${groupId}`, 'page')
  }

  return { success: true }
}

export async function deleteGroupAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const groupId = formData.get('groupId') as string

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims) return { error: 'Unauthorized' }

  // All related rows (group_members, expenses, expense_splits, settlements)
  // cascade-delete automatically via ON DELETE CASCADE constraints.
  const { error } = await supabase.from('groups').delete().eq('id', groupId)
  if (error) return { error: error.message }

  for (const locale of locales) {
    revalidatePath(`/${locale}/split/groups`, 'page')
    revalidatePath(`/${locale}/split`, 'page')
  }

  return { success: true }
}

export async function recordSettlementAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const groupId = formData.get('groupId') as string
  const paidTo = formData.get('paidTo') as string
  const amount = parseFloat(formData.get('amount') as string)
  const currency = formData.get('currency') as string

  if (!paidTo || isNaN(amount) || amount <= 0) return { error: 'Invalid settlement data.' }

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims) return { error: 'Unauthorized' }

  const { error } = await supabase.from('settlements').insert({
    group_id: groupId,
    paid_by: claimsData.claims.sub,
    paid_to: paidTo,
    amount,
    currency,
  })

  if (error) return { error: error.message }

  for (const locale of locales) {
    revalidatePath(`/${locale}/split/groups/${groupId}`, 'page')
    revalidatePath(`/${locale}/split`, 'page')
  }

  return { success: true }
}
