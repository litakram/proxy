'use client'

import { useState } from 'react'
import { IconMail, IconCheck } from '@/components/ui/Icons'

/** For visitors without a Proxy account — the fallback path to being remembered. */
export function LeadForm({ handle, ownerName }: { handle: string; ownerName: string }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setState('sending')
    setError(null)

    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle, ...form }),
    })
    const data = await res.json()

    if (!res.ok) {
      setState('idle')
      setError(data.error ?? 'Could not send that.')
      return
    }

    setState('sent')
  }

  if (state === 'sent') {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-900">
          <IconCheck width={16} height={16} />
          Sent to {ownerName}
        </p>
        <p className="mt-1 text-sm text-emerald-800">They will find your details in their inbox.</p>
      </div>
    )
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary w-full">
        <IconMail width={15} height={15} />
        Leave your details for {ownerName.split(' ')[0]}
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="card space-y-3 p-4">
      <p className="section-title">Leave your details</p>
      <p className="hint">{ownerName.split(' ')[0]} will see this in their inbox.</p>

      <input
        className="field"
        placeholder="Your name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <input
        className="field"
        type="email"
        placeholder="Your email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        required
      />
      <textarea
        className="field"
        rows={3}
        placeholder="Why you would like to talk"
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
      />

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={state === 'sending'} className="btn-primary btn-sm">
          {state === 'sending' ? 'Sending…' : 'Send'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost btn-sm">
          Cancel
        </button>
      </div>
    </form>
  )
}
