'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { locales } from '@/lib/locales'

type ActionState = { error?: string; success?: boolean }

function revalidateHabits() {
  for (const locale of locales) {
    revalidatePath(`/${locale}/habits`, 'page')
  }
}

export async function createHabitAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'Name is required.' }
  if (name.length > 80) return { error: 'Name is too long.' }

  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  if (!claims?.claims) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('habits')
    .insert({ user_id: claims.claims.sub, name })

  if (error) return { error: error.message }

  revalidateHabits()
  return { success: true }
}

export async function updateHabitAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = formData.get('id') as string
  const name = (formData.get('name') as string)?.trim()
  if (!id || !name) return { error: 'Invalid input.' }
  if (name.length > 80) return { error: 'Name is too long.' }

  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  if (!claims?.claims) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('habits')
    .update({ name })
    .eq('id', id)
    .eq('user_id', claims.claims.sub)

  if (error) return { error: error.message }

  revalidateHabits()
  return { success: true }
}

export async function deleteHabitAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = formData.get('id') as string
  if (!id) return { error: 'Invalid id.' }

  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  if (!claims?.claims) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', id)
    .eq('user_id', claims.claims.sub)

  if (error) return { error: error.message }

  revalidateHabits()
  return { success: true }
}

export async function toggleHabitCompletionAction(input: {
  habitId: string
  date: string
  done: boolean
}): Promise<{ error?: string }> {
  const { habitId, date, done } = input
  if (!habitId || !date) return { error: 'Invalid input.' }

  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  if (!claims?.claims) return { error: 'Unauthorized' }

  const userId = claims.claims.sub

  if (done) {
    const { error } = await supabase
      .from('habit_completions')
      .upsert(
        { habit_id: habitId, user_id: userId, completed_on: date },
        { onConflict: 'habit_id,completed_on' },
      )
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('habit_completions')
      .delete()
      .eq('habit_id', habitId)
      .eq('completed_on', date)
      .eq('user_id', userId)
    if (error) return { error: error.message }
  }

  revalidateHabits()
  return {}
}
