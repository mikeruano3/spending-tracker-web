'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { SUPPORTED_CURRENCIES } from '@/lib/currencies'
import Decimal from 'decimal.js'

export default function CurrencyConverterDialog({
  onUse,
  defaultFrom = 'USD',
  defaultTo = 'USD',
}: {
  onUse: (amount: string) => void
  defaultFrom?: string
  defaultTo?: string
}) {
  const [open, setOpen] = useState(false)
  const [fromCurrency, setFromCurrency] = useState(defaultFrom)
  const [toCurrency, setToCurrency] = useState(defaultTo)
  const [inputAmount, setInputAmount] = useState('')
  const [exchangeRate, setExchangeRate] = useState('')
  const [rateDate, setRateDate] = useState<string | null>(null)
  const [rateSource, setRateSource] = useState<'live' | 'frankfurter' | 'fallback' | null>(null)
  const [rateLoading, setRateLoading] = useState(false)
  const [isCustomRate, setIsCustomRate] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    async function load() {
      if (fromCurrency === toCurrency) {
        if (!cancelled) {
          setExchangeRate('1')
          setRateDate(null)
          setRateSource(null)
          setIsCustomRate(false)
        }
        return
      }
      if (!cancelled) setRateLoading(true)
      try {
        const res = await fetch(
          `https://latest.currency-api.pages.dev/v1/currencies/${fromCurrency.toLowerCase()}.json`
        )
        if (!res.ok) throw new Error('fetch failed')
        const data = await res.json()
        const rate = data[fromCurrency.toLowerCase()]?.[toCurrency.toLowerCase()]
        if (!rate) throw new Error('rate missing')
        if (!cancelled) {
          setExchangeRate(String(rate))
          setRateDate(data.date ?? null)
          setRateSource('live')
          setIsCustomRate(false)
        }
      } catch {
        if (!cancelled) {
          setExchangeRate('')
          setRateDate(null)
          setRateSource(null)
        }
      } finally {
        if (!cancelled) setRateLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [open, fromCurrency, toCurrency])

  function handleFromChange(value: string) {
    setFromCurrency(value)
    setIsCustomRate(false)
    setRateSource(null)
  }

  function handleToChange(value: string) {
    setToCurrency(value)
    setIsCustomRate(false)
    setRateSource(null)
  }

  function handleRateChange(value: string) {
    setExchangeRate(value)
    setIsCustomRate(true)
    setRateDate(null)
    setRateSource(null)
  }

  let result = ''
  try {
    const amt = new Decimal(inputAmount)
    const rate = new Decimal(exchangeRate)
    if (amt.gt(0) && rate.gt(0)) {
      result = amt.times(rate).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2)
    }
  } catch {
    // invalid input — leave result empty
  }

  function handleUse() {
    if (result) {
      onUse(result)
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="font-mono text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
        >
          Currency Converter
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-mono">Currency Converter</DialogTitle>
        </DialogHeader>

        <div className="mt-2 flex flex-col gap-4">

          {/* Amount to convert */}
          <div className="flex flex-col gap-1.5">
            <Label className="font-mono text-xs font-medium">Amount</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={inputAmount}
              onChange={e => setInputAmount(e.target.value)}
              className="rounded-none font-mono"
              autoFocus
            />
          </div>

          {/* From → To */}
          <div className="flex items-end gap-2">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label className="font-mono text-xs font-medium">From</Label>
              <Select value={fromCurrency} onValueChange={handleFromChange}>
                <SelectTrigger className="rounded-none font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none font-mono">
                  {SUPPORTED_CURRENCIES.map(c => (
                    <SelectItem key={c} value={c} className="font-mono">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <span className="mb-2.5 font-mono text-sm text-muted-foreground">→</span>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label className="font-mono text-xs font-medium">To</Label>
              <Select value={toCurrency} onValueChange={handleToChange}>
                <SelectTrigger className="rounded-none font-mono">
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

          {/* Exchange rate */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label className="font-mono text-xs font-medium">Exchange Rate</Label>
              {rateLoading && (
                <span className="font-mono text-[10px] text-muted-foreground">Fetching…</span>
              )}
              {!rateLoading && rateDate && !isCustomRate && (
                <span className="font-mono text-[10px] text-muted-foreground">
                  {rateSource === 'fallback' ? 'Live (alt) · ' : 'Live · '}{rateDate}
                </span>
              )}
              {!rateLoading && isCustomRate && (
                <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400">
                  Custom rate
                </span>
              )}
            </div>
            <Input
              type="number"
              step="any"
              min="0"
              placeholder={rateLoading ? 'Fetching…' : 'e.g. 1.08'}
              value={exchangeRate}
              onChange={e => handleRateChange(e.target.value)}
              disabled={rateLoading}
              className="rounded-none font-mono"
            />
          </div>

          {/* Result */}
          {result ? (
            <div className="flex items-center justify-between border border-border p-3 font-mono">
              <span className="text-xs text-muted-foreground">
                {inputAmount} {fromCurrency} =
              </span>
              <span className="text-lg font-semibold">
                {result} <span className="text-sm text-muted-foreground">{toCurrency}</span>
              </span>
            </div>
          ) : (
            <div className="border border-dashed border-border p-3 font-mono text-xs text-muted-foreground">
              Enter an amount above to see the result.
            </div>
          )}

          <Button
            type="button"
            onClick={handleUse}
            disabled={!result}
            className="rounded-none font-mono"
          >
            {result ? `Use ${result} ${toCurrency}` : 'Use amount'}
          </Button>

        </div>
      </DialogContent>
    </Dialog>
  )
}
