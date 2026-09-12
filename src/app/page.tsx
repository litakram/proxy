import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { hasSupabaseEnv } from '@/lib/env'
import { BRAND } from '@/lib/brand'
import { Logo, LogoMark } from '@/components/ui/Logo'
import {
  IconArrow,
  IconNfc,
  IconLock,
  IconGlobe,
  IconUsers,
  IconUpload,
  IconShield,
  IconSpark,
} from '@/components/ui/Icons'

export const dynamic = 'force-dynamic'

const FEATURES = [
  {
    icon: IconUpload,
    title: 'Feed it everything',
    body: 'Drop in your CV, portfolio, notes, project write-ups. Proxy reads them and builds the context both agents run on.',
  },
  {
    icon: IconLock,
    title: 'A private agent that knows you',
    body: 'It has your full history. Ask it to draft the outreach, prep you for the meeting, or tighten your CV.',
  },
  {
    icon: IconGlobe,
    title: 'A public agent that represents you',
    body: 'Answers questions about you 24/7 from only what you marked public. It cannot leak what you did not share.',
  },
  {
    icon: IconUsers,
    title: 'Connections, not business cards',
    body: 'When two members meet, their agents compare notes and surface what you actually have in common.',
  },
]

const STEPS = [
  { n: '01', title: 'Upload your world', body: 'CV, portfolio, notes — Proxy extracts the text and remembers it.' },
  { n: '02', title: 'Choose what is public', body: 'Flip each document public or private. Your public agent only ever sees the public half.' },
  { n: '03', title: 'They tap your card', body: 'An NFC tag or QR opens your agent. It answers their questions instantly.' },
  { n: '04', title: 'Both sides keep the contact', body: 'One tap to connect. Contact details unlock for both of you, and you can message through the app.' },
]

export default async function Home() {
  if (hasSupabaseEnv) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-canvas">
      {/* ---------------- nav ---------------- */}
      <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Logo />
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost">
              Log in
            </Link>
            <Link href="/signup" className="btn-primary">
              Get your agent
            </Link>
          </div>
        </nav>
      </header>

      {/* ---------------- hero ---------------- */}
      <section className="relative overflow-hidden dotted">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-brand-50/80 to-transparent" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 lg:grid-cols-2 lg:py-28">
          <div className="animate-fade-up">
            <span className="badge-brand">
              <IconNfc width={14} height={14} />
              Tap-to-meet networking
            </span>

            <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Your agent stands in for you.
            </h1>

            <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-muted">
              {BRAND.name} gives you two agents from one profile: a private one that knows your whole
              history, and a public one anyone can talk to when they tap your card — without ever
              leaking what you kept private.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/signup" className="btn-primary px-5 py-2.5">
                Create your agent <IconArrow width={16} height={16} />
              </Link>
              <a href="#how-it-works" className="btn-secondary px-5 py-2.5">
                See how it works
              </a>
            </div>

            <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-faint">
              <IconShield width={14} height={14} />
              Public and private data are stored separately and enforced in the database.
            </p>
          </div>

          {/* ---- product mock ---- */}
          <div className="animate-fade-up lg:justify-self-end">
            <div className="relative mx-auto w-full max-w-sm">
              <div className="absolute -inset-6 rounded-[2rem] bg-brand-500/5 blur-2xl" />

              <div className="relative card overflow-hidden shadow-lift">
                <div className="flex items-center gap-2 border-b border-line bg-canvas-inset px-4 py-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                  <span className="ml-2 font-mono text-[11px] text-ink-faint">proxy.app/u/akram</span>
                </div>

                <div className="space-y-4 p-5">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                      AL
                      <span className="absolute inset-0 rounded-full bg-brand-500/40 animate-pulse-ring" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">Akram&apos;s agent</p>
                      <p className="flex items-center gap-1.5 text-xs text-ink-faint">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Online · answers as Akram
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex justify-end">
                      <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-brand-600 px-3.5 py-2 text-sm text-white">
                        What has he actually shipped?
                      </p>
                    </div>
                    <div className="flex justify-start">
                      <p className="max-w-[90%] rounded-2xl rounded-bl-sm bg-canvas-inset px-3.5 py-2 text-sm text-ink-soft">
                        He built a real-time CV parser handling 4k docs/day, and led the frontend for a
                        fintech dashboard used by 12k users.
                      </p>
                    </div>
                    <div className="flex justify-end">
                      <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-brand-600 px-3.5 py-2 text-sm text-white">
                        What&apos;s his salary?
                      </p>
                    </div>
                    <div className="flex justify-start">
                      <p className="max-w-[90%] rounded-2xl rounded-bl-sm bg-canvas-inset px-3.5 py-2 text-sm text-ink-soft">
                        That is private — I only have what Akram made public. Connect and you can ask him
                        directly.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-brand-200 bg-brand-50 px-3 py-2.5">
                    <p className="text-xs font-medium text-brand-800">You both work on AI tooling</p>
                    <span className="rounded-md bg-brand-600 px-2.5 py-1 text-xs font-medium text-white">
                      Connect
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- features ---------------- */}
      <section className="border-t border-line bg-canvas-subtle">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="max-w-xl text-3xl font-semibold tracking-tight">
            One profile. Two agents. Nothing leaks between them.
          </h2>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="card-pad transition hover:shadow-lift">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <f.icon />
                </span>
                <h3 className="mt-4 text-sm font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- how it works ---------------- */}
      <section id="how-it-works" className="scroll-mt-16 border-t border-line bg-canvas">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="flex items-center gap-2 text-brand-600">
            <IconSpark width={16} height={16} />
            <span className="text-xs font-semibold uppercase tracking-wider">How it works</span>
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">From upload to handshake</h2>

          <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="bg-canvas p-6">
                <span className="font-mono text-xs font-semibold text-brand-500">{s.n}</span>
                <h3 className="mt-3 text-sm font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- cta ---------------- */}
      <section className="border-t border-line bg-canvas-subtle">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center">
          <LogoMark size={44} />
          <h2 className="mt-6 text-3xl font-semibold tracking-tight">
            Stop explaining yourself at every event.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-ink-muted">
            Set up your profile once. Your agent handles the rest — and remembers everyone you meet.
          </p>
          <Link href="/signup" className="btn-primary mt-8 px-5 py-2.5">
            Create your agent <IconArrow width={16} height={16} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-line bg-canvas">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-6 text-sm text-ink-faint sm:flex-row">
          <Logo size={22} />
          <p>{BRAND.tagline}</p>
        </div>
      </footer>
    </div>
  )
}
