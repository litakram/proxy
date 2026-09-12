'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { EmptyState } from '@/components/ui/PageHeader'
import {
  IconUsers,
  IconMail,
  IconPhone,
  IconLink,
  IconSend,
  IconPlus,
  IconTrash,
  IconInbox,
  IconSpark,
} from '@/components/ui/Icons'

export type Connection = {
  connectionId: string
  contactId: string
  handle: string
  fullName: string
  headline: string
  sharedPoints: string[]
  email?: string
  phone?: string
  linkedin?: string
  website?: string
  connectedAt: string
}

export type ManualContact = {
  id: string
  full_name: string
  role: string | null
  email: string | null
  phone: string | null
  link: string | null
  note: string | null
}

export type InboxMessage = {
  id: string
  content: string
  created_at: string
  fromName: string
}

export type Lead = {
  id: string
  name: string | null
  email: string | null
  message: string | null
  created_at: string
}

type Tab = 'connections' | 'saved' | 'inbox'

function initials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '?'
  )
}

function ContactLine({ icon, value, href }: { icon: React.ReactNode; value: string; href?: string }) {
  const content = (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted transition hover:text-brand-700">
      {icon}
      {value}
    </span>
  )
  return href ? (
    <a href={href} target="_blank" rel="noreferrer">
      {content}
    </a>
  ) : (
    content
  )
}

/* ------------------------------------------------------------------ */

