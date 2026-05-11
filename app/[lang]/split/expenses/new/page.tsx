import { getDictionary, hasLocale } from '@/lib/i18n'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserGroups } from '@/lib/db/groups'
import AddExpenseForm from './AddExpenseForm'

export interface FormMember {
  userId: string
  email: string
  displayName: string
}

export default async function AddExpensePage({ params }: PageProps<'/[lang]/split/expenses/new'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims) redirect(`/${lang}/auth/login`)

  const dict = await getDictionary(lang)
  const groups = await getUserGroups()

  // Fetch members for all user groups in one query
  const groupMembers: Record<string, FormMember[]> = {}
  if (groups.length > 0) {
    const { data: membersData } = await supabase
      .from('group_members')
      .select('group_id, user_id, profiles(email, display_name)')
      .in('group_id', groups.map(g => g.id))

    for (const m of membersData ?? []) {
      const p = m.profiles as unknown as { email: string; display_name: string } | null
      if (!groupMembers[m.group_id]) groupMembers[m.group_id] = []
      groupMembers[m.group_id].push({
        userId: m.user_id,
        email: p?.email ?? '',
        displayName: p?.display_name || p?.email?.split('@')[0] || 'Unknown',
      })
    }
  }

  return <AddExpenseForm groups={groups} groupMembers={groupMembers} dict={dict.expenses} lang={lang} />
}
