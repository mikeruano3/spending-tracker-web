import { getDictionary, hasLocale } from '@/lib/i18n'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserGroups } from '@/lib/db/groups'
import { getUserTotalBalance } from '@/lib/db/balances'
import { formatMoney } from '@/lib/currencies'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default async function SplitPage({ params }: PageProps<'/[lang]/split'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims) redirect(`/${lang}/auth/login`)

  const userId = data.claims.sub
  const dict = await getDictionary(lang)

  const [groups, balance] = await Promise.all([
    getUserGroups(),
    getUserTotalBalance(userId),
  ])

  const netIsPositive = balance.net.gte(0)

  return (
    <main className="flex flex-col gap-6 p-4">
      <h1 className="font-mono text-2xl font-bold tracking-tight">{dict.dashboard.title}</h1>

      {/* Balance summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="rounded-none border-border">
          <CardContent className="p-4">
            <p className="font-mono text-xs text-muted-foreground">{dict.dashboard.youAreOwed}</p>
            <p className="mt-1 font-mono text-xl font-semibold text-green-600 dark:text-green-400">
              {formatMoney(balance.totalOwed, 'USD')}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-none border-border">
          <CardContent className="p-4">
            <p className="font-mono text-xs text-muted-foreground">{dict.dashboard.youOwe}</p>
            <p className="mt-1 font-mono text-xl font-semibold text-red-600 dark:text-red-400">
              {formatMoney(balance.totalOwe, 'USD')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Net balance */}
      <Card className={cn('rounded-none border-2', netIsPositive ? 'border-green-500' : 'border-red-500')}>
        <CardContent className="p-4">
          <p className="font-mono text-xs text-muted-foreground">{dict.dashboard.netBalance}</p>
          <p className={cn('mt-1 font-mono text-2xl font-bold', netIsPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
            {netIsPositive ? '+' : ''}{formatMoney(balance.net, 'USD')}
          </p>
        </CardContent>
      </Card>

      {/* Groups list */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {dict.dashboard.yourGroups}
          </h2>
          <Button asChild variant="outline" size="sm" className="rounded-none font-mono">
            <Link href={`/${lang}/split/groups/new`}>{dict.groups.newGroup}</Link>
          </Button>
        </div>

        {groups.length === 0 ? (
          <p className="font-mono text-sm text-muted-foreground">{dict.dashboard.noGroups}</p>
        ) : (
          groups.map(group => (
            <Link key={group.id} href={`/${lang}/split/groups/${group.id}`}>
              <Card className="rounded-none border-border transition-colors hover:bg-accent">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-mono text-sm font-semibold">{group.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {group.memberCount} {dict.groups.members}
                    </p>
                  </div>
                  <Badge variant="secondary" className="rounded-none font-mono">
                    {group.currency}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </main>
  )
}
