'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { locales } from '@/lib/locales'

type ActionState = { error?: string; success?: boolean }

export async function updateDisplayNameAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const displayName = (formData.get('displayName') as string)?.trim()
  if (!displayName) return { error: 'Name cannot be empty.' }

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName })
    .eq('id', claimsData.claims.sub)

  if (error) return { error: error.message }

  for (const locale of locales) {
    revalidatePath(`/${locale}/account`, 'page')
  }

  return { success: true }
}
