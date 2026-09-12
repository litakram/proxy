'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { PublicData, PrivateData, ContactData } from '@/lib/profile'
import { IconGlobe, IconLock, IconMail, IconCheck } from '@/components/ui/Icons'

type Profile = {
  id: string
  handle: string
  full_name: string
  public_data: PublicData | null
  private_data: PrivateData | null
  contact_data: ContactData | null
}

function Section({
  icon,
  title,
  description,
  tone = 'neutral',
  children,
}: {
  icon: React.ReactNode
  title: string
  description: string
  tone?: 'public' | 'private' | 'neutral'
  children: React.ReactNode
}) {
  const toneClass =
    tone === 'public'
      ? 'bg-emerald-50 text-emerald-600'
      : tone === 'private'
        ? 'bg-canvas-inset text-ink-muted'
        : 'bg-brand-50 text-brand-600'

  return (
    <section className="card p-5">
      <div className="flex items-start gap-3">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${toneClass}`}>
          {icon}
        </span>
        <div>
          <h2 className="section-title">{title}</h2>
          <p className="mt-0.5 text-sm text-ink-muted">{description}</p>
        </div>
      </div>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  )
}

function Field({
  label,
  hint,
  value,
  onChange,
  placeholder,
  rows,
}: {
  label: string
  hint?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {rows ? (
        <textarea
          className="field"
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className="field"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {hint && <p className="hint mt-1">{hint}</p>}
    </div>
  )
}

export function ProfileEditor({ initialProfile }: { initialProfile: Profile }) {
  const router = useRouter()

  const [handle, setHandle] = useState(initialProfile.handle)
  const [fullName, setFullName] = useState(initialProfile.full_name)
  const [pub, setPub] = useState<PublicData>(initialProfile.public_data ?? {})
  const [priv, setPriv] = useState<PrivateData>(initialProfile.private_data ?? {})
  const [contact, setContact] = useState<ContactData>(initialProfile.contact_data ?? {})
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [error, setError] = useState<string | null>(null)

  const setPubField = (k: keyof PublicData) => (v: string) => setPub((p) => ({ ...p, [k]: v }))
  const setPrivField = (k: keyof PrivateData) => (v: string) => setPriv((p) => ({ ...p, [k]: v }))
  const setContactField = (k: keyof ContactData) => (v: string) => setContact((c) => ({ ...c, [k]: v }))

  async function save() {
    setStatus('saving')
    setError(null)

    const cleanHandle = handle.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')
    if (cleanHandle.length < 3) {
      setStatus('idle')
      setError('Your handle needs at least 3 letters or numbers.')
      return
    }

    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({
        handle: cleanHandle,
        full_name: fullName.trim(),
        public_data: pub,
        private_data: priv,
        contact_data: contact,
      })
      .eq('id', initialProfile.id)

    if (error) {
      setStatus('idle')
      setError(
        error.code === '23505'
          ? `The handle "${cleanHandle}" is taken — try another.`
          : error.message
      )
      return
    }

    setHandle(cleanHandle)
    setStatus('saved')
    router.refresh()
    setTimeout(() => setStatus('idle'), 2200)
  }

  return (
    <div className="space-y-5 pb-24">
      <Section
        icon={<IconGlobe width={16} height={16} />}
        title="Identity"
        description="Your name and the handle your card link points to."
        tone="neutral"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" value={fullName} onChange={setFullName} placeholder="Akram Litnitia" />
          <Field
            label="Handle"
            hint={`Your card opens /u/${handle || 'your-handle'}`}
            value={handle}
            onChange={setHandle}
            placeholder="akram"
          />
        </div>
      </Section>

      <Section
        icon={<IconGlobe width={16} height={16} />}
        title="Public profile"
        description="Anyone who taps your card sees this, and your public agent answers from it."
        tone="public"
      >
        <Field
          label="Headline"
          value={pub.headline ?? ''}
          onChange={setPubField('headline')}
          placeholder="AI engineering student building agent tooling"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Current role" value={pub.role ?? ''} onChange={setPubField('role')} placeholder="Frontend engineer" />
          <Field
            label="Company or school"
            value={pub.company ?? ''}
            onChange={setPubField('company')}
            placeholder="ENSA Tangier"
          />
          <Field label="Location" value={pub.location ?? ''} onChange={setPubField('location')} placeholder="Tangier, Morocco" />
          <Field
            label="Skills"
            hint="Comma separated — these show as tags."
            value={pub.skills ?? ''}
            onChange={setPubField('skills')}
            placeholder="React, TypeScript, Python, LLMs"
          />
        </div>

        <Field
          label="Interests"
          value={pub.interests ?? ''}
          onChange={setPubField('interests')}
          placeholder="Agents, developer tooling, football"
        />
        <Field
          label="Professional goals"
          value={pub.goals ?? ''}
          onChange={setPubField('goals')}
          placeholder="Join an AI startup as a founding engineer"
        />
        <Field
          label="What you are looking for"
          hint="Your agent uses this to spot who is worth introducing you to."
          value={pub.lookingFor ?? ''}
          onChange={setPubField('lookingFor')}
          placeholder="A co-founder, an internship, people building with LLMs"
        />
        <Field
          label="Short bio"
          rows={4}
          value={pub.bio ?? ''}
          onChange={setPubField('bio')}
          placeholder="Two or three sentences your agent can introduce you with."
        />
      </Section>

      <Section
        icon={<IconMail width={16} height={16} />}
        title="Contact details"
        description="Held back until someone connects with you — then unlocked for both sides."
        tone="neutral"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" value={contact.email ?? ''} onChange={setContactField('email')} placeholder="you@example.com" />
          <Field label="Phone" value={contact.phone ?? ''} onChange={setContactField('phone')} placeholder="+212 6 00 00 00 00" />
          <Field
            label="LinkedIn"
            value={contact.linkedin ?? ''}
            onChange={setContactField('linkedin')}
            placeholder="https://linkedin.com/in/…"
          />
          <Field
            label="Website"
            value={contact.website ?? ''}
            onChange={setContactField('website')}
            placeholder="https://yoursite.com"
          />
          <Field label="GitHub" value={contact.github ?? ''} onChange={setContactField('github')} placeholder="https://github.com/…" />
          <Field label="X / Twitter" value={contact.x ?? ''} onChange={setContactField('x')} placeholder="https://x.com/…" />
        </div>
      </Section>

      <Section
        icon={<IconLock width={16} height={16} />}
        title="Private context"
        description="Only your own agent reads this. It never reaches your public agent."
        tone="private"
      >
        <Field
          label="CV / background"
          hint="Prefer uploading the file under Knowledge — this is for anything extra."
          rows={5}
          value={priv.cvText ?? ''}
          onChange={setPrivField('cvText')}
          placeholder="Paste anything your agent should know that is not in an uploaded document."
        />
        <Field
          label="Private notes"
          rows={4}
          value={priv.privateNotes ?? ''}
          onChange={setPrivField('privateNotes')}
          placeholder="Salary expectations, what you actually want next, who you are avoiding…"
        />
      </Section>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>
      )}

      {/* Sticky so the save button is always reachable on a long form. */}
      <div className="sticky bottom-4 flex justify-end">
        <button onClick={save} disabled={status === 'saving'} className="btn-primary shadow-lift">
          {status === 'saved' && <IconCheck width={15} height={15} />}
          {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
