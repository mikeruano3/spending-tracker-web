import { getDictionary, hasLocale } from '@/lib/i18n'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CreateGroupForm from './CreateGroupForm'

export default async function NewGroupPage({ params }: PageProps<'/[lang]/groups/new'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims) redirect(`/${lang}/auth/login`)

  const dict = await getDictionary(lang)
  return <CreateGroupForm dict={dict.groups} lang={lang} />
}
