'use client'

import { useActionState } from 'react'
import { updateDisplayNameAction } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type en from '@/dictionaries/en.json'

type AccountDict = typeof en['account']

export default function DisplayNameForm({
  currentName,
  dict,
}: {
  currentName: string
  dict: AccountDict
}) {
  const [state, action, pending] = useActionState(updateDisplayNameAction, {})

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="displayName" className="font-mono text-xs text-muted-foreground">
          {dict.displayNameLabel}
        </Label>
        <div className="flex gap-2">
          <Input
            id="displayName"
            name="displayName"
            defaultValue={currentName}
            placeholder={dict.displayNamePlaceholder}
            className="rounded-none font-mono"
          />
          <Button type="submit" disabled={pending} variant="outline" size="sm" className="rounded-none font-mono whitespace-nowrap">
            {pending ? dict.saving : dict.save}
          </Button>
        </div>
      </div>
      {state.error && <p className="font-mono text-xs text-destructive">{state.error}</p>}
      {state.success && <p className="font-mono text-xs text-green-600">✓ Saved</p>}
    </form>
  )
}
