import Decimal from 'decimal.js'

export interface NetBalance {
  userId: string
  displayName: string
  amount: Decimal  // positive = creditor (owed), negative = debtor (owes)
}

export interface Transfer {
  from: string
  fromName: string
  to: string
  toName: string
  amount: Decimal
}

export function simplifyDebts(balances: NetBalance[]): Transfer[] {
  const credits = balances
    .filter(b => b.amount.gt(0))
    .map(b => ({ ...b, amount: new Decimal(b.amount) }))
  const debts = balances
    .filter(b => b.amount.lt(0))
    .map(b => ({ ...b, amount: new Decimal(b.amount) }))

  credits.sort((a, b) => b.amount.cmp(a.amount))
  debts.sort((a, b) => a.amount.cmp(b.amount))

  const transfers: Transfer[] = []
  let i = 0, j = 0

  while (i < debts.length && j < credits.length) {
    const pay = Decimal.min(debts[i].amount.abs(), credits[j].amount)
    transfers.push({
      from: debts[i].userId,
      fromName: debts[i].displayName,
      to: credits[j].userId,
      toName: credits[j].displayName,
      amount: pay,
    })
    debts[i].amount = debts[i].amount.plus(pay)
    credits[j].amount = credits[j].amount.minus(pay)
    if (debts[i].amount.eq(0)) i++
    if (credits[j].amount.eq(0)) j++
  }

  return transfers
}
