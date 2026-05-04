'use client'

import { useActionState } from 'react'
import { recordSettlementAction } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type en from '@/dictionaries/en.json'

type GroupsDict = typeof en['groups']

interface Member {
  userId: string
  displayName: string
}

export default function SettleUpForm({
  groupId,
  currency,
  members,
  currentUserId,
  dict,
}: {
  groupId: string
  currency: string
  members: Member[]
  currentUserId: string
  dict: GroupsDict
}) {
  const [state, action, pending] = useActionState(recordSettlementAction, {})
  const others = members.filter(m => m.userId !== currentUserId)

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="groupId" value={groupId} />
      <input type="hidden" name="currency" value={currency} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="paid-to" className="font-mono text-sm font-medium">
          {dict.settle.to}
        </Label>
        <Select name="paidTo" required>
          <SelectTrigger id="paid-to" className="rounded-none font-mono">
            <SelectValue placeholder="Select person" />
          </SelectTrigger>
          <SelectContent className="rounded-none font-mono">
            {others.map(m => (
              <SelectItem key={m.userId} value={m.userId} className="font-mono">
                {m.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="settle-amount" className="font-mono text-sm font-medium">
          {dict.settle.amount}
        </Label>
        <Input
          id="settle-amount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          required
          className="rounded-none font-mono"
        />
      </div>

      {state.error && <p className="font-mono text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="font-mono text-sm text-green-600">✓ Settlement recorded</p>}

      <Button type="submit" disabled={pending} className="rounded-none font-mono">
        {pending ? dict.settle.submitting : dict.settle.submit}
      </Button>
    </form>
  )
}
