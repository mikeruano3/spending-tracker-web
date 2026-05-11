'use client'

import { useState } from 'react'
import Decimal from 'decimal.js'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { formatMoney } from '@/lib/format'

export interface DirectDebtExpense {
  description: string
  date: string
  paidBy: string
  splits: { userId: string; amount: string }[]
  currency: string
}

export interface DirectDebtMember {
  userId: string
  displayName: string
}

export default function DirectDebtDialog({
  members,
  expenses,
  groupCurrency,
}: {
  members: DirectDebtMember[]
  expenses: DirectDebtExpense[]
  groupCurrency: string
}) {
  const [open, setOpen] = useState(false)
  const [personAId, setPersonAId] = useState('')
  const [personBId, setPersonBId] = useState('')

  const personA = members.find(m => m.userId === personAId)
  const personB = members.find(m => m.userId === personBId)
  const same = personAId && personBId && personAId === personBId

  const aPaidForB = personA && personB && !same
    ? expenses
        .filter(e => e.paidBy === personAId && e.splits.some(s => s.userId === personBId))
        .map(e => ({
          description: e.description,
          date: e.date,
          share: new Decimal(e.splits.find(s => s.userId === personBId)!.amount),
          currency: e.currency,
        }))
    : []

  const bPaidForA = personA && personB && !same
    ? expenses
        .filter(e => e.paidBy === personBId && e.splits.some(s => s.userId === personAId))
        .map(e => ({
          description: e.description,
          date: e.date,
          share: new Decimal(e.splits.find(s => s.userId === personAId)!.amount),
          currency: e.currency,
        }))
    : []

  const totalA = aPaidForB.reduce((sum, e) => sum.plus(e.share), new Decimal(0))
  const totalB = bPaidForA.reduce((sum, e) => sum.plus(e.share), new Decimal(0))
  const net = totalA.minus(totalB)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-none font-mono text-xs">
          Direct Debt
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-mono">Direct Debt</DialogTitle>
        </DialogHeader>

        <div className="mt-2 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">

          {/* Person selectors */}
          <div className="flex items-center gap-2">
            <Select value={personAId} onValueChange={setPersonAId}>
              <SelectTrigger className="flex-1 rounded-none font-mono text-xs">
                <SelectValue placeholder="Person A" />
              </SelectTrigger>
              <SelectContent>
                {members.map(m => (
                  <SelectItem key={m.userId} value={m.userId} className="font-mono text-xs">
                    {m.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="shrink-0 font-mono text-xs text-muted-foreground">vs</span>
            <Select value={personBId} onValueChange={setPersonBId}>
              <SelectTrigger className="flex-1 rounded-none font-mono text-xs">
                <SelectValue placeholder="Person B" />
              </SelectTrigger>
              <SelectContent>
                {members.map(m => (
                  <SelectItem key={m.userId} value={m.userId} className="font-mono text-xs">
                    {m.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {same && (
            <p className="font-mono text-xs text-muted-foreground">Select two different people.</p>
          )}

          {personA && personB && !same && (
            <>
              {/* A paid for B */}
              <div className="flex flex-col gap-2">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {personA.displayName} paid for {personB.displayName} ({aPaidForB.length})
                </p>
                {aPaidForB.length === 0 ? (
                  <p className="font-mono text-xs text-muted-foreground">No shared expenses.</p>
                ) : (
                  <table className="w-full border-collapse font-mono text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="py-1 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Expense</th>
                        <th className="py-1 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                        <th className="py-1 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{personB.displayName}&apos;s share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aPaidForB.map((e, i) => (
                        <tr key={i} className="border-b border-border/40 last:border-0">
                          <td className="py-1.5 pr-2">{e.description}</td>
                          <td className="py-1.5 px-2 text-right text-muted-foreground">{e.date}</td>
                          <td className="py-1.5 pl-2 text-right font-semibold">{formatMoney(e.share, e.currency)}</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-border">
                        <td colSpan={2} className="py-1.5 pr-2 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Total
                        </td>
                        <td className="py-1.5 pl-2 text-right font-semibold">{formatMoney(totalA, groupCurrency)}</td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>

              <Separator />

              {/* B paid for A */}
              <div className="flex flex-col gap-2">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {personB.displayName} paid for {personA.displayName} ({bPaidForA.length})
                </p>
                {bPaidForA.length === 0 ? (
                  <p className="font-mono text-xs text-muted-foreground">No shared expenses.</p>
                ) : (
                  <table className="w-full border-collapse font-mono text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="py-1 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Expense</th>
                        <th className="py-1 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                        <th className="py-1 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{personA.displayName}&apos;s share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bPaidForA.map((e, i) => (
                        <tr key={i} className="border-b border-border/40 last:border-0">
                          <td className="py-1.5 pr-2">{e.description}</td>
                          <td className="py-1.5 px-2 text-right text-muted-foreground">{e.date}</td>
                          <td className="py-1.5 pl-2 text-right font-semibold">{formatMoney(e.share, e.currency)}</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-border">
                        <td colSpan={2} className="py-1.5 pr-2 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Total
                        </td>
                        <td className="py-1.5 pl-2 text-right font-semibold">{formatMoney(totalB, groupCurrency)}</td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>

              <Separator />

              {/* Net result */}
              <div className="flex flex-col gap-1 border border-border p-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{personA.displayName} paid for {personB.displayName}</span>
                  <span className="font-semibold">{formatMoney(totalA, groupCurrency)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{personB.displayName} paid for {personA.displayName}</span>
                  <span className="font-semibold">− {formatMoney(totalB, groupCurrency)}</span>
                </div>
                <Separator className="my-1" />
                <div className="flex items-center justify-between font-semibold">
                  <span>Net</span>
                  <span className={cn(
                    net.eq(0)
                      ? 'text-muted-foreground'
                      : net.gt(0)
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-green-600 dark:text-green-400'
                  )}>
                    {net.eq(0) ? 'Settled' : formatMoney(net.abs(), groupCurrency)}
                  </span>
                </div>
                {!net.eq(0) && (
                  <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                    {net.gt(0)
                      ? `${personB.displayName} owes ${personA.displayName} ${formatMoney(net.abs(), groupCurrency)}`
                      : `${personA.displayName} owes ${personB.displayName} ${formatMoney(net.abs(), groupCurrency)}`}
                  </p>
                )}
              </div>
            </>
          )}

        </div>
      </DialogContent>
    </Dialog>
  )
}
