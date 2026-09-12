'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { hasSupabaseEnv } from '@/lib/env'
import { AuthShell } from '@/components/AuthShell'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (error) {
      setError(error.message)
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
    <AuthShell title="Welcome back" subtitle="Log in to your agent.">
      <form onSubmit={handleSubmit} className="space-y-4">
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
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <button disabled={loading} className="btn-primary w-full py-2.5">
          {loading ? 'Logging in…' : 'Log in'}
        </button>

        <p className="text-center text-sm text-ink-muted">
          No account yet?{' '}
          <Link className="font-medium text-brand-700 underline underline-offset-2" href="/signup">
            Create your agent
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
