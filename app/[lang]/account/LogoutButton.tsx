'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function LogoutButton({ lang, label }: { lang: string; label: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(`/${lang}/auth/login`)
    router.refresh()
  }

  return (
    <Button
      variant="destructive"
      className="w-full rounded-none font-mono"
      disabled={loading}
      onClick={handleLogout}
    >
      {loading ? '...' : label}
    </Button>
  )
}
