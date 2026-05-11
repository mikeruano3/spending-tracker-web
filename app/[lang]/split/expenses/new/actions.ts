'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { locales } from '@/lib/locales'
import { splitEqually } from '@/lib/split'
import Decimal from 'decimal.js'

type AddExpenseState = {
  error?: string
  success?: boolean
  expenseId?: string
}

export async function addExpenseAction(
  _prevState: AddExpenseState,
  formData: FormData
): Promise<AddExpenseState> {
  const groupId = formData.get('groupId') as string
  const description = (formData.get('description') as string)?.trim()
  const amountStr = formData.get('amount') as string
  const currency = formData.get('currency') as string

  if (!groupId) return { error: 'Group is required.' }
  if (!description) return { error: 'Description is required.' }

  let amount: Decimal
  try {
    amount = new Decimal(amountStr)
    if (amount.lte(0)) throw new Error()
  } catch {
    return { error: 'Invalid amount.' }
  }

  const memberIds = formData.getAll('members') as string[]
  if (!memberIds.length) return { error: 'Select at least one member.' }

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims) return { error: 'Unauthorized' }

  const userId = claimsData.claims.sub

  const splits = splitEqually(amount, memberIds.length)
  const splitsPayload = memberIds.map((id, i) => ({
    user_id: id,
    amount: splits[i].toFixed(4),
  }))

  const { data: expenseId, error: rpcError } = await supabase.rpc('create_expense_with_splits', {
    p_group_id: groupId,
    p_paid_by: userId,
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

  return { success: true, expenseId: expenseId as string }
}
