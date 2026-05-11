import { getDictionary, hasLocale } from '@/lib/i18n'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRates, SUPPORTED_CURRENCIES } from '@/lib/currencies'
import CurrencySettingsForm from './CurrencySettingsForm'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from '@/components/ThemeToggle'

export default async function SettingsPage({ params }: PageProps<'/[lang]/settings'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims) redirect(`/${lang}/auth/login`)

  const userId = claimsData.claims.sub
  const dict = await getDictionary(lang)

  // Fetch user's currency settings
  const { data: rawSettings } = await supabase
    .from('currency_settings')
    .select('id, from_currency, to_currency, rate, is_fixed')
    .eq('user_id', userId)
    .order('from_currency')

  const settings = (rawSettings ?? []).map(s => ({
    id: s.id,
    fromCurrency: s.from_currency,
    toCurrency: s.to_currency,
    rate: Number(s.rate),
    isFixed: s.is_fixed,
  }))

  // Fetch user profile for preferred currency
  const { data: profile } = await supabase
    .from('profiles')
    .select('preferred_currency')
    .eq('id', userId)
    .single()

  // All registered users (profiles table is publicly readable)
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, email, display_name, created_at')
    .order('created_at', { ascending: true })

  // Live rates (best-effort — don't block the page if API is down)
  let liveRates: Record<string, number> = {}
  try {
    liveRates = await getRates('USD', [...SUPPORTED_CURRENCIES].filter(c => c !== 'USD'))
  } catch {
    // rates unavailable, show dashes in UI
  }

  return (
    <main className="flex flex-col gap-6 p-4">
      <h1 className="font-mono text-2xl font-bold tracking-tight">{dict.settings.title}</h1>

      {/* Appearance */}
      <div className="flex flex-col gap-3">
        <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Appearance
        </h2>
        <ThemeToggle />
      </div>

      <Separator />

      <CurrencySettingsForm
        settings={settings}
        preferredCurrency={profile?.preferred_currency ?? 'USD'}
        liveRates={liveRates}
        dict={dict.settings}
      />

      <Separator />

      {/* Registered users — diagnostic section */}
      <div className="flex flex-col gap-3">
        <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Registered Users ({allProfiles?.length ?? 0})
        </h2>
        {!allProfiles?.length ? (
          <p className="font-mono text-sm text-muted-foreground">No profiles found.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {allProfiles.map(p => (
              <Card key={p.id} className="rounded-none border-border">
                <CardContent className="flex items-center justify-between p-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-sm font-semibold">
                      {p.display_name || <span className="text-muted-foreground italic">no display name</span>}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">{p.email}</span>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {p.id === userId ? '← you' : ''}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
