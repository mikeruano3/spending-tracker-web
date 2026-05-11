'use client'

import Link from 'next/link'
import { ListBulletsIcon, CalendarBlankIcon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import type en from '@/dictionaries/en.json'
import type { Habit, HabitCompletion } from '@/lib/db/habits'
import HabitsList from './HabitsList'
import HabitsCalendar from './HabitsCalendar'

type HabitsDict = typeof en['habits']

interface HabitsViewProps {
  lang: string
  dict: HabitsDict
  activeTab: 'list' | 'calendar'
  weekOffset: number
  weekDays: string[]
  habits: Habit[]
  completions: HabitCompletion[]
}

export default function HabitsView({
  lang,
  dict,
  activeTab,
  weekOffset,
  weekDays,
  habits,
  completions,
}: HabitsViewProps) {
  const tabs = [
    {
      key: 'list' as const,
      href: `/${lang}/habits?tab=list`,
      label: dict.tabs.list,
      icon: ListBulletsIcon,
    },
    {
      key: 'calendar' as const,
      href: `/${lang}/habits?tab=calendar`,
      label: dict.tabs.calendar,
      icon: CalendarBlankIcon,
    },
  ]

  return (
    <>
      <main className="flex flex-col gap-4 p-4">
        <h1 className="font-mono text-2xl font-bold tracking-tight">{dict.title}</h1>

        {activeTab === 'list' ? (
          <HabitsList habits={habits} dict={dict.list} />
        ) : (
          <HabitsCalendar
            lang={lang}
            dict={dict}
            habits={habits}
            completions={completions}
            weekOffset={weekOffset}
            weekDays={weekDays}
          />
        )}
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex h-16 items-center justify-around px-2">
          {tabs.map(({ key, href, label, icon: Icon }) => {
            const isActive = key === activeTab
            return (
              <Link
                key={key}
                href={href}
                replace
                className={cn(
                  'flex flex-1 flex-col items-center gap-1 py-3 font-mono text-xs transition-colors',
                  isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon size={24} weight={isActive ? 'fill' : 'regular'} />
                <span className="text-[10px]">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
