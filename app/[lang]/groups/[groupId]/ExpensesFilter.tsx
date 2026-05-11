'use client'

import { useState, useMemo } from 'react'
import type { Expense } from '@/lib/db/expenses'
import { formatMoney } from '@/lib/format'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import EditExpenseForm from './EditExpenseForm'
import DeleteConfirmDialog from './DeleteConfirmDialog'
import { deleteExpenseAction } from './actions'

interface Member {
  userId: string
  displayName: string
  email: string
}

export default function ExpensesFilter({
  expenses,
  groupMembers,
  groupId,
  noExpensesLabel,
  paidByLabel,
}: {
  expenses: Expense[]
  groupMembers: Member[]
  groupId: string
  noExpensesLabel: string
  paidByLabel: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [paidBy, setPaidBy] = useState('all')
  const [involved, setInvolved] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [currency, setCurrency] = useState('all')

  const payers = useMemo(() => {
    const map = new Map<string, string>()
    for (const e of expenses) map.set(e.paidBy, e.paidByName)
    return [...map.entries()].map(([id, name]) => ({ id, name }))
  }, [expenses])

  const currencies = useMemo(
    () => [...new Set(expenses.map(e => e.currency))],
    [expenses]
  )

  const filtered = useMemo(() => expenses.filter(e => {
    if (search && !e.description.toLowerCase().includes(search.toLowerCase())) return false
    if (paidBy !== 'all' && e.paidBy !== paidBy) return false
    if (involved !== 'all' && !e.splits.some(s => s.userId === involved)) return false
    if (dateFrom && e.expenseDate < dateFrom) return false
    if (dateTo && e.expenseDate > dateTo) return false
    if (currency !== 'all' && e.currency !== currency) return false
    return true
  }), [expenses, search, paidBy, involved, dateFrom, dateTo, currency])

  const hasActiveFilters = !!(search || paidBy !== 'all' || involved !== 'all' || dateFrom || dateTo || currency !== 'all')

  function clearFilters() {
    setSearch('')
    setPaidBy('all')
    setInvolved('all')
    setDateFrom('')
    setDateTo('')
    setCurrency('all')
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Collapsible filter panel */}
      <div className="border border-border">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex w-full items-center justify-between p-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          <span className="flex items-center gap-2">
            Filters
            {hasActiveFilters && (
              <span className="rounded-sm bg-foreground px-1 py-0.5 text-background">
                {filtered.length}/{expenses.length}
              </span>
            )}
          </span>
          <span>{open ? '▲' : '▼'}</span>
        </button>

        {open && (
          <div className="flex flex-col gap-2 border-t border-border p-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-muted-foreground">
                {filtered.length} of {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="font-mono text-[10px] text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
                >
                  Clear all
                </button>
              )}
            </div>

            <Input
              placeholder="Search description…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 rounded-none font-mono text-xs"
            />

            <div className="grid grid-cols-2 gap-2">
              <Select value={paidBy} onValueChange={setPaidBy}>
                <SelectTrigger className="h-8 rounded-none font-mono text-xs">
                  <SelectValue placeholder="Paid by" />
                </SelectTrigger>
                <SelectContent className="rounded-none font-mono">
                  <SelectItem value="all" className="font-mono text-xs">All payers</SelectItem>
                  {payers.map(p => (
                    <SelectItem key={p.id} value={p.id} className="font-mono text-xs">{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={involved} onValueChange={setInvolved}>
                <SelectTrigger className="h-8 rounded-none font-mono text-xs">
                  <SelectValue placeholder="Involved" />
                </SelectTrigger>
                <SelectContent className="rounded-none font-mono">
                  <SelectItem value="all" className="font-mono text-xs">All members</SelectItem>
                  {groupMembers.map(m => (
                    <SelectItem key={m.userId} value={m.userId} className="font-mono text-xs">{m.displayName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex flex-col gap-1">
                <Label className="font-mono text-[10px] text-muted-foreground">From</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="h-8 rounded-none font-mono text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label className="font-mono text-[10px] text-muted-foreground">To</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="h-8 rounded-none font-mono text-xs"
                />
              </div>

              {currencies.length > 1 && (
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="col-span-2 h-8 rounded-none font-mono text-xs">
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none font-mono">
                    <SelectItem value="all" className="font-mono text-xs">All currencies</SelectItem>
                    {currencies.map(c => (
                      <SelectItem key={c} value={c} className="font-mono text-xs">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Expense list */}
      {filtered.length === 0 ? (
        <p className="font-mono text-sm text-muted-foreground">
          {hasActiveFilters ? 'No expenses match the filters.' : noExpensesLabel}
        </p>
      ) : (
        filtered.map(expense => (
          <Card key={expense.id} className="rounded-none border-border">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="font-mono text-sm font-semibold">{expense.description}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{paidByLabel}</span>{' '}
                    <span className="text-blue-600 dark:text-blue-400">{expense.paidByName}</span>
                  </p>
                  {expense.splits.length > 0 && (
                    <div className="mt-0.5 flex flex-col gap-0.5">
                      <span className="font-mono text-xs font-semibold text-muted-foreground">Involved:</span>
                      {expense.splits.map(s => (
                        <span key={s.userId} className="font-mono text-xs text-muted-foreground">
                          {s.displayName} — {formatMoney(s.amount, expense.currency)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <p className="font-mono text-sm font-semibold">
                    {formatMoney(expense.amount, expense.currency)}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">{expense.expenseDate}</p>
                  <div className="flex gap-1">
                    <EditExpenseForm
                      expense={{
                        id: expense.id,
                        groupId,
                        description: expense.description,
                        amount: expense.amount,
                        currency: expense.currency,
                        splits: expense.splits,
                      }}
                      groupMembers={groupMembers}
                    />
                    <DeleteConfirmDialog
                      action={deleteExpenseAction}
                      hiddenFields={{ expenseId: expense.id, groupId }}
                      message="Delete this expense? The splits will also be removed and balances will update."
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
