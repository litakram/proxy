import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { hasSupabaseEnv } from '@/lib/env'
import { BRAND } from '@/lib/brand'
import { Logo } from '@/components/ui/Logo'
import { ChatWindow } from '@/components/ChatWindow'
import { ConnectBanner } from '@/components/ConnectBanner'
import { LeadForm } from '@/components/LeadForm'
import type { PublicData } from '@/lib/profile'
import { IconGlobe, IconLock, IconShield, IconFile } from '@/components/ui/Icons'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ handle: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params
  if (!hasSupabaseEnv) return { title: handle }

  const supabase = await createClient()
  const { data } = await supabase
    .from('public_profiles')
    .select('full_name, public_data')
    .eq('handle', handle)
    .maybeSingle()

  const name = data?.full_name || handle
  const headline = (data?.public_data as PublicData | null)?.headline

  return {
    title: `${name}'s agent`,
    description: headline ?? `Talk to ${name}'s AI agent on ${BRAND.name}.`,
  }
}

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

export default async function PublicAgentPage({ params }: Props) {
  const { handle } = await params

  if (!hasSupabaseEnv) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <Link href="/setup" className="btn-primary">
          Finish setup
        </Link>
      </main>
    )
  }

  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('public_profiles')
    .select('id, full_name, public_data')
    .eq('handle', handle)
    .maybeSingle()

  if (!profile) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center dotted">
        <Logo />
        <div>
          <p className="text-lg font-semibold">No agent at /u/{handle}</p>
          <p className="mt-1 text-sm text-ink-muted">This card link does not point to a profile yet.</p>
        </div>
        <Link href="/signup" className="btn-primary">
          Create your own agent
        </Link>
      </main>
    )
  }

  const [{ data: user }, { data: publicDocs }] = await Promise.all([
    supabase.auth.getUser().then((r) => ({ data: r.data.user })),
    supabase.from('public_documents').select('id, title, kind').eq('user_id', profile.id),
  ])

  const pub = (profile.public_data ?? {}) as PublicData
  const name = profile.full_name || handle
  const isOwner = user?.id === profile.id
  const docCount = (publicDocs ?? []).length

  const skills = (pub.skills ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const suggestions = [
    'What do they do?',
    pub.skills ? 'What are they good at?' : 'Tell me about them',
    pub.lookingFor ? 'What are they looking for?' : 'What are their goals?',
  ]

  return (
    <div className="min-h-screen dotted">
      <header className="border-b border-line bg-canvas/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
          <Link href="/">
            <Logo size={24} />
          </Link>
          {!user && (
            <Link href="/signup" className="btn-secondary btn-sm">
              Get your own agent
            </Link>
          )}
          {isOwner && (
            <Link href="/dashboard" className="btn-secondary btn-sm">
              This is you · Dashboard
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-5 py-8">
        {/* ---------- identity card ---------- */}
        <section className="card animate-fade-up overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400" />

          <div className="px-5 pb-5">
            <div className="-mt-10 flex items-end justify-between">
              <span className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-canvas bg-brand-600 text-xl font-semibold text-white shadow-card">
                {initials(name)}
              </span>
              <span className="badge-green mb-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Agent online
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight">{name}</h1>
            {pub.headline && <p className="mt-1 text-ink-muted">{pub.headline}</p>}

            {(pub.role || pub.company || pub.location) && (
              <p className="mt-2 text-sm text-ink-faint">
                {[pub.role, pub.company, pub.location].filter(Boolean).join(' · ')}
              </p>
            )}

            {pub.bio && <p className="mt-4 text-sm leading-relaxed text-ink-soft">{pub.bio}</p>}

            {skills.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {skills.slice(0, 12).map((s) => (
                  <span key={s} className="badge-neutral">
                    {s}
                  </span>
                ))}
              </div>
            )}

            {pub.lookingFor && (
              <div className="mt-4 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2.5">
                <p className="text-xs font-medium text-brand-700">Looking for</p>
                <p className="mt-0.5 text-sm text-brand-900">{pub.lookingFor}</p>
              </div>
            )}
          </div>
        </section>

        {/* ---------- connect / lead capture ---------- */}
        {user && !isOwner && <ConnectBanner ownerHandle={handle} ownerName={name} />}
        {!user && <LeadForm handle={handle} ownerName={name} />}

        {/* ---------- the agent ---------- */}
        <section>
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="section-title">Ask {name.split(' ')[0]}&apos;s agent</h2>
            <span className="hint flex items-center gap-1.5">
              <IconFile width={13} height={13} />
              {docCount > 0
                ? `Answering from ${docCount} shared ${docCount === 1 ? 'document' : 'documents'}`
                : 'Answering from their public profile'}
            </span>
          </div>

          <ChatWindow
            endpoint="/api/chat/public"
            extraBody={{ handle }}
            className="h-[460px]"
            agentName={`${name.split(' ')[0]}'s agent`}
            avatar={initials(name)}
            greeting={`I represent ${name}. Ask me about their work, skills, or what they are looking for.`}
            suggestions={suggestions}
          />

          <p className="mt-3 flex items-start gap-2 text-xs text-ink-faint">
            <IconShield width={14} height={14} className="mt-px shrink-0" />
            This agent only sees what {name.split(' ')[0]} marked public. Private documents, notes, and
            contact details are withheld at the database level — it cannot reveal them even if asked.
          </p>
        </section>

        {/* ---------- what it can and cannot see ---------- */}
        <section className="grid gap-3 sm:grid-cols-2">
          <div className="card p-4">
            <p className="flex items-center gap-2 text-xs font-medium text-emerald-700">
              <IconGlobe width={14} height={14} />
              It can talk about
            </p>
            <ul className="mt-2 space-y-1 text-sm text-ink-soft">
              {[
                pub.headline && 'Their role and headline',
                skills.length > 0 && 'Skills and experience',
                pub.goals && 'Professional goals',
                docCount > 0 && `${docCount} shared ${docCount === 1 ? 'document' : 'documents'}`,
              ]
                .filter(Boolean)
                .map((x) => (
                  <li key={x as string}>· {x}</li>
                ))}
              {!pub.headline && skills.length === 0 && !pub.goals && docCount === 0 && (
                <li className="text-ink-faint">· Not much yet — this profile is still empty</li>
              )}
            </ul>
          </div>

          <div className="card p-4">
            <p className="flex items-center gap-2 text-xs font-medium text-ink-muted">
              <IconLock width={14} height={14} />
              It will never share
            </p>
            <ul className="mt-2 space-y-1 text-sm text-ink-soft">
              <li>· Contact details before you connect</li>
              <li>· Private documents and notes</li>
              <li>· Anything not marked public</li>
            </ul>
          </div>
        </section>

        <footer className="pt-4 text-center">
          <p className="text-xs text-ink-faint">
            Powered by{' '}
            <Link href="/" className="font-medium text-brand-700 underline underline-offset-2">
              {BRAND.name}
            </Link>{' '}
            — {BRAND.tagline.toLowerCase()}
          </p>
        </footer>
      </main>
    </div>
  )
}
