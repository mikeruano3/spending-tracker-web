'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { registerAction } from './actions'
import type en from '@/dictionaries/en.json'

type RegisterDict = typeof en['auth']['register']

export default function RegisterForm({ dict, lang }: { dict: RegisterDict; lang: string }) {
  const [state, action, pending] = useActionState(registerAction, {})

  if (state.success) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm border border-border bg-card p-8">
          <h1 className="mb-1 font-mono text-xl font-semibold tracking-tight">
            {dict.checkEmail.title}
          </h1>
          <p className="font-mono text-sm text-muted-foreground">{dict.checkEmail.body}</p>
          <Link
            href={`/${lang}/auth/login`}
            className="mt-6 block font-mono text-sm underline underline-offset-4"
          >
            {dict.checkEmail.backToLogin}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm border border-border bg-card p-8">
        <h1 className="mb-1 font-mono text-xl font-semibold tracking-tight">{dict.title}</h1>
        <p className="mb-6 font-mono text-sm text-muted-foreground">{dict.subtitle}</p>

        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="font-mono text-sm font-medium">
              {dict.email}
            </label>
            <input
              id="email"
              name="email"
              type="email"
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
              name="password"
              type="password"
              placeholder={dict.passwordPlaceholder}
              required
              minLength={6}
              className="border border-border bg-background px-3 py-2 font-mono text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {state.error && (
            <p className="font-mono text-sm text-destructive">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 bg-foreground px-4 py-2 font-mono text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
          >
            {pending ? dict.submitting : dict.submit}
          </button>
        </form>

        <p className="mt-6 font-mono text-sm text-muted-foreground">
          {dict.hasAccount}{' '}
          <Link
            href={`/${lang}/auth/login`}
            className="text-foreground underline underline-offset-4"
          >
            {dict.signIn}
          </Link>
        </p>
      </div>
    </div>
  )
}
