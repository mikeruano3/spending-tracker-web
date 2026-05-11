'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createGroupAction } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SUPPORTED_CURRENCIES } from '@/lib/currencies'
import type en from '@/dictionaries/en.json'

type GroupsDict = typeof en['groups']

export default function CreateGroupForm({ dict, lang }: { dict: GroupsDict; lang: string }) {
  const router = useRouter()
  const [state, action, pending] = useActionState(createGroupAction, {})

  useEffect(() => {
    if (state.success && state.groupId) {
      router.push(`/${lang}/split/groups/${state.groupId}`)
    }
  }, [state.success, state.groupId, lang, router])

  return (
    <main className="flex min-h-[80vh] flex-1 items-start justify-center p-4 pt-8">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 font-mono text-2xl font-bold tracking-tight">{dict.create.title}</h1>

        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name" className="font-mono text-sm font-medium">
              {dict.create.nameLabel}
            </Label>
            <Input
              id="name"
              name="name"
              placeholder={dict.create.namePlaceholder}
              required
              className="rounded-none font-mono"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="currency" className="font-mono text-sm font-medium">
              {dict.create.currencyLabel}
            </Label>
            <Select name="currency" defaultValue="USD">
              <SelectTrigger id="currency" className="rounded-none font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none font-mono">
                {SUPPORTED_CURRENCIES.map(c => (
                  <SelectItem key={c} value={c} className="font-mono">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {state.error && (
            <p className="font-mono text-sm text-destructive">{state.error}</p>
          )}

          <Button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-none font-mono"
          >
            {pending ? dict.create.submitting : dict.create.submit}
          </Button>
        </form>
      </div>
    </main>
  )
}
