import { createClient } from '@/lib/supabase/server'

export interface Todo {
  id: string
  title: string
  isDone: boolean
  completedAt: string | null
  createdAt: string
}

export async function getUserTodos(): Promise<Todo[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('todos')
    .select('id, title, is_done, completed_at, created_at')
    .order('is_done', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(t => ({
    id: t.id,
    title: t.title,
    isDone: t.is_done,
    completedAt: t.completed_at,
    createdAt: t.created_at,
  }))
}
