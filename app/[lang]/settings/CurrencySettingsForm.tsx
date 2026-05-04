'use client'

import { useActionState, useState } from 'react'
import {
  upsertCurrencySettingAction,
  deleteCurrencySettingAction,
  updatePreferredCurrencyAction,
} from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { SUPPORTED_CURRENCIES } from '@/lib/currencies'
import type en from '@/dictionaries/en.json'

type SettingsDict = typeof en['settings']

interface CurrencySetting {
  id: string
  fromCurrency: string
  toCurrency: string
  rate: number
  isFixed: boolean
}

export default function CurrencySettingsForm({
  settings,
  preferredCurrency,
  liveRates,
  dict,
}: {
  settings: CurrencySetting[]
  preferredCurrency: string
  liveRates: Record<string, number>
  dict: SettingsDict
}) {
  const [upsertState, upsertAction, upsertPending] = useActionState(upsertCurrencySettingAction, {})
  const [deleteState, deleteAction] = useActionState(deleteCurrencySettingAction, {})
  const [prefState, prefAction, prefPending] = useActionState(updatePreferredCurrencyAction, {})
  const [showAddForm, setShowAddForm] = useState(false)
  const [isFixed, setIsFixed] = useState(false)

  const allCurrencies = Array.from(new Set([
    ...SUPPORTED_CURRENCIES,
    ...settings.map(s => s.fromCurrency),
    ...settings.map(s => s.toCurrency),
  ]))

  return (
    <div className="flex flex-col gap-6">
      {/* Preferred currency */}
      <div className="flex flex-col gap-3">
        <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {dict.preferredCurrency}
        </h2>
        <form action={prefAction} className="flex items-end gap-2">
          <div className="flex flex-col gap-1.5">
            <Select name="currency" defaultValue={preferredCurrency}>
              <SelectTrigger className="w-28 rounded-none font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none font-mono">
                {allCurrencies.map(c => (
                  <SelectItem key={c} value={c} className="font-mono">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={prefPending} variant="outline" size="sm" className="rounded-none font-mono">
            {prefPending ? dict.currencies.saving : dict.currencies.save}
          </Button>
        </form>
        {prefState.success && <p className="font-mono text-xs text-green-600">✓ Saved</p>}
      </div>

      <Separator />

      {/* Exchange rates */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {dict.currencies.title}
          </h2>
          <Button
            variant="outline"
            size="sm"
            className="rounded-none font-mono"
            onClick={() => setShowAddForm(v => !v)}
          >
            {dict.currencies.addPair}
          </Button>
        </div>

        <p className="font-mono text-xs text-muted-foreground">{dict.currencies.subtitle}</p>

        {/* Add rate form */}
        {showAddForm && (
          <Card className="rounded-none border-dashed">
            <CardContent className="p-4">
              <form action={upsertAction} className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <Label className="font-mono text-xs">{dict.currencies.from}</Label>
                    <Select name="fromCurrency" defaultValue="USD">
                      <SelectTrigger className="rounded-none font-mono">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none font-mono">
                        {allCurrencies.map(c => (
                          <SelectItem key={c} value={c} className="font-mono">{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="font-mono text-xs">{dict.currencies.to}</Label>
                    <Select name="toCurrency" defaultValue="GTQ">
                      <SelectTrigger className="rounded-none font-mono">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none font-mono">
                        {allCurrencies.map(c => (
                          <SelectItem key={c} value={c} className="font-mono">{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <Label className="font-mono text-xs">{dict.currencies.rate}</Label>
                  <Input
                    name="rate"
                    type="number"
                    step="0.000001"
                    min="0.000001"
                    placeholder="7.800000"
                    required
                    className="rounded-none font-mono"
                  />
                </div>

                <label className="flex cursor-pointer items-center gap-2 font-mono text-sm">
                  <input
                    type="checkbox"
                    name="isFixed"
                    value="true"
                    checked={isFixed}
                    onChange={e => setIsFixed(e.target.checked)}
                    className="h-4 w-4"
                  />
                  {dict.currencies.fixedLabel}
                </label>
                {/* Hidden field so unchecked sends "false" */}
                {!isFixed && <input type="hidden" name="isFixed" value="false" />}

                {upsertState.error && (
                  <p className="font-mono text-xs text-destructive">{upsertState.error}</p>
                )}
                {upsertState.success && (
                  <p className="font-mono text-xs text-green-600">✓ Saved</p>
                )}

                <Button type="submit" disabled={upsertPending} size="sm" className="rounded-none font-mono">
                  {upsertPending ? dict.currencies.saving : dict.currencies.save}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Existing rate pairs */}
        {settings.length === 0 ? (
          <p className="font-mono text-sm text-muted-foreground">{dict.currencies.noneConfigured}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {settings.map(setting => {
              const liveRate = liveRates[setting.toCurrency]
              return (
                <Card key={setting.id} className="rounded-none border-border">
                  <CardContent className="flex items-center justify-between p-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-sm font-semibold">
                        {setting.fromCurrency} → {setting.toCurrency}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          {setting.isFixed ? dict.currencies.fixedRate : dict.currencies.liveRate}:{' '}
                          {setting.isFixed ? setting.rate.toFixed(6) : (liveRate?.toFixed(6) ?? '—')}
                        </span>
                        <Badge
                          variant={setting.isFixed ? 'default' : 'secondary'}
                          className="rounded-none font-mono text-xs"
                        >
                          {setting.isFixed ? dict.currencies.fixedRate : dict.currencies.liveRate}
                        </Badge>
                      </div>
                    </div>
                    <form action={deleteAction}>
                      <input type="hidden" name="id" value={setting.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="rounded-none font-mono text-destructive hover:text-destructive"
                      >
                        {dict.currencies.remove}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
        {deleteState.error && (
          <p className="font-mono text-xs text-destructive">{deleteState.error}</p>
        )}
      </div>
    </div>
  )
}
