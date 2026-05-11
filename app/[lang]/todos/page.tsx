import { getDictionary, hasLocale } from '@/lib/i18n'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserTodos } from '@/lib/db/todos'
import TodosView from './TodosView'

export default async function TodosPage(props: PageProps<'/[lang]/todos'>) {
  const { lang } = await props.params
  if (!hasLocale(lang)) notFound()

  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  if (!claims?.claims) redirect(`/${lang}/auth/login`)

  const dict = await getDictionary(lang)
  const sp = (await props.searchParams) ?? {}
  const filterRaw = typeof sp.filter === 'string' ? sp.filter : undefined
  const filter: 'active' | 'done' = filterRaw === 'done' ? 'done' : 'active'

  const todos = await getUserTodos()

  return <TodosView lang={lang} dict={dict.todos} todos={todos} filter={filter} />
}
