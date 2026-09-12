import { readFile } from 'node:fs/promises'
import path from 'node:path'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { CopyButton } from '@/components/CopyButton'
import { IconCheck, IconArrow } from '@/components/ui/Icons'
import { hasSupabaseEnv } from '@/lib/env'
import { checkDatabase, hasOpenAIEnv } from '@/lib/setup'

export const metadata = { title: 'Setup' }
export const dynamic = 'force-dynamic'

function projectRefFromUrl(url?: string) {
  const match = /https:\/\/([a-z0-9]+)\.supabase\.co/i.exec(url ?? '')
  return match?.[1] ?? null
}

function StatusRow({ ok, title, children }: { ok: boolean; title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white ${
          ok ? 'bg-emerald-500' : 'bg-amber-500'
        }`}
      >
        {ok ? <IconCheck width={12} height={12} strokeWidth={3} /> : <span className="text-[11px] font-bold">!</span>}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{title}</p>
        <div className="text-sm text-ink-muted">{children}</div>
      </div>
    </div>
  )
}

export default async function SetupPage() {
  const envReady = hasSupabaseEnv
  const db = envReady ? await checkDatabase() : { ready: false, missingTables: [] }

  let sql = ''
  try {
    sql = await readFile(path.join(process.cwd(), 'supabase', 'schema.sql'), 'utf8')
  } catch {
    sql = '-- Could not read supabase/schema.sql from disk. Open the file in your editor instead.'
  }

  const ref = projectRefFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const sqlEditorUrl = ref ? `https://supabase.com/dashboard/project/${ref}/sql/new` : 'https://supabase.com/dashboard'
  const allReady = envReady && db.ready && hasOpenAIEnv

  return (
    <main className="min-h-screen dotted">
      <div className="mx-auto max-w-3xl px-5 py-12">
        <Link href="/">
          <Logo />
        </Link>

        <div className="mt-8">
          <span className={allReady ? 'badge-green' : 'badge-amber'}>
            {allReady ? 'All systems ready' : 'One step left'}
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            {allReady ? 'Your backend is ready' : 'Finish connecting your backend'}
          </h1>
          <p className="mt-2 text-ink-muted">
            {allReady
              ? 'Everything checks out. You can head into the app.'
              : 'Your database tables have not been created yet, so the app has nowhere to store profiles.'}
          </p>
        </div>

        <div className="card mt-8 divide-y divide-line px-5">
          <StatusRow ok={envReady} title="Supabase credentials">
            {envReady ? (
              <>
                Connected to <span className="font-mono text-xs">{ref ?? 'your project'}</span>
              </>
            ) : (
              <>
                Add <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
                <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{' '}
                <code className="font-mono text-xs">.env</code>, then restart the dev server.
              </>
            )}
          </StatusRow>

          <StatusRow ok={hasOpenAIEnv} title="OpenAI API key">
            {hasOpenAIEnv ? (
              'Found — your agents can think.'
            ) : (
              <>
                Add <code className="font-mono text-xs">OPENAI_API_KEY</code> to{' '}
                <code className="font-mono text-xs">.env</code>. Chat will fail without it.
              </>
            )}
          </StatusRow>

          <StatusRow ok={db.ready} title="Database tables">
            {db.ready ? (
              'All tables present.'
            ) : db.missingTables.length > 0 ? (
              <>
                Missing: <span className="font-mono text-xs">{db.missingTables.join(', ')}</span>
              </>
            ) : (
              'Cannot reach the database yet.'
            )}
          </StatusRow>
        </div>

        {!db.ready && envReady && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold tracking-tight">Run the schema — takes about 30 seconds</h2>

            <ol className="mt-4 space-y-3">
              {[
                <>
                  Copy the schema below.
                  <CopyButton value={sql} label="Copy SQL" className="btn-primary btn-sm ml-2 align-middle" />
                </>,
                <>
                  Open your{' '}
                  <a
                    href={sqlEditorUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-brand-700 underline underline-offset-2"
                  >
                    Supabase SQL editor
                  </a>
                  , paste it in, and press <span className="font-medium">Run</span>.
                </>,
                <>
                  In <span className="font-medium">Authentication &rarr; Providers &rarr; Email</span>, turn off
                  &ldquo;Confirm email&rdquo; so signups work instantly during the demo.
                </>,
                <>Come back and reload this page — every row above should turn green.</>,
              ].map((step, i) => (
                <li key={i} className="card flex gap-3 p-4 text-sm text-ink-soft">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>

            <details className="card mt-4 p-4">
              <summary className="cursor-pointer text-sm font-medium text-ink">View the SQL</summary>
              <pre className="scroll-slim mt-3 max-h-80 overflow-auto rounded-lg bg-canvas-inset p-4 text-xs leading-relaxed text-ink-soft">
                {sql}
              </pre>
            </details>
          </section>
        )}

        <div className="mt-8 flex items-center gap-3">
          <Link href="/dashboard" className="btn-primary">
            Go to dashboard <IconArrow width={16} height={16} />
          </Link>
          <Link href="/setup" className="btn-secondary">
            Re-run checks
          </Link>
        </div>
      </div>
    </main>
  )
}
