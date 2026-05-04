import { getDictionary, hasLocale } from '@/lib/i18n'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getGroup, getGroupMembers } from '@/lib/db/groups'
import { getGroupExpenses } from '@/lib/db/expenses'
import { getGroupBalances, getGroupSettlements } from '@/lib/db/balances'
import { formatMoney } from '@/lib/currencies'
import Decimal from 'decimal.js'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import AddMemberForm from './AddMemberForm'
import SettleUpForm from './SettleUpForm'
import EditExpenseForm from './EditExpenseForm'
import EditGroupNameForm from './EditGroupNameForm'
import DebtExplainDialog from './DebtExplainDialog'
import DeleteConfirmDialog from './DeleteConfirmDialog'
import EditSettlementForm from './EditSettlementForm'
import { deleteExpenseAction, deleteSettlementAction, removeMemberAction } from './actions'
import type { MemberBreakdown, SimplifiedTransfer } from './DebtExplainDialog'

export default async function GroupDetailPage({ params }: PageProps<'/[lang]/groups/[groupId]'>) {
  const { lang, groupId } = await params
  if (!hasLocale(lang)) notFound()

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims) redirect(`/${lang}/auth/login`)

  const userId = claimsData.claims.sub
  const dict = await getDictionary(lang)

  const [group, members, expenses, { transfers, netBalances, memberPaid, memberOwed, memberNames }, settlements] = await Promise.all([
    getGroup(groupId),
    getGroupMembers(groupId),
    getGroupExpenses(groupId),
    getGroupBalances(groupId),
    getGroupSettlements(groupId),
  ])

  if (!group) notFound()

  const membersWithExpenses = new Set<string>()
  for (const expense of expenses) {
    membersWithExpenses.add(expense.paidBy)
    for (const split of expense.splits) {
      membersWithExpenses.add(split.userId)
    }
  }

  // Serialisable data for client components
  const memberBreakdown: MemberBreakdown[] = netBalances.map(nb => ({
    displayName: nb.displayName,
    paid: formatMoney(memberPaid[nb.userId] ?? new Decimal(0), group.currency),
    owed: formatMoney(memberOwed[nb.userId] ?? new Decimal(0), group.currency),
    net: formatMoney(nb.amount.abs(), group.currency),
    isPositive: nb.amount.gte(0),
  }))

  const transfersForDialog: SimplifiedTransfer[] = transfers.map(t => ({
    fromName: t.fromName,
    toName: t.toName,
    amount: formatMoney(t.amount, group.currency),
  }))

  // Aggregate settlements by (payer, payee) pair — use | separator (UUIDs contain hyphens)
  const paidByPair: Record<string, Decimal> = {}
  const pairMeta: Record<string, { payerId: string; payeeId: string }> = {}
  for (const s of settlements) {
    const key = `${s.payerId}|${s.payeeId}`
    paidByPair[key] = (paidByPair[key] ?? new Decimal(0)).plus(new Decimal(s.amount))
    pairMeta[key] = { payerId: s.payerId, payeeId: s.payeeId }
  }

  // Remaining balance per greedy pair
  const debtSummary = transfers.map(t => {
    const paid = paidByPair[`${t.from}|${t.to}`] ?? new Decimal(0)
    const remaining = t.amount.minus(paid)
    return { fromName: t.fromName, toName: t.toName, owed: t.amount, paid, remaining }
  })

  // Exceedings: per (payer → payee) pair, amount paid beyond what the greedy algorithm required
  const greedyPairKeys = new Set(transfers.map(t => `${t.from}|${t.to}`))
  const exceedingsByPair: { payerName: string; payeeName: string; amount: Decimal }[] = []

  // Overpayments on greedy pairs
  for (const t of transfers) {
    const key = `${t.from}|${t.to}`
    const paid = paidByPair[key] ?? new Decimal(0)
    const excess = paid.minus(t.amount)
    if (excess.gt(0)) {
      exceedingsByPair.push({ payerName: t.fromName, payeeName: t.toName, amount: excess })
    }
  }
  // Off-pair payments: settlements between pairs not in the greedy output
  for (const [key, amount] of Object.entries(paidByPair)) {
    if (!greedyPairKeys.has(key) && amount.gt(0)) {
      const { payerId, payeeId } = pairMeta[key]
      exceedingsByPair.push({
        payerName: memberNames[payerId] ?? 'Unknown',
        payeeName: memberNames[payeeId] ?? 'Unknown',
        amount,
      })
    }
  }

  const membersForForm = members.map(m => ({
    userId: m.userId,
    displayName: m.displayName,
    email: m.email,
  }))

  return (
    <main className="flex flex-col gap-6 p-4">
      {/* Floating add-expense button */}
      <Button asChild size="icon" className="fixed bottom-24 right-4 z-50 h-14 w-14 rounded-full font-mono shadow-lg text-lg">
        <Link href={`/${lang}/expenses/new?groupId=${group.id}`}>+</Link>
      </Button>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-mono text-2xl font-bold tracking-tight">{group.name}</h1>
          <EditGroupNameForm groupId={group.id} currentName={group.name} />
        </div>
        <Badge variant="secondary" className="mt-1 rounded-none font-mono">{group.currency}</Badge>
      </div>

      {/* Simplified debts */}
      <Card className="rounded-none border-border">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {dict.groups.detail.debts}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {/* Per-person breakdown: total spent + net balance */}
          {netBalances.length > 0 && (
            <div className="w-full overflow-x-auto">
              <table className="w-full font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-1.5 pr-4 text-left font-semibold uppercase tracking-wider text-muted-foreground text-[10px]">Member</th>
                    <th className="py-1.5 px-4 text-right font-semibold uppercase tracking-wider text-muted-foreground text-[10px]">Total Spent</th>
                    <th className="py-1.5 pl-4 text-right font-semibold uppercase tracking-wider text-muted-foreground text-[10px]">Net Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {netBalances.map(nb => (
                    <tr key={nb.userId} className="border-b border-border/40 last:border-0">
                      <td className="py-1.5 pr-4">{nb.displayName}</td>
                      <td className="py-1.5 px-4 text-right">
                        {formatMoney(memberPaid[nb.userId] ?? new Decimal(0), group.currency)}
                      </td>
                      <td className={cn(
                        'py-1.5 pl-4 text-right font-semibold',
                        nb.amount.gt(0)
                          ? 'text-green-600 dark:text-green-400'
                          : nb.amount.lt(0)
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-muted-foreground'
                      )}>
                        {nb.amount.gt(0) ? '+' : ''}{formatMoney(nb.amount, group.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Separator className="my-2" />
            </div>
          )}

          {/* Simplified transfers */}
          {transfers.length === 0 ? (
            <p className="font-mono text-sm text-muted-foreground">{dict.groups.detail.allSettled}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {transfers.map((t, i) => (
                <div key={i} className="flex items-center gap-2 font-mono text-sm">
                  <span className="font-semibold">{t.fromName}</span>
                  <span className="text-muted-foreground">{dict.groups.detail.owes}</span>
                  <span className="font-semibold">{t.toName}</span>
                  <span className="ml-auto text-red-600 dark:text-red-400">
                    {formatMoney(t.amount, group.currency)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Explain Debt button */}
          {netBalances.length > 0 && (
            <div className="pt-1">
              <DebtExplainDialog breakdown={memberBreakdown} transfers={transfersForDialog} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expenses list */}
      <div className="flex flex-col gap-3">
        <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {dict.groups.detail.expenses}
        </h2>
        {expenses.length === 0 ? (
          <p className="font-mono text-sm text-muted-foreground">{dict.groups.detail.noExpenses}</p>
        ) : (
          expenses.map(expense => (
            <Card key={expense.id} className="rounded-none border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <p className="font-mono text-sm font-semibold">{expense.description}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{dict.groups.detail.paidBy}</span>{' '}
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
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <p className="font-mono text-sm font-semibold">
                      {formatMoney(expense.amount, expense.currency)}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">{expense.expenseDate}</p>
                    <div className="flex gap-1">
                      <EditExpenseForm
                        expense={{
                          id: expense.id,
                          groupId: group.id,
                          description: expense.description,
                          amount: expense.amount,
                          currency: expense.currency,
                          splits: expense.splits,
                        }}
                        groupMembers={membersForForm}
                      />
                      <DeleteConfirmDialog
                        action={deleteExpenseAction}
                        hiddenFields={{ expenseId: expense.id, groupId: group.id }}
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

      <Separator className="my-2" />

      {/* Members list */}
      <div className="flex flex-col gap-3">
        <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Members ({members.length})
        </h2>
        <div className="flex flex-col gap-2">
          {members.map(m => (
            <div key={m.userId} className="flex items-center justify-between border border-border p-3">
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-sm font-semibold">{m.displayName}</span>
                <span className="font-mono text-xs text-muted-foreground">{m.email}</span>
              </div>
              {m.userId === userId ? (
                <span className="font-mono text-[10px] text-muted-foreground">you</span>
              ) : !membersWithExpenses.has(m.userId) && (
                <DeleteConfirmDialog
                  action={removeMemberAction}
                  hiddenFields={{ groupId: group.id, memberId: m.userId }}
                  label="Remove"
                  message={`Remove ${m.displayName} from this group?`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <Separator className="my-2" />

      {/* Add member */}
      <div className="flex flex-col gap-3">
        <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {dict.groups.detail.addMember}
        </h2>
        <AddMemberForm groupId={group.id} dict={dict.groups} />
      </div>

      <Separator className="my-2" />

      {/* Settle up */}
      {members.length > 1 && (
        <div className="flex flex-col gap-3">
          <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {dict.groups.detail.settleUp}
          </h2>
          <SettleUpForm
            groupId={group.id}
            currency={group.currency}
            members={members}
            currentUserId={userId}
            dict={dict.groups}
          />
        </div>
      )}

      <Separator className="my-2" />

      {/* Settlements history */}
      <div className="flex flex-col gap-3">
        <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Settlements ({settlements.length})
        </h2>

        {/* Remaining balance per debt pair */}
        {debtSummary.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Remaining to settle
            </p>
            {debtSummary.map((d, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 border border-border p-2 font-mono text-xs">
                <span>
                  <span className="font-semibold">{d.fromName}</span>
                  <span className="text-muted-foreground"> → </span>
                  <span className="font-semibold">{d.toName}</span>
                </span>
                <span className="text-muted-foreground">
                  Owed: <span className="text-foreground">{formatMoney(d.owed, group.currency)}</span>
                </span>
                <span className="text-muted-foreground">
                  Paid: <span className="text-foreground">{formatMoney(d.paid, group.currency)}</span>
                </span>
                <span className={
                  d.remaining.lte(0)
                    ? 'font-semibold text-green-600 dark:text-green-400'
                    : 'font-semibold text-red-600 dark:text-red-400'
                }>
                  {d.remaining.lte(0) ? 'Settled ✓' : `Left: ${formatMoney(d.remaining, group.currency)}`}
                </span>
              </div>
            ))}
          </div>
        )}

        {settlements.length === 0 ? (
          <p className="font-mono text-sm text-muted-foreground">No settlements recorded yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {settlements.map(s => (
              <Card key={s.id} className="rounded-none border-border">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex flex-col gap-0.5">
                    <p className="font-mono text-sm">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{s.payerName}</span>
                      <span className="text-muted-foreground"> paid </span>
                      <span className="font-semibold">{s.payeeName}</span>
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {new Date(s.settledAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm font-semibold text-green-600 dark:text-green-400">
                      {formatMoney(s.amount, s.currency)}
                    </p>
                    <EditSettlementForm
                      settlement={{ id: s.id, groupId: group.id, payeeId: s.payeeId, amount: s.amount, currency: s.currency }}
                      members={membersForForm}
                      currentUserId={userId}
                    />
                    <DeleteConfirmDialog
                      action={deleteSettlementAction}
                      hiddenFields={{ settlementId: s.id, groupId: group.id }}
                      message="Delete this settlement? Balances will revert as if the payment never happened."
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Exceedings: payments made beyond what the greedy pairs required */}
        {exceedingsByPair.length > 0 && (
          <>
            <Separator className="my-1" />
            <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Exceedings
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              Payments recorded beyond what the expense balances required.
            </p>
            <table className="w-full border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-border">
                  {['From', 'To', 'Exceeding'].map(h => (
                    <th key={h} className="py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground first:text-left last:text-right [&:not(:first-child):not(:last-child)]:text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {exceedingsByPair.map((r, i) => (
                  <tr key={i} className="border-b border-border/40 last:border-0">
                    <td className="py-1.5 pr-2 font-semibold">{r.payerName}</td>
                    <td className="py-1.5 px-2">{r.payeeName}</td>
                    <td className="py-1.5 pl-2 text-right font-semibold text-amber-600 dark:text-amber-400">
                      {formatMoney(r.amount, group.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </main>
  )
}
