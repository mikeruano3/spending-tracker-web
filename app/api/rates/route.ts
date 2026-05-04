import { NextResponse } from 'next/server'
import { getRates } from '@/lib/currencies'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const base = searchParams.get('base') ?? 'USD'
  const symbols = (searchParams.get('symbols') ?? 'GTQ,EUR').split(',').filter(Boolean)

  try {
    const rates = await getRates(base, symbols)
    return NextResponse.json({ rates }, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch rates' }, { status: 502 })
  }
}
