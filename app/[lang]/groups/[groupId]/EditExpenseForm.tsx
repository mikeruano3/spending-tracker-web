'use client'

import { useActionState, useEffect, useState } from 'react'
import { updateExpenseAction } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { SUPPORTED_CURRENCIES } from '@/lib/currencies'
import Decimal from 'decimal.js'
import type { ExpenseSplit } from '@/lib/db/expenses'

interface Member {
  userId: string
  displayName: string
  email: string
}

interface EditableExpense {
  id: string
  groupId: string
  description: string
  amount: string
  currency: string
  splits: ExpenseSplit[]
}

export default function EditExpenseForm({
  expense,
  groupMembers,
}: {
  expense: EditableExpense
  groupMembers: Member[]
}) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(updateExpenseAction, {})
  const [checkedIds, setCheckedIds] = useState<Set<string>>(
    () => new Set(expense.splits.map(s => s.userId))
  )
  const [amount, setAmount] = useState(expense.amount)

  useEffect(() => {
    if (state.success) setOpen(false)
  }, [state.success])

  function handleOpenChange(o: boolean) {
    if (o) {
      setCheckedIds(new Set(expense.splits.map(s => s.userId)))
      setAmount(expense.amount)
    }
    setOpen(o)
  }

  function toggleMember(userId: string) {
    setCheckedIds(prev => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  const checkedCount = checkedIds.size
  let splitPreview: string | null = null
  try {
    const d = new Decimal(amount)
    if (d.gt(0) && checkedCount > 0) {
      splitPreview = d.dividedBy(checkedCount).toDecimalPlaces(2, Decimal.ROUND_DOWN).toFixed(2)
    }
  } catch { /* invalid input */ }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 rounded-none px-2 font-mono text-xs">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono">Edit Expense</DialogTitle>
        </DialogHeader>

        <form action={action} className="mt-2 flex flex-col gap-4">
          <input type="hidden" name="expenseId" value={expense.id} />
          <input type="hidden" name="groupId" value={expense.groupId} />

          <div className="flex flex-col gap-1.5">
            <Label className="font-mono text-xs font-medium">Description</Label>
            <Input
              name="description"
              defaultValue={expense.description}
              required
              className="rounded-none font-mono"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label className="font-mono text-xs font-medium">Amount</Label>
              <Input
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                className="rounded-none font-mono"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="font-mono text-xs font-medium">Currency</Label>
              <Select name="currency" defaultValue={expense.currency}>
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

          <div className="flex flex-col gap-1.5">
            <Label className="font-mono text-xs font-medium">Who&apos;s involved?</Label>
            <div className="flex flex-col gap-1 border border-border p-2">
              {groupMembers.map(m => (
                <label key={m.userId} className="flex cursor-pointer items-center gap-3 py-0.5">
                  <input
                    type="checkbox"
                    name="members"
                    value={m.userId}
                    checked={checkedIds.has(m.userId)}
                    onChange={() => toggleMember(m.userId)}
                    className="h-4 w-4 accent-foreground"
                  />
                  <span className="font-mono text-xs">{m.displayName}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{m.email}</span>
                </label>
              ))}
            </div>
          </div>

          {splitPreview && checkedCount > 0 && (
            <p className="font-mono text-xs text-muted-foreground">
              Split: <span className="font-semibold text-foreground">{splitPreview}</span> each × {checkedCount}
            </p>
          )}

          {state.error && (
            <p className="font-mono text-xs text-destructive">{state.error}</p>
          )}

          <Button
            type="submit"
            disabled={pending || checkedCount === 0}
            className="rounded-none font-mono"
          >
            {pending ? 'Saving...' : 'Save changes'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
