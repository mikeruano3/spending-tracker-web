import { createClient } from '@/lib/supabase/server'

export interface Group {
  id: string
  name: string
  currency: string
  createdBy: string
  createdAt: string
  memberCount: number
}

export interface GroupMember {
  userId: string
  email: string
  displayName: string
}

export async function getUserGroups(): Promise<Group[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('groups')
    .select(`
      id, name, currency, created_by, created_at,
      group_members(count)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(g => ({
    id: g.id,
    name: g.name,
    currency: g.currency,
    createdBy: g.created_by,
    createdAt: g.created_at,
    memberCount: (g.group_members as unknown as { count: number }[])[0]?.count ?? 0,
  }))
}

export async function getGroup(groupId: string): Promise<Group | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('groups')
    .select(`id, name, currency, created_by, created_at, group_members(count)`)
    .eq('id', groupId)
    .single()

  if (error) {
    // PGRST116 = no rows — group genuinely doesn't exist
    if (error.code === 'PGRST116') return null
    console.error('[getGroup] Supabase error:', JSON.stringify(error))
    throw new Error(`Failed to load group: ${error.message} (${error.code})`)
  }
  return {
    id: data.id,
    name: data.name,
    currency: data.currency,
    createdBy: data.created_by,
    createdAt: data.created_at,
    memberCount: (data.group_members as unknown as { count: number }[])[0]?.count ?? 0,
  }
}

export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('group_members')
    .select(`user_id, profiles(email, display_name)`)
    .eq('group_id', groupId)

  if (error) throw error
  return (data ?? []).map(m => {
    const profile = m.profiles as unknown as { email: string; display_name: string } | null
    return {
      userId: m.user_id,
      email: profile?.email ?? '',
      displayName: profile?.display_name || profile?.email?.split('@')[0] || 'Unknown',
    }
  })
}
