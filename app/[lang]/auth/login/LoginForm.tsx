'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type en from '@/dictionaries/en.json'

type LoginDict = typeof en['auth']['login']

export default function LoginForm({ dict, lang }: { dict: LoginDict; lang: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push(`/${lang}`)
    router.refresh()
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm border border-border bg-card p-8">
        <h1 className="mb-1 font-mono text-xl font-semibold tracking-tight">{dict.title}</h1>
        <p className="mb-6 font-mono text-sm text-muted-foreground">{dict.subtitle}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="font-mono text-sm font-medium">
              {dict.email}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={dict.emailPlaceholder}
              required
              className="border border-border bg-background px-3 py-2 font-mono text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="font-mono text-sm font-medium">
              {dict.password}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={dict.passwordPlaceholder}
              required
              className="border border-border bg-background px-3 py-2 font-mono text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {error && <p className="font-mono text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-foreground px-4 py-2 font-mono text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
          >
            {loading ? dict.submitting : dict.submit}
          </button>
        </form>

        <p className="mt-6 font-mono text-sm text-muted-foreground">
          {dict.noAccount}{' '}
          <Link
            href={`/${lang}/auth/register`}
            className="text-foreground underline underline-offset-4"
          >
            {dict.createOne}
          </Link>
        </p>
      </div>
    </div>
  )
}
