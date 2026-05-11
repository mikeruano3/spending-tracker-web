'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HouseIcon, UsersThreeIcon, PlusCircleIcon, GearSixIcon, UserCircleIcon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import type en from '@/dictionaries/en.json'

type NavDict = typeof en['nav']

interface BottomNavProps {
  dict: NavDict
  lang: string
}

const SPENDING_PREFIXES = ['/split', '/groups', '/expenses', '/settings', '/account']

export default function BottomNav({ dict, lang }: BottomNavProps) {
  const pathname = usePathname()

  if (pathname.includes('/auth/')) return null

  // Strip the locale prefix so we can match against route prefixes.
  const pathWithoutLocale = pathname.replace(new RegExp(`^/${lang}`), '') || '/'
  const isSpendingArea = SPENDING_PREFIXES.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(`${p}/`)
  )
  if (!isSpendingArea) return null

  const tabs = [
    { href: `/${lang}/split`,         label: dict.dashboard, icon: HouseIcon },
    { href: `/${lang}/groups`,        label: dict.groups,    icon: UsersThreeIcon },
    { href: `/${lang}/expenses/new`,  label: dict.add,       icon: PlusCircleIcon },
    { href: `/${lang}/settings`,      label: dict.settings,  icon: GearSixIcon },
    { href: `/${lang}/account`,       label: dict.account,   icon: UserCircleIcon },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex h-16 items-center justify-around px-2">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-3 font-mono text-xs transition-colors',
                isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon size={24} weight={isActive ? 'fill' : 'regular'} />
              <span className="text-[10px]">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
