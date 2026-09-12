import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCardUrl } from '@/lib/url'
import { profileStrength, type PublicData, type ContactData } from '@/lib/profile'
import { CardLink } from '@/components/CardLink'
import { PageHeader } from '@/components/ui/PageHeader'
import {
  IconLibrary,
  IconUsers,
  IconInbox,
  IconCheck,
  IconArrow,
  IconSpark,
  IconUpload,
  IconGlobe,
} from '@/components/ui/Icons'

export const metadata = { title: 'Overview' }
export const dynamic = 'force-dynamic'

function Stat({
  icon,
  value,
  label,
  href,
}: {
  icon: React.ReactNode
  value: number
  label: string
  href: string
}) {
  return (
    <Link href={href} className="card-pad transition hover:shadow-lift">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        {icon}
      </span>
      <p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-ink-muted">{label}</p>
    </Link>
  )
}

export default async function OverviewPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: documents }, { data: contacts }, { data: inbox }, { data: leads }] =
    await Promise.all([
      supabase.from('profiles').select('handle, full_name, public_data, contact_data').eq('id', user.id).single(),
      supabase.from('documents').select('id, title, kind, is_public, created_at').eq('user_id', user.id),
      supabase.rpc('my_contacts'),
      supabase.from('messages').select('id, content, created_at, from_user').eq('to_user', user.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('leads').select('id, name, email, message, created_at').eq('owner_id', user.id).order('created_at', { ascending: false }).limit(5),
    ])

  if (!profile) redirect('/setup')

  const publicData = (profile.public_data ?? {}) as PublicData
  const contactData = (profile.contact_data ?? {}) as ContactData
  const docs = documents ?? []
  const contactList = (contacts ?? []) as { contact_id: string; full_name: string; handle: string; shared_points: string[] }[]

  const strength = profileStrength(profile.full_name, publicData, contactData, docs.length)
  const cardUrl = await getCardUrl(profile.handle)
  const publicDocs = docs.filter((d) => d.is_public).length

  const nextStep = strength.checks.find((c) => !c.done)

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-5 sm:p-8">
      <PageHeader
        title={`Welcome back${profile.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}`}
        subtitle="Your agent is live and answering on your behalf."
        action={
          <Link href="/dashboard/agent" className="btn-primary">
            <IconSpark width={16} height={16} />
            Ask your agent
          </Link>
        }
      />

      <CardLink url={cardUrl} handle={profile.handle} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={<IconLibrary width={17} height={17} />} value={docs.length} label="Documents in knowledge base" href="/dashboard/knowledge" />
        <Stat icon={<IconUsers width={17} height={17} />} value={contactList.length} label="Connections made" href="/dashboard/network" />
        <Stat icon={<IconInbox width={17} height={17} />} value={(inbox ?? []).length + (leads ?? []).length} label="Messages & leads" href="/dashboard/network" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* ---------- profile strength ---------- */}
        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Profile strength</h2>
            <span className="text-sm font-semibold tabular-nums text-brand-700">{strength.percent}%</span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-canvas-inset">
            <div
              className="h-full rounded-full bg-brand-600 transition-all duration-500"
              style={{ width: `${strength.percent}%` }}
            />
          </div>

          <p className="mt-2 text-xs text-ink-faint">
            {strength.done} of {strength.total} complete
            {nextStep && <> · next: {nextStep.label.toLowerCase()}</>}
          </p>

          <ul className="mt-4 space-y-2">
            {strength.checks.map((c) => (
              <li key={c.label} className="flex items-center gap-2.5 text-sm">
                <span
                  className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full ${
                    c.done ? 'bg-emerald-500 text-white' : 'border border-line bg-canvas-inset'
                  }`}
                  style={{ width: 18, height: 18 }}
                >
                  {c.done && <IconCheck width={11} height={11} strokeWidth={3} />}
                </span>
                <span className={c.done ? 'text-ink-faint line-through' : 'text-ink-soft'}>{c.label}</span>
              </li>
            ))}
          </ul>

          <Link href="/dashboard/settings" className="btn-secondary btn-sm mt-4">
            Complete profile <IconArrow width={14} height={14} />
          </Link>
        </section>

        {/* ---------- what the public agent knows ---------- */}
        <section className="card p-5">
          <h2 className="section-title">What your public agent can share</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Visitors only ever see this. Everything else stays private.
          </p>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-line bg-canvas-inset px-3 py-2.5">
              <span className="flex items-center gap-2 text-sm text-ink-soft">
                <IconGlobe width={15} height={15} />
                Public documents
              </span>
              <span className="text-sm font-semibold tabular-nums">
                {publicDocs} / {docs.length}
              </span>
            </div>

            {publicData.headline ? (
              <div className="rounded-lg border border-line px-3 py-2.5">
                <p className="hint">Headline</p>
                <p className="mt-0.5 text-sm text-ink-soft">{publicData.headline}</p>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-line px-3 py-2.5">
                <p className="text-sm text-ink-faint">
                  No headline yet — your agent has little to introduce you with.
                </p>
              </div>
            )}

            {publicData.skills && (
              <div className="flex flex-wrap gap-1.5">
                {publicData.skills
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .slice(0, 10)
                  .map((s) => (
                    <span key={s} className="badge-neutral">
                      {s}
                    </span>
                  ))}
              </div>
            )}
          </div>

          {docs.length === 0 && (
            <Link href="/dashboard/knowledge" className="btn-primary btn-sm mt-4">
              <IconUpload width={14} height={14} />
              Upload your CV
            </Link>
          )}
        </section>
      </div>

      {/* ---------- recent activity ---------- */}
      <section className="card p-5">
        <h2 className="section-title">Recent activity</h2>

        {(inbox ?? []).length === 0 && (leads ?? []).length === 0 && contactList.length === 0 ? (
          <p className="mt-3 text-sm text-ink-faint">
            Nothing yet. Share your card link and activity will show up here.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {contactList.slice(0, 3).map((c) => (
              <li key={c.contact_id} className="flex items-start gap-3 py-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  <IconUsers width={14} height={14} />
                </span>
                <p className="text-sm text-ink-soft">
                  Connected with <span className="font-medium text-ink">{c.full_name || c.handle}</span>
                  {c.shared_points?.length > 0 && (
                    <span className="text-ink-faint"> · {c.shared_points[0]}</span>
                  )}
                </p>
              </li>
            ))}

            {(leads ?? []).slice(0, 3).map((l) => (
              <li key={l.id} className="flex items-start gap-3 py-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                  <IconInbox width={14} height={14} />
                </span>
                <p className="text-sm text-ink-soft">
                  <span className="font-medium text-ink">{l.name || l.email || 'A visitor'}</span> left
                  their details with your agent
                </p>
              </li>
            ))}

            {(inbox ?? []).slice(0, 3).map((m) => (
              <li key={m.id} className="flex items-start gap-3 py-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <IconInbox width={14} height={14} />
                </span>
                <p className="line-clamp-2 text-sm text-ink-soft">{m.content}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
