import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { IconCheck } from '@/components/ui/Icons'

const POINTS = [
  'Upload your CV once — both agents learn from it',
  'Your public agent answers only from what you mark public',
  'Connect by tap, keep the contact forever',
]

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* form side */}
      <div className="flex flex-col px-5 py-8 sm:px-10">
        <Link href="/" className="inline-flex">
          <Logo />
        </Link>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm animate-fade-up">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1.5 text-sm text-ink-muted">{subtitle}</p>
            <div className="mt-7">{children}</div>
          </div>
        </div>
      </div>

      {/* brand side */}
      <div className="relative hidden overflow-hidden border-l border-line bg-canvas-subtle dotted lg:block">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-50/70 via-transparent to-transparent" />

        <div className="relative flex h-full flex-col justify-center px-14">
          <blockquote className="max-w-md text-2xl font-medium leading-snug tracking-tight">
            &ldquo;I stopped handing out business cards. People just tap my badge and talk to my
            agent.&rdquo;
          </blockquote>

          <ul className="mt-10 space-y-3">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-sm text-ink-soft">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
                  <IconCheck width={12} height={12} strokeWidth={3} />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  )
}
