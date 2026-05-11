import Decimal from 'decimal.js'

export function formatMoney(amount: Decimal | number | string, currency: string): string {
  const num = new Decimal(amount).toNumber()
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}
