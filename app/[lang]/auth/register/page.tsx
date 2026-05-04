import { getDictionary, hasLocale } from '@/lib/i18n'
import { notFound } from 'next/navigation'
import RegisterForm from './RegisterForm'

export default async function RegisterPage({ params }: PageProps<'/[lang]/auth/register'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const dict = await getDictionary(lang)
  return <RegisterForm dict={dict.auth.register} lang={lang} />
}
