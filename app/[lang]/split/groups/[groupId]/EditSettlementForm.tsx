'use client'

import { useActionState, useEffect, useState } from 'react'
import { updateSettlementAction } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { SUPPORTED_CURRENCIES } from '@/lib/currencies'

interface Member {
  userId: string
  displayName: string
}

interface EditableSettlement {
  id: string
  groupId: string
  payeeId: string
  amount: string
  currency: string
}

export default function EditSettlementForm({
  settlement,
  members,
  currentUserId,
}: {
  settlement: EditableSettlement
  members: Member[]
  currentUserId: string
}) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(updateSettlementAction, {})

  useEffect(() => {
    if (state.success) setOpen(false)
  }, [state.success])

  const others = members.filter(m => m.userId !== currentUserId)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 rounded-none px-2 font-mono text-xs">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-mono">Edit Settlement</DialogTitle>
        </DialogHeader>

        <form action={action} className="mt-2 flex flex-col gap-4">
          <input type="hidden" name="settlementId" value={settlement.id} />
          <input type="hidden" name="groupId" value={settlement.groupId} />

          <div className="flex flex-col gap-1.5">
            <Label className="font-mono text-xs font-medium">Paid to</Label>
            <Select name="paidTo" defaultValue={settlement.payeeId} required>
              <SelectTrigger className="rounded-none font-mono">
                <SelectValue />
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

          <div className="flex gap-2">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label className="font-mono text-xs font-medium">Amount</Label>
              <Input
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                defaultValue={settlement.amount}
                required
                className="rounded-none font-mono"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="font-mono text-xs font-medium">Currency</Label>
              <Select name="currency" defaultValue={settlement.currency}>
                <SelectTrigger className="w-24 rounded-none font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none font-mono">
                  {SUPPORTED_CURRENCIES.map(c => (
                    <SelectItem key={c} value={c} className="font-mono">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {state.error && (
            <p className="font-mono text-xs text-destructive">{state.error}</p>
          )}

          <Button type="submit" disabled={pending} className="rounded-none font-mono">
            {pending ? 'Saving...' : 'Save changes'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
