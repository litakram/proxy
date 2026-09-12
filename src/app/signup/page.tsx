'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { hasSupabaseEnv } from '@/lib/env'
import { AuthShell } from '@/components/AuthShell'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setNotice(null)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    if (error) {
      setLoading(false)
      setError(error.message)
      return
    }

    // With "Confirm email" enabled, signUp returns a user but no session — the
    // dashboard would bounce straight back to /login without a word.
    if (!data.session) {
      setLoading(false)
      setNotice('Check your inbox to confirm your email, then log in.')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  if (!hasSupabaseEnv) {
    return (
      <AuthShell title="Setup required" subtitle="Your backend is not connected yet.">
        <Link href="/setup" className="btn-primary w-full">
          Open setup checklist
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Create your agent" subtitle="Two minutes to a profile that works without you.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="name">
            Full name
          </label>
          <input
            id="name"
            className="field"
            placeholder="Akram Litnitia"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="field"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="field"
            type="password"
            autoComplete="new-password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        {notice && (
          <p className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-800">
            {notice}
          </p>
        )}

        <button disabled={loading} className="btn-primary w-full py-2.5">
          {loading ? 'Creating your agent…' : 'Create account'}
        </button>

        <p className="text-center text-sm text-ink-muted">
          Already have an account?{' '}
          <Link className="font-medium text-brand-700 underline underline-offset-2" href="/login">
            Log in
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
