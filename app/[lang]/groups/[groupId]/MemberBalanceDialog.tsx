'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export interface ExpenseLine {
  description: string
  date: string
  amount: string
  paidByName?: string
}

export interface MemberBalanceDetail {
  displayName: string
  totalPaid: string
  totalShare: string
  net: string
  isPositive: boolean
  isZero: boolean
  expensesPaid: ExpenseLine[]
  expensesOwed: ExpenseLine[]
}

export default function MemberBalanceDialog({ detail }: { detail: MemberBalanceDetail }) {
  const [open, setOpen] = useState(false)
  const { displayName, totalPaid, totalShare, net, isPositive, isZero, expensesPaid, expensesOwed } = detail

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 rounded-none px-2 font-mono text-[10px]">
          View
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono">{displayName}&apos;s Balance</DialogTitle>
        </DialogHeader>

        <div className="mt-2 flex flex-col gap-4">

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-0.5 border border-border p-2">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Paid</span>
              <span className="font-mono text-sm font-semibold">{totalPaid}</span>
              <span className="font-mono text-[10px] text-muted-foreground">out-of-pocket</span>
            </div>
            <div className="flex flex-col gap-0.5 border border-border p-2">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Share</span>
              <span className="font-mono text-sm font-semibold">{totalShare}</span>
              <span className="font-mono text-[10px] text-muted-foreground">of all expenses</span>
            </div>
            <div className="flex flex-col gap-0.5 border border-border p-2">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Net</span>
              <span className={cn(
                'font-mono text-sm font-semibold',
                isZero ? 'text-muted-foreground' : isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              )}>
                {isPositive && !isZero ? '+' : ''}{net}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {isZero ? 'settled' : isPositive ? 'owed to them' : 'they owe'}
              </span>
            </div>
          </div>

          {/* Net equation */}
          <div className="flex flex-col gap-1 border border-border p-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Paid out-of-pocket</span>
              <span className="font-semibold">{totalPaid}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Minus share of expenses</span>
              <span className="font-semibold">− {totalShare}</span>
            </div>
            <Separator className="my-1" />
            <div className="flex items-center justify-between font-semibold">
              <span>Net balance</span>
              <span className={cn(
                isZero ? 'text-muted-foreground' : isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              )}>
                {isPositive && !isZero ? '+' : ''}{net}
              </span>
            </div>
            <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
              {isZero
                ? `${displayName} has paid exactly their share — nothing owed.`
                : isPositive
                ? `${displayName} paid more than their share → others owe them.`
                : `${displayName} paid less than their share → they owe others.`}
            </p>
          </div>

          <Separator />

          {/* What they paid */}
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Expenses {displayName} paid ({expensesPaid.length})
            </p>
            {expensesPaid.length === 0 ? (
              <p className="font-mono text-xs text-muted-foreground">{displayName} hasn&apos;t paid for any expenses.</p>
            ) : (
              <table className="w-full border-collapse font-mono text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-1 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Expense</th>
                    <th className="py-1 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                    <th className="py-1 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {expensesPaid.map((e, i) => (
                    <tr key={i} className="border-b border-border/40 last:border-0">
                      <td className="py-1.5 pr-2">{e.description}</td>
                      <td className="py-1.5 px-2 text-right text-muted-foreground">{e.date}</td>
                      <td className="py-1.5 pl-2 text-right font-semibold">{e.amount}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-border">
                    <td colSpan={2} className="py-1.5 pr-2 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Total paid
                    </td>
                    <td className="py-1.5 pl-2 text-right font-semibold">{totalPaid}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          <Separator />

          {/* Their share */}
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {displayName}&apos;s share of expenses ({expensesOwed.length})
            </p>
            {expensesOwed.length === 0 ? (
              <p className="font-mono text-xs text-muted-foreground">{displayName} isn&apos;t included in any expense splits.</p>
            ) : (
              <table className="w-full border-collapse font-mono text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-1 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Expense</th>
                    <th className="py-1 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Paid by</th>
                    <th className="py-1 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {expensesOwed.map((e, i) => (
                    <tr key={i} className="border-b border-border/40 last:border-0">
                      <td className="py-1.5 pr-2">{e.description}</td>
                      <td className="py-1.5 px-2 text-right text-muted-foreground">
                        {e.paidByName === displayName ? (
                          <span className="italic">themselves</span>
                        ) : e.paidByName}
                      </td>
                      <td className="py-1.5 pl-2 text-right font-semibold">{e.amount}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-border">
                    <td colSpan={2} className="py-1.5 pr-2 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Total share
                    </td>
                    <td className="py-1.5 pl-2 text-right font-semibold">{totalShare}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  )
}
