'use client'

import { useMemo, useOptimistic, useTransition } from 'react'
import Link from 'next/link'
import { CaretLeftIcon, CaretRightIcon, CheckIcon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { toggleHabitCompletionAction } from './actions'
import type { Habit, HabitCompletion } from '@/lib/db/habits'
import type en from '@/dictionaries/en.json'

type HabitsDict = typeof en['habits']

interface HabitsCalendarProps {
  lang: string
  dict: HabitsDict
  habits: Habit[]
  completions: HabitCompletion[]
  weekOffset: number
  weekDays: string[]
}

type OptAction = { habitId: string; date: string; done: boolean }

const DAY_KEYS: (keyof HabitsDict['days'])[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

export default function HabitsCalendar({
  lang,
  dict,
  habits,
  completions,
  weekOffset,
  weekDays,
}: HabitsCalendarProps) {
  const [isPending, startTransition] = useTransition()

  const baseSet = useMemo(
    () => new Set(completions.map((c) => `${c.habitId}|${c.completedOn}`)),
    [completions],
  )

  const [optimisticSet, applyOptimistic] = useOptimistic(
    baseSet,
    (prev: Set<string>, action: OptAction) => {
      const next = new Set(prev)
      const key = `${action.habitId}|${action.date}`
      if (action.done) next.add(key)
      else next.delete(key)
      return next
    },
  )

  const todayStr = useMemo(() => {
    const d = new Date()
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }, [])

  const weekLabel = useMemo(() => {
    const start = parseLocalDate(weekDays[0])
    const end = parseLocalDate(weekDays[6])
    const sameMonth = start.getMonth() === end.getMonth()
    const sameYear = start.getFullYear() === end.getFullYear()
    const fmtMonth = new Intl.DateTimeFormat(lang, { month: 'short' })
    if (sameMonth && sameYear) {
      return `${fmtMonth.format(start)} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`
    }
    const fmt = new Intl.DateTimeFormat(lang, { month: 'short', day: 'numeric' })
    return `${fmt.format(start)} – ${fmt.format(end)}${sameYear ? `, ${start.getFullYear()}` : ''}`
  }, [weekDays, lang])

  function handleToggle(habitId: string, date: string, currentlyDone: boolean) {
    const next = !currentlyDone
    startTransition(async () => {
      applyOptimistic({ habitId, date, done: next })
      await toggleHabitCompletionAction({ habitId, date, done: next })
    })
  }

  if (habits.length === 0) {
    return (
      <p className="font-mono text-sm text-muted-foreground">{dict.calendar.noHabits}</p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/${lang}/habits?tab=calendar&week=${weekOffset - 1}`}
          replace
          className="flex items-center gap-1 border border-border px-2 py-1 font-mono text-xs hover:bg-muted"
          aria-label={dict.calendar.prevWeek}
        >
          <CaretLeftIcon size={14} />
          {dict.calendar.prevWeek}
        </Link>
        <div className="flex flex-1 flex-col items-center">
          <span className="font-mono text-sm font-semibold">{weekLabel}</span>
          {weekOffset !== 0 && (
            <Link
              href={`/${lang}/habits?tab=calendar`}
              replace
              className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground underline-offset-2 hover:underline"
            >
              {dict.calendar.thisWeek}
            </Link>
          )}
        </div>
        <Link
          href={`/${lang}/habits?tab=calendar&week=${weekOffset + 1}`}
          replace
          className="flex items-center gap-1 border border-border px-2 py-1 font-mono text-xs hover:bg-muted"
          aria-label={dict.calendar.nextWeek}
        >
          {dict.calendar.nextWeek}
          <CaretRightIcon size={14} />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-mono text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 min-w-[120px] border border-border bg-background p-2 text-left font-semibold">
                {/* habit name column */}
              </th>
              {weekDays.map((d, i) => {
                const date = parseLocalDate(d)
                const isToday = d === todayStr
                return (
                  <th
                    key={d}
                    className={cn(
                      'border border-border p-1 text-center font-semibold',
                      isToday && 'bg-muted',
                    )}
                  >
                    <div className="text-[10px] uppercase text-muted-foreground">
                      {dict.days[DAY_KEYS[i]]}
                    </div>
                    <div className={cn('text-sm', isToday && 'text-foreground')}>
                      {date.getDate()}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {habits.map((h) => (
              <tr key={h.id}>
                <td className="sticky left-0 z-10 max-w-[160px] truncate border border-border bg-background p-2 text-left">
                  {h.name}
                </td>
                {weekDays.map((d) => {
                  const key = `${h.id}|${d}`
                  const done = optimisticSet.has(key)
                  return (
                    <td key={d} className="border border-border p-0 text-center">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleToggle(h.id, d, done)}
                        aria-pressed={done}
                        aria-label={`${h.name} — ${d}`}
                        className={cn(
                          'flex h-10 w-full items-center justify-center transition-colors',
                          done
                            ? 'bg-foreground text-background'
                            : 'hover:bg-muted',
                        )}
                      >
                        {done && <CheckIcon size={16} weight="bold" />}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
