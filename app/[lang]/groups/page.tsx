import { getDictionary, hasLocale } from '@/lib/i18n'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserGroups } from '@/lib/db/groups'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default async function GroupsPage({ params }: PageProps<'/[lang]/groups'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims) redirect(`/${lang}/auth/login`)

  const dict = await getDictionary(lang)
  const groups = await getUserGroups()

  return (
    <main className="flex flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="font-mono text-2xl font-bold tracking-tight">{dict.groups.title}</h1>
        <Button asChild className="rounded-none font-mono">
          <Link href={`/${lang}/groups/new`}>{dict.groups.newGroup}</Link>
        </Button>
      </div>

      {groups.length === 0 ? (
        <p className="font-mono text-sm text-muted-foreground">{dict.groups.noGroups}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map(group => (
            <Link key={group.id} href={`/${lang}/groups/${group.id}`}>
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
          ))}
        </div>
      )}
    </main>
  )
}
