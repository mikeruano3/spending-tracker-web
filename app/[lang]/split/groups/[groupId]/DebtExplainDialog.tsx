'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export interface MemberBreakdown {
  displayName: string
  paid: string
  owed: string
  net: string
  isPositive: boolean
}

export interface SimplifiedTransfer {
  fromName: string
  toName: string
  amount: string
}

export default function DebtExplainDialog({
  breakdown,
  transfers,
}: {
  breakdown: MemberBreakdown[]
  transfers: SimplifiedTransfer[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-none font-mono text-xs">
          Explain Debt
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-mono">How debts were calculated</DialogTitle>
        </DialogHeader>

        <div className="mt-2 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">

          {/* Step 1 — expense balances */}
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Step 1 — Expense balances
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              For each person: what they paid out-of-pocket minus their share of all expenses.
            </p>
            <table className="w-full border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-border">
                  {['Member', 'Paid', 'Share', 'Net'].map(h => (
                    <th key={h} className="py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground first:text-left last:text-right [&:not(:first-child)]:text-right">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {breakdown.map(b => (
                  <tr key={b.displayName} className="border-b border-border/40 last:border-0">
                    <td className="py-1.5 pr-2">{b.displayName}</td>
                    <td className="py-1.5 px-2 text-right">{b.paid}</td>
                    <td className="py-1.5 px-2 text-right">{b.owed}</td>
                    <td className={cn(
                      'py-1.5 pl-2 text-right font-semibold',
                      b.isPositive
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    )}>
                      {b.isPositive ? '+' : ''}{b.net}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Separator />

          {/* Step 2 — greedy algorithm */}
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Step 2 — Simplified transfers
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              Greedily match the largest debtor with the largest creditor to minimise the number of payments.
            </p>
            {transfers.length === 0 ? (
              <p className="font-mono text-xs text-muted-foreground">
                All balances are zero — no transfers needed.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {transfers.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 border border-border p-2 font-mono text-xs">
                    <span className="font-semibold">{t.fromName}</span>
                    <span className="text-muted-foreground">pays</span>
                    <span className="font-semibold">{t.toName}</span>
                    <span className="ml-auto font-semibold">{t.amount}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  )
}
