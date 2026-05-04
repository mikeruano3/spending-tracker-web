'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function GroupNotFound() {
  const pathname = usePathname()
  const lang = pathname.split('/')[1] ?? 'en'

  return (
    <main className="flex flex-col items-center justify-center gap-4 p-8 pt-20 text-center">
      <p className="font-mono text-4xl font-bold">404</p>
      <p className="font-mono text-sm text-muted-foreground">
        Group not found or you don&apos;t have access to it.
      </p>
      <Button asChild variant="outline" className="rounded-none font-mono">
        <Link href={`/${lang}/groups`}>Back to groups</Link>
      </Button>
    </main>
  )
}
