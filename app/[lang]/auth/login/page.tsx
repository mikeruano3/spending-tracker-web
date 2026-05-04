import { getDictionary, hasLocale } from '@/lib/i18n'
import { notFound } from 'next/navigation'
import LoginForm from './LoginForm'

export default async function LoginPage({ params }: PageProps<'/[lang]/auth/login'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const dict = await getDictionary(lang)
  return <LoginForm dict={dict.auth.login} lang={lang} />
}
