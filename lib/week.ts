/**
 * Week math helpers — weeks start on Monday.
 * Dates are handled as YYYY-MM-DD strings in local time to avoid TZ drift.
 */

function pad(n: number) {
  return n.toString().padStart(2, '0')
}

export function formatLocalDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Returns the Monday of the week containing `date`. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  // getDay(): 0=Sun..6=Sat — convert to 0=Mon..6=Sun
  const dayMon0 = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - dayMon0)
  return d
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  d.setDate(d.getDate() + days)
  return d
}

export interface WeekRange {
  start: Date
  end: Date
  days: Date[]
  startStr: string
  endStr: string
  daysStr: string[]
}

/**
 * Build a week range starting Monday for the week containing `reference`
 * shifted by `offset` weeks (0 = this week, -1 = last week, etc.).
 */
export function buildWeek(reference: Date, offset = 0): WeekRange {
  const start = addDays(startOfWeek(reference), offset * 7)
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))
  const end = days[6]
  return {
    start,
    end,
    days,
    startStr: formatLocalDate(start),
    endStr: formatLocalDate(end),
    daysStr: days.map(formatLocalDate),
  }
}

export function formatWeekLabel(range: WeekRange, locale: string): string {
  const sameMonth = range.start.getMonth() === range.end.getMonth()
  const sameYear = range.start.getFullYear() === range.end.getFullYear()
  const fmt = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' })
  const fmtFull = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' })

  if (sameMonth && sameYear) {
    const month = new Intl.DateTimeFormat(locale, { month: 'short' }).format(range.start)
    return `${month} ${range.start.getDate()}–${range.end.getDate()}, ${range.start.getFullYear()}`
  }
  if (sameYear) {
    return `${fmt.format(range.start)} – ${fmt.format(range.end)}, ${range.start.getFullYear()}`
  }
  return `${fmtFull.format(range.start)} – ${fmtFull.format(range.end)}`
}
