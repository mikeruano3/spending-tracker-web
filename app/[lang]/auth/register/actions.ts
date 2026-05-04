'use server'

import { createClient } from '@/lib/supabase/server'

type RegisterState = {
  error?: string
  success?: boolean
}

export async function registerAction(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({ email, password })

  if (error) {
    return { error: error.message }
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'onboarding@resend.dev',
      to: 'miguelruano35@gmail.com',
      subject: 'Welcome — confirm your account',
      html: `
        <p>Hey,</p>
        <p>Thanks for signing up. Check your inbox for a confirmation link to activate your account.</p>
        <p>— The team</p>
      `,
    }),
  })

  if (!res.ok) {
    // Registration succeeded — don't block the user if the welcome email fails
    console.error('Resend error:', await res.text())
  }

  return { success: true }
}
