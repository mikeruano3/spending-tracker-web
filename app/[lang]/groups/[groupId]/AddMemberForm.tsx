'use client'

import { useActionState } from 'react'
import { addMemberAction } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type en from '@/dictionaries/en.json'

type GroupsDict = typeof en['groups']

export default function AddMemberForm({
  groupId,
  dict,
}: {
  groupId: string
  dict: GroupsDict
}) {
  const [state, action, pending] = useActionState(addMemberAction, {})

  const errorMessage =
    state.error === 'notFound'
      ? dict.addMember.notFound
      : state.error === 'alreadyMember'
      ? dict.addMember.alreadyMember
      : state.error

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="groupId" value={groupId} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="add-member-email" className="font-mono text-sm font-medium">
          {dict.addMember.label}
        </Label>
        <div className="flex gap-2">
          <Input
            id="add-member-email"
            name="email"
            type="email"
            placeholder={dict.addMember.placeholder}
            required
            className="rounded-none font-mono"
          />
          <Button type="submit" disabled={pending} className="rounded-none font-mono whitespace-nowrap">
            {pending ? dict.addMember.submitting : dict.addMember.submit}
          </Button>
        </div>
      </div>
      {errorMessage && <p className="font-mono text-sm text-destructive">{errorMessage}</p>}
      {state.success && <p className="font-mono text-sm text-green-600">✓ Member added</p>}
    </form>
  )
}
