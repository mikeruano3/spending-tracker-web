'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch — render only after mount
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="h-9 w-full" />

  const isDark = resolvedTheme === 'dark'

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between border border-border p-3">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-sm font-semibold">
            {isDark ? 'Dark' : 'Light'}
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            {theme === 'system' ? 'Following system preference' : 'Manually set'}
          </span>
        </div>
        <div className="flex gap-1">
          {(['light', 'system', 'dark'] as const).map(t => (
            <Button
              key={t}
              variant={theme === t ? 'default' : 'outline'}
              size="sm"
              className="rounded-none font-mono text-xs capitalize"
              onClick={() => setTheme(t)}
            >
              {t}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
