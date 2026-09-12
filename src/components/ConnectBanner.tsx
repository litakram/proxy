'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { IconSpark, IconCheck, IconUsers, IconArrow } from '@/components/ui/Icons'

type State = 'loading' | 'ready' | 'connecting' | 'connected' | 'already' | 'hidden'

export function ConnectBanner({ ownerHandle, ownerName }: { ownerHandle: string; ownerName: string }) {
  const [state, setState] = useState<State>('loading')
  const [ownerId, setOwnerId] = useState<string | null>(null)
  const [sharedPoints, setSharedPoints] = useState<string[]>([])
  const [reason, setReason] = useState('')

  useEffect(() => {
    let cancelled = false

    fetch('/api/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerHandle }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return

        // Self-view, an error, or a logged-out visitor: show nothing.
        if (data.isSelf || data.error) return setState('hidden')

        setOwnerId(data.ownerId)
        setSharedPoints(data.sharedPoints ?? [])
        setReason(data.reason ?? '')
        setState(data.alreadyConnected ? 'already' : 'ready')
      })
      .catch(() => !cancelled && setState('hidden'))

    return () => {
      cancelled = true
    }
  }, [ownerHandle])

  async function connect() {
    if (!ownerId) return
    setState('connecting')

    const res = await fetch('/api/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerId, sharedPoints }),
    })

    setState(res.ok ? 'connected' : 'ready')
  }

  if (state === 'hidden') return null

  if (state === 'loading') {
    return (
      <div className="card flex items-center gap-2.5 p-4">
        <span className="h-2 w-2 animate-blink rounded-full bg-brand-500" />
        <p className="text-sm text-ink-muted">Your agents are comparing notes…</p>
      </div>
    )
  }

  if (state === 'connected' || state === 'already') {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-900">
          <IconCheck width={16} height={16} />
          {state === 'connected' ? 'Connected' : 'Already connected'}
        </p>
        <p className="mt-1 text-sm text-emerald-800">
          You and {ownerName} can now see each other&apos;s contact details and message through Proxy.
        </p>
        <Link href="/dashboard/network" className="btn-secondary btn-sm mt-3">
          <IconUsers width={14} height={14} />
          Open your network
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-brand-200 bg-brand-50 p-4">
      <p className="flex items-center gap-2 text-sm font-medium text-brand-900">
        <IconSpark width={16} height={16} />
        {sharedPoints.length > 0 ? 'You have something in common' : 'Connect with ' + ownerName}
      </p>

      {sharedPoints.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {sharedPoints.map((p, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-brand-800">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-500" />
              {p}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1.5 text-sm text-brand-800">{reason}</p>
      )}

      <button onClick={connect} disabled={state === 'connecting'} className="btn-primary btn-sm mt-3">
        {state === 'connecting' ? 'Connecting…' : 'Connect'}
        {state !== 'connecting' && <IconArrow width={14} height={14} />}
      </button>

      <p className="mt-2 text-xs text-brand-700/80">
        Connecting swaps contact details both ways.
      </p>
    </div>
  )
}