function ConnectionCard({ c }: { c: Connection }) {
  const [draft, setDraft] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function send() {
    const content = draft.trim()
    if (!content) return
    setState('sending')

    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionId: c.connectionId, toUser: c.contactId, content }),
    })

    if (!res.ok) {
      setState('error')
      return
    }

    setDraft('')
    setState('sent')
    setTimeout(() => setState('idle'), 2200)
  }

  const hasContact = c.email || c.phone || c.linkedin || c.website

  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
          {initials(c.fullName || c.handle)}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{c.fullName || c.handle}</p>
          {c.headline && <p className="truncate text-xs text-ink-muted">{c.headline}</p>}

          {hasContact ? (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {c.email && (
                <ContactLine icon={<IconMail width={13} height={13} />} value={c.email} href={`mailto:${c.email}`} />
              )}
              {c.phone && (
                <ContactLine icon={<IconPhone width={13} height={13} />} value={c.phone} href={`tel:${c.phone}`} />
              )}
              {c.linkedin && (
                <ContactLine icon={<IconLink width={13} height={13} />} value="LinkedIn" href={c.linkedin} />
              )}
              {c.website && (
                <ContactLine icon={<IconLink width={13} height={13} />} value="Website" href={c.website} />
              )}
            </div>
          ) : (
            <p className="mt-2 text-xs text-ink-faint">
              They have not added contact details yet.
            </p>
          )}
        </div>
      </div>

      {c.sharedPoints.length > 0 && (
        <div className="mt-3 rounded-lg bg-brand-50 px-3 py-2">
          <p className="flex items-center gap-1.5 text-xs font-medium text-brand-800">
            <IconSpark width={12} height={12} />
            Why you matched
          </p>
          <ul className="mt-1 space-y-0.5">
            {c.sharedPoints.map((p, i) => (
              <li key={i} className="text-xs text-brand-800">
                · {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <input
          className="field text-xs"
          placeholder={`Message ${(c.fullName || c.handle).split(' ')[0]}…`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button onClick={send} disabled={!draft.trim() || state === 'sending'} className="btn-secondary btn-sm shrink-0">
          {state === 'sent' ? 'Sent' : state === 'sending' ? '…' : <IconSend width={14} height={14} />}
        </button>
      </div>

      {state === 'error' && <p className="mt-1.5 text-xs text-red-600">Could not send — try again.</p>}
    </div>
  )
}

/* ------------------------------------------------------------------ */

function AddContactForm({ onAdded }: { onAdded: (c: ManualContact) => void }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ fullName: '', role: '', email: '', phone: '', link: '', note: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function submit() {
    if (!form.fullName.trim()) return
    setSaving(true)
    setError(null)

    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setError(data.error ?? 'Could not save this contact.')
      return
    }

    onAdded(data.contact)
    setForm({ fullName: '', role: '', email: '', phone: '', link: '', note: '' })
    setOpen(false)
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary btn-sm">
        <IconPlus width={14} height={14} />
        Add a contact
      </button>
    )
  }

  return (
    <div className="card space-y-3 p-4">
      <p className="section-title">Add someone you met</p>
      <p className="hint">For people who are not on Proxy yet.</p>

      <div className="grid gap-2 sm:grid-cols-2">
        <input className="field" placeholder="Full name *" value={form.fullName} onChange={set('fullName')} />
        <input className="field" placeholder="Role / company" value={form.role} onChange={set('role')} />
        <input className="field" placeholder="Email" value={form.email} onChange={set('email')} />
        <input className="field" placeholder="Phone" value={form.phone} onChange={set('phone')} />
      </div>

      <input className="field" placeholder="LinkedIn or website" value={form.link} onChange={set('link')} />
      <textarea
        className="field"
        rows={2}
        placeholder="Where did you meet? What did you talk about?"
        value={form.note}
        onChange={set('note')}
      />

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button onClick={submit} disabled={saving || !form.fullName.trim()} className="btn-primary btn-sm">
          {saving ? 'Saving…' : 'Save contact'}
        </button>
        <button onClick={() => setOpen(false)} className="btn-ghost btn-sm">
          Cancel
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

export function NetworkView({
  connections,
  manualContacts,
  inbox,
  leads,
}: {
  connections: Connection[]
  manualContacts: ManualContact[]
  inbox: InboxMessage[]
  leads: Lead[]
}) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('connections')
  const [saved, setSaved] = useState(manualContacts)

  async function removeSaved(id: string) {
    const previous = saved
    setSaved((s) => s.filter((c) => c.id !== id))

    const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' })
    if (!res.ok) setSaved(previous)
    else router.refresh()
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'connections', label: 'Connections', count: connections.length },
    { id: 'saved', label: 'Saved contacts', count: saved.length },
    { id: 'inbox', label: 'Inbox', count: inbox.length + leads.length },
  ]

  return (
    <div className="space-y-5">
      {/* tabs */}
      <div className="flex gap-1 border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition ${
              tab === t.id
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {t.label}
            <span className="ml-1.5 rounded-full bg-canvas-inset px-1.5 py-0.5 text-xs tabular-nums text-ink-muted">
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ---- connections ---- */}
      {tab === 'connections' &&
        (connections.length === 0 ? (
          <EmptyState
            icon={<IconUsers width={20} height={20} />}
            title="No connections yet"
            body="When someone logged into Proxy opens your card link and taps Connect, they appear here — with their contact details unlocked."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {connections.map((c) => (
              <ConnectionCard key={c.connectionId} c={c} />
            ))}
          </div>
        ))}

      {/* ---- saved contacts ---- */}
      {tab === 'saved' && (
        <div className="space-y-4">
          <AddContactForm onAdded={(c) => setSaved((s) => [c, ...s])} />

          {saved.length === 0 ? (
            <EmptyState
              icon={<IconPlus width={20} height={20} />}
              title="No saved contacts"
              body="Add the people you met who are not on Proxy yet, so everything from the event lives in one place."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {saved.map((c) => (
                <div key={c.id} className="card p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-canvas-inset text-sm font-semibold text-ink-muted">
                      {initials(c.full_name)}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{c.full_name}</p>
                      {c.role && <p className="truncate text-xs text-ink-muted">{c.role}</p>}

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                        {c.email && (
                          <ContactLine
                            icon={<IconMail width={13} height={13} />}
                            value={c.email}
                            href={`mailto:${c.email}`}
                          />
                        )}
                        {c.phone && (
                          <ContactLine
                            icon={<IconPhone width={13} height={13} />}
                            value={c.phone}
                            href={`tel:${c.phone}`}
                          />
                        )}
                        {c.link && (
                          <ContactLine icon={<IconLink width={13} height={13} />} value="Link" href={c.link} />
                        )}
                      </div>

                      {c.note && <p className="mt-2 text-xs leading-relaxed text-ink-muted">{c.note}</p>}
                    </div>

                    <button
                      onClick={() => removeSaved(c.id)}
                      className="btn-danger btn-sm shrink-0"
                      aria-label={`Delete ${c.full_name}`}
                    >
                      <IconTrash width={14} height={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---- inbox ---- */}
      {tab === 'inbox' &&
        (inbox.length === 0 && leads.length === 0 ? (
          <EmptyState
            icon={<IconInbox width={20} height={20} />}
            title="Your inbox is empty"
            body="Messages from your connections, and details left by visitors who chatted with your public agent, arrive here."
          />
        ) : (
          <div className="space-y-3">
            {leads.map((l) => (
              <div key={l.id} className="card p-4">
                <div className="flex items-center gap-2">
                  <span className="badge-amber">New lead</span>
                  <p className="text-sm font-medium text-ink">{l.name || 'Anonymous visitor'}</p>
                </div>
                {l.message && <p className="mt-2 text-sm leading-relaxed text-ink-soft">{l.message}</p>}
                {l.email && (
                  <a
                    href={`mailto:${l.email}`}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs text-brand-700 underline underline-offset-2"
                  >
                    <IconMail width={13} height={13} />
                    {l.email}
                  </a>
                )}
              </div>
            ))}

            {inbox.map((m) => (
              <div key={m.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-ink">{m.fromName}</p>
                  <span className="hint">{new Date(m.created_at).toLocaleDateString()}</span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{m.content}</p>
              </div>
            ))}
          </div>
        ))}
    </div>
  )
}
