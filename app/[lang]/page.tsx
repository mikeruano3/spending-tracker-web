import { getDictionary, hasLocale } from '@/lib/i18n'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage({ params }: PageProps<'/[lang]'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (data?.claims) redirect(`/${lang}/dashboard`)

  const dict = await getDictionary(lang)

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-10 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="font-mono text-4xl font-bold tracking-tight">
            {dict.home.title}
          </h1>
          <p className="max-w-sm font-mono text-base text-muted-foreground">
            {dict.home.subtitle}
          </p>
        </div>
        <div className="flex gap-4">
          <Link
            href={`/${lang}/auth/login`}
            className="border border-border px-6 py-2.5 font-mono text-sm transition-colors hover:bg-muted"
          >
            {dict.home.signIn}
          </Link>
          <Link
            href={`/${lang}/auth/register`}
            className="bg-foreground px-6 py-2.5 font-mono text-sm text-background transition-colors hover:bg-foreground/90"
          >
            {dict.home.register}
          </Link>
        </div>
      </div>
    </div>
  )
}
