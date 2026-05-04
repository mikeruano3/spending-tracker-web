'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { addExpenseAction } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { SUPPORTED_CURRENCIES } from '@/lib/currencies'
import Decimal from 'decimal.js'
import type en from '@/dictionaries/en.json'
import type { FormMember } from './page'
import CurrencyConverterDialog from './CurrencyConverterDialog'

type ExpensesDict = typeof en['expenses']

interface Group {
  id: string
  name: string
  currency: string
  memberCount: number
}

export default function AddExpenseForm({
  groups,
  groupMembers,
  dict,
  lang,
}: {
  groups: Group[]
  groupMembers: Record<string, FormMember[]>
  dict: ExpensesDict
  lang: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedGroupId = searchParams.get('groupId') ?? ''

  const initialGroupId = preselectedGroupId || (groups[0]?.id ?? '')

  const [state, action, pending] = useActionState(addExpenseAction, {})
  const [amount, setAmount] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState(initialGroupId)
  const [checkedIds, setCheckedIds] = useState<Set<string>>(
    () => new Set((groupMembers[initialGroupId] ?? []).map(m => m.userId))
  )

  const currentMembers = groupMembers[selectedGroupId] ?? []
  const checkedCount = checkedIds.size

  function handleGroupChange(groupId: string) {
    setSelectedGroupId(groupId)
    setCheckedIds(new Set((groupMembers[groupId] ?? []).map(m => m.userId)))
  }

  function toggleMember(userId: string) {
    setCheckedIds(prev => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  // Live split preview
  let splitPreview: string | null = null
  try {
    const d = new Decimal(amount)
    if (d.gt(0) && checkedCount > 0) {
      const perPerson = d.dividedBy(checkedCount).toDecimalPlaces(2, Decimal.ROUND_DOWN)
      splitPreview = perPerson.toFixed(2)
    }
  } catch {
    // invalid input, ignore
  }

  useEffect(() => {
    if (state.success) {
      router.push(`/${lang}/groups/${selectedGroupId}`)
    }
  }, [state.success, lang, router, selectedGroupId])

  if (groups.length === 0) {
    return (
      <main className="flex flex-1 items-center justify-center p-4">
        <p className="font-mono text-sm text-muted-foreground">{dict.add.noGroups}</p>
      </main>
    )
  }

  const selectedGroup = groups.find(g => g.id === selectedGroupId)

  return (
    <main className="flex flex-col gap-6 p-4">
      <h1 className="font-mono text-2xl font-bold tracking-tight">{dict.add.title}</h1>

      <form action={action} className="flex flex-col gap-4">
        {/* Group select */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="group" className="font-mono text-sm font-medium">
            {dict.add.groupLabel}
          </Label>
          <Select
            name="groupId"
            value={selectedGroupId}
            onValueChange={handleGroupChange}
            required
          >
            <SelectTrigger id="group" className="rounded-none font-mono">
              <SelectValue placeholder={dict.add.groupPlaceholder} />
            </SelectTrigger>
            <SelectContent className="rounded-none font-mono">
              {groups.map(g => (
                <SelectItem key={g.id} value={g.id} className="font-mono">
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Members involved */}
        {currentMembers.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <Label className="font-mono text-sm font-medium">{dict.add.membersLabel}</Label>
            <div className="flex flex-col gap-1 border border-border p-3">
              {currentMembers.map(m => (
                <label
                  key={m.userId}
                  className="flex cursor-pointer items-center gap-3 py-1"
                >
                  <input
                    type="checkbox"
                    name="members"
                    value={m.userId}
                    checked={checkedIds.has(m.userId)}
                    onChange={() => toggleMember(m.userId)}
                    className="h-4 w-4 accent-foreground"
                  />
                  <span className="font-mono text-sm">{m.displayName}</span>
                  <span className="font-mono text-xs text-muted-foreground">{m.email}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description" className="font-mono text-sm font-medium">
            {dict.add.descriptionLabel}
          </Label>
          <Input
            id="description"
            name="description"
            placeholder={dict.add.descriptionPlaceholder}
            required
            className="rounded-none font-mono"
          />
        </div>

        {/* Amount + currency row */}
        <div className="flex gap-2">
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="amount" className="font-mono text-sm font-medium">
                {dict.add.amountLabel}
              </Label>
              <CurrencyConverterDialog
                onUse={value => setAmount(value)}
                defaultTo={selectedGroup?.currency ?? 'USD'}
              />
            </div>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              required
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="rounded-none font-mono"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="currency" className="font-mono text-sm font-medium">
              {dict.add.currencyLabel}
            </Label>
            <Select name="currency" defaultValue={selectedGroup?.currency ?? 'USD'}>
              <SelectTrigger id="currency" className="w-24 rounded-none font-mono">
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

        {/* Split preview */}
        {splitPreview && checkedCount > 0 && (
          <Card className="rounded-none border-dashed border-border">
            <CardContent className="p-3">
              <p className="font-mono text-xs text-muted-foreground">
                {dict.add.splitPreview}:{' '}
                <span className="font-semibold text-foreground">{splitPreview}</span>{' '}
                {dict.add.each} × {checkedCount}
              </p>
            </CardContent>
          </Card>
        )}

        {checkedCount === 0 && (
          <p className="font-mono text-xs text-destructive">Select at least one member.</p>
        )}

        {state.error && (
          <p className="font-mono text-sm text-destructive">{state.error}</p>
        )}

        <Button
          type="submit"
          disabled={pending || checkedCount === 0}
          className="mt-2 rounded-none font-mono"
        >
          {pending ? dict.add.submitting : dict.add.submit}
        </Button>
      </form>
    </main>
  )
}
