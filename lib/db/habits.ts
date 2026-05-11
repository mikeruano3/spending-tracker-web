import { createClient } from '@/lib/supabase/server'

export interface Habit {
  id: string
  name: string
  sortOrder: number
  createdAt: string
}

export interface HabitCompletion {
  habitId: string
  completedOn: string
}

export async function getUserHabits(): Promise<Habit[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('habits')
    .select('id, name, sort_order, created_at')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map(h => ({
    id: h.id,
    name: h.name,
    sortOrder: h.sort_order,
    createdAt: h.created_at,
  }))
}

/** Fetch completions for the calling user between two dates inclusive (YYYY-MM-DD). */
export async function getHabitCompletionsBetween(
  startDate: string,
  endDate: string,
): Promise<HabitCompletion[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('habit_completions')
    .select('habit_id, completed_on')
    .gte('completed_on', startDate)
    .lte('completed_on', endDate)

  if (error) throw error
  return (data ?? []).map(c => ({
    habitId: c.habit_id,
    completedOn: c.completed_on,
  }))
}
