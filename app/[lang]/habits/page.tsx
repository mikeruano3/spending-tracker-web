import { getDictionary, hasLocale } from '@/lib/i18n'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserHabits, getHabitCompletionsBetween } from '@/lib/db/habits'
import { buildWeek } from '@/lib/week'
import HabitsView from './HabitsView'

export default async function HabitsPage(props: PageProps<'/[lang]/habits'>) {
  const { lang } = await props.params
  if (!hasLocale(lang)) notFound()

  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  if (!claims?.claims) redirect(`/${lang}/auth/login`)

  const dict = await getDictionary(lang)
  const sp = (await props.searchParams) ?? {}

  const tabRaw = typeof sp.tab === 'string' ? sp.tab : undefined
  const tab: 'list' | 'calendar' = tabRaw === 'calendar' ? 'calendar' : 'list'

  const weekRaw = typeof sp.week === 'string' ? parseInt(sp.week, 10) : 0
  const weekOffset = Number.isFinite(weekRaw) ? weekRaw : 0

  const week = buildWeek(new Date(), weekOffset)

  const [habits, completions] = await Promise.all([
    getUserHabits(),
    getHabitCompletionsBetween(week.startStr, week.endStr),
  ])

  return (
    <HabitsView
      lang={lang}
      dict={dict.habits}
      activeTab={tab}
      weekOffset={weekOffset}
      weekDays={week.daysStr}
      habits={habits}
      completions={completions}
    />
  )
}
