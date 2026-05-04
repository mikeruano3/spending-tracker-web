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
    revalidatePath(`/${locale}/groups/${groupId}`, 'page')
    revalidatePath(`/${locale}/dashboard`, 'page')
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
    revalidatePath(`/${locale}/groups/${groupId}`, 'page')
    revalidatePath(`/${locale}/dashboard`, 'page')
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
    revalidatePath(`/${locale}/groups/${groupId}`, 'page')
    revalidatePath(`/${locale}/dashboard`, 'page')
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
    revalidatePath(`/${locale}/groups/${groupId}`, 'page')
    revalidatePath(`/${locale}/dashboard`, 'page')
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
    revalidatePath(`/${locale}/groups/${groupId}`, 'page')
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
    revalidatePath(`/${locale}/groups/${groupId}`, 'page')
    revalidatePath(`/${locale}/dashboard`, 'page')
  }

  return { success: true }
}
