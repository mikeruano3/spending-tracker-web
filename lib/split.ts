import Decimal from 'decimal.js'

export function splitEqually(amount: Decimal, n: number): Decimal[] {
  if (n <= 0) throw new Error('Cannot split among 0 members')
  const base = amount.dividedBy(n).toDecimalPlaces(2, Decimal.ROUND_DOWN)
  const distributed = base.times(n)
  const extraCents = amount.minus(distributed).dividedBy(new Decimal('0.01')).toNumber()
  return Array.from({ length: n }, (_, i) =>
    i < extraCents ? base.plus(new Decimal('0.01')) : base
  )
}
