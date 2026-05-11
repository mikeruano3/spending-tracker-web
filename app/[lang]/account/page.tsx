import { getDictionary, hasLocale } from '@/lib/i18n'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import LogoutButton from './LogoutButton'
import DisplayNameForm from './DisplayNameForm'

export default async function AccountPage({ params }: PageProps<'/[lang]/account'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims) redirect(`/${lang}/auth/login`)

  const userId = claimsData.claims.sub
  // Email is always in the JWT claims — use it as the source of truth
  const authEmail = (claimsData.claims as Record<string, unknown>).email as string | undefined
  const dict = await getDictionary(lang)

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, display_name, preferred_currency')
    .eq('id', userId)
    .single()

  // Backfill the profiles row if it exists but email is missing
  if (profile && !profile.email && authEmail) {
    await supabase
      .from('profiles')
      .update({ email: authEmail })
      .eq('id', userId)
  }

  const displayEmail = profile?.email || authEmail || '—'

  return (
    <main className="flex flex-col gap-6 p-4">
      <h1 className="font-mono text-2xl font-bold tracking-tight">{dict.account.title}</h1>

      {/* Profile info */}
      <Card className="rounded-none border-border">
        <CardContent className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-xs text-muted-foreground">{dict.account.emailLabel}</span>
            <span className="font-mono text-sm">{displayEmail}</span>
          </div>
          <Separator />
          <DisplayNameForm
            currentName={profile?.display_name ?? ''}
            dict={dict.account}
          />
        </CardContent>
      </Card>

      {/* Currency settings link */}
      <Link
        href={`/${lang}/split/settings`}
        className="flex items-center justify-between border border-border p-4 font-mono text-sm transition-colors hover:bg-accent"
      >
        <span>{dict.account.currencySettings}</span>
        <span className="text-muted-foreground">→</span>
      </Link>

      <Separator />

      {/* Sign out */}
      <LogoutButton lang={lang} label={dict.account.logout} />
    </main>
  )
}
