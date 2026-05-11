'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { locales } from '@/lib/locales'

type ActionState = { error?: string; success?: boolean }

export async function upsertCurrencySettingAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const fromCurrency = formData.get('fromCurrency') as string
  const toCurrency = formData.get('toCurrency') as string
  const rateStr = formData.get('rate') as string
  const isFixed = formData.get('isFixed') === 'true'

  if (!fromCurrency || !toCurrency) return { error: 'Both currencies are required.' }
  if (fromCurrency === toCurrency) return { error: 'Currencies must be different.' }

  const rate = parseFloat(rateStr)
  if (isNaN(rate) || rate <= 0) return { error: 'Rate must be a positive number.' }

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims) return { error: 'Unauthorized' }

  const userId = claimsData.claims.sub

  const { error } = await supabase
    .from('currency_settings')
    .upsert(
      { user_id: userId, from_currency: fromCurrency, to_currency: toCurrency, rate, is_fixed: isFixed, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,from_currency,to_currency' }
    )

  if (error) return { error: error.message }

  for (const locale of locales) {
    revalidatePath(`/${locale}/settings`, 'page')
  }

  return { success: true }
}

export async function deleteCurrencySettingAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = formData.get('id') as string

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('currency_settings')
    .delete()
    .eq('id', id)
    .eq('user_id', claimsData.claims.sub)

  if (error) return { error: error.message }

  for (const locale of locales) {
    revalidatePath(`/${locale}/settings`, 'page')
  }

  return { success: true }
}

export async function updatePreferredCurrencyAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const currency = formData.get('currency') as string

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('profiles')
    .update({ preferred_currency: currency })
    .eq('id', claimsData.claims.sub)

  if (error) return { error: error.message }

  for (const locale of locales) {
    revalidatePath(`/${locale}/settings`, 'page')
    revalidatePath(`/${locale}/split`, 'page')
  }

  return { success: true }
}
