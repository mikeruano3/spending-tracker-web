'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { locales } from '@/lib/locales'

type CreateGroupState = {
  error?: string
  success?: boolean
  groupId?: string
}

export async function createGroupAction(
  _prevState: CreateGroupState,
  formData: FormData
): Promise<CreateGroupState> {
  const name = (formData.get('name') as string)?.trim()
  const currency = (formData.get('currency') as string) || 'USD'

  if (!name) return { error: 'Group name is required.' }

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims) return { error: 'Unauthorized' }

  const userId = claimsData.claims.sub

  // Insert group
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({ name, currency, created_by: userId })
    .select('id')
    .single()

  if (groupError) return { error: groupError.message }

  // Add creator as first member
  const { error: memberError } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: userId })

  if (memberError) return { error: memberError.message }

  // Revalidate groups list for all locales
  for (const locale of locales) {
    revalidatePath(`/${locale}/groups`, 'page')
    revalidatePath(`/${locale}/dashboard`, 'page')
  }

  return { success: true, groupId: group.id }
}
