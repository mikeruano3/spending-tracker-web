'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { locales } from '@/lib/locales'

type ActionState = { error?: string; success?: boolean }

function revalidateTodos() {
  for (const locale of locales) {
    revalidatePath(`/${locale}/todos`, 'page')
  }
}

export async function createTodoAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const title = (formData.get('title') as string)?.trim()
  if (!title) return { error: 'Title is required.' }
  if (title.length > 200) return { error: 'Title is too long.' }

  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  if (!claims?.claims) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('todos')
    .insert({ user_id: claims.claims.sub, title })

  if (error) return { error: error.message }

  revalidateTodos()
  return { success: true }
}

export async function toggleTodoAction(input: {
  id: string
  done: boolean
}): Promise<{ error?: string }> {
  if (!input.id) return { error: 'Invalid id.' }

  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  if (!claims?.claims) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('todos')
    .update({
      is_done: input.done,
      completed_at: input.done ? new Date().toISOString() : null,
    })
    .eq('id', input.id)
    .eq('user_id', claims.claims.sub)

  if (error) return { error: error.message }

  revalidateTodos()
  return {}
}

export async function deleteTodoAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = formData.get('id') as string
  if (!id) return { error: 'Invalid id.' }

  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  if (!claims?.claims) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id)
    .eq('user_id', claims.claims.sub)

  if (error) return { error: error.message }

  revalidateTodos()
  return { success: true }
}

export async function clearDoneTodosAction(
  _prev: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  if (!claims?.claims) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('user_id', claims.claims.sub)
    .eq('is_done', true)

  if (error) return { error: error.message }

  revalidateTodos()
  return { success: true }
}
