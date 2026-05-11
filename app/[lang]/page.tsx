import { getDictionary, hasLocale } from '@/lib/i18n'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CoinsIcon, ListChecksIcon, CalendarBlankIcon, ArrowRightIcon } from '@phosphor-icons/react/ssr'

export default async function HomePage({ params }: PageProps<'/[lang]'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const isAuthenticated = !!data?.claims

  const dict = await getDictionary(lang)

  const apps = [
    {
      href: `/${lang}/split`,
      name: dict.home.apps.split.name,
      description: dict.home.apps.split.description,
      icon: CoinsIcon,
    },
    {
      href: `/${lang}/habits`,
      name: dict.home.apps.habits.name,
      description: dict.home.apps.habits.description,
      icon: CalendarBlankIcon,
    },
    {
      href: `/${lang}/todos`,
      name: dict.home.apps.todos.name,
      description: dict.home.apps.todos.description,
      icon: ListChecksIcon,
    },
  ]

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-background px-4 py-10">
      <div className="flex w-full max-w-md flex-col gap-8">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="font-mono text-3xl font-bold tracking-tight">
            {dict.home.title}
          </h1>
          <p className="font-mono text-sm text-muted-foreground">
            {dict.home.subtitle}
          </p>
        </div>

        {isAuthenticated ? (
          <div className="flex flex-col gap-3">
            {apps.map(({ href, name, description, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-4 border border-border bg-card p-4 transition-colors hover:bg-muted"
              >
                <Icon size={32} weight="duotone" className="shrink-0 text-foreground" />
                <div className="flex flex-1 flex-col">
                  <span className="font-mono text-sm font-semibold">{name}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {description}
                  </span>
                </div>
                <ArrowRightIcon size={18} className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex justify-center gap-3">
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
        )}
      </div>
    </div>
  )
}
