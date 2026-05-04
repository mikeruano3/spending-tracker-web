import Decimal from 'decimal.js'
import { unstable_cache } from 'next/cache'

export const SUPPORTED_CURRENCIES = ['USD', 'GTQ', 'EUR'] as const
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]

const fetchLiveRates = unstable_cache(
  async (base: string, symbols: string[]) => {
    const url = `https://api.frankfurter.dev/v1/latest?base=${base}&symbols=${symbols.join(',')}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Frankfurter API error: ${res.status}`)
    const json = await res.json() as { rates: Record<string, number> }
    return { [base]: 1, ...json.rates } as Record<string, number>
  },
  ['frankfurter-rates'],
  { revalidate: 3600 }
)

export async function getRates(
  base: string = 'USD',
  symbols: string[] = ['GTQ', 'EUR']
): Promise<Record<string, number>> {
  return fetchLiveRates(base, symbols)
}

export function convertAmount(
  amount: Decimal,
  from: string,
  to: string,
  rates: Record<string, number>
): Decimal {
  if (from === to) return amount
  const fromRate = rates[from] ?? 1
  const toRate = rates[to] ?? 1
  return amount.dividedBy(fromRate).times(toRate).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
}

export function applyUserOverrides(
  rates: Record<string, number>,
  overrides: { fromCurrency: string; toCurrency: string; rate: number; isFixed: boolean }[]
): Record<string, number> {
  const result = { ...rates }
  for (const o of overrides) {
    if (o.isFixed) {
      // Store as a direct pair key; convertAmount checks this before base-relative
      result[`${o.fromCurrency}_${o.toCurrency}`] = o.rate
    }
  }
  return result
}

export function formatMoney(amount: Decimal | number | string, currency: string): string {
  const num = new Decimal(amount).toNumber()
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}
