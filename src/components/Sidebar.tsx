'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/ui/Logo'
import { SignOutButton } from '@/components/SignOutButton'
import {
  IconHome,
  IconLibrary,
  IconSpark,
  IconUsers,
  IconSettings,
  IconGlobe,
  IconMenu,
  IconX,
} from '@/components/ui/Icons'

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: IconHome },
  { href: '/dashboard/knowledge', label: 'Knowledge', icon: IconLibrary },
  { href: '/dashboard/agent', label: 'Your agent', icon: IconSpark },
  { href: '/dashboard/network', label: 'Network', icon: IconUsers },
  { href: '/dashboard/settings', label: 'Settings', icon: IconSettings },
]

function NavLinks({
  handle,
  onNavigate,
}: {
  handle: string
  onNavigate?: () => void
}) {
  const pathname = usePathname()

  return (
    <>
      <nav className="space-y-0.5">
        {NAV.map((item) => {
          // Only "/dashboard" needs an exact match; the rest are section roots.
          const active = item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={`nav-item ${active ? 'nav-item-active' : ''}`}
            >
              <item.icon width={17} height={17} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto space-y-3 pt-6">
        <Link
          href={`/u/${handle}`}
          target="_blank"
          onClick={onNavigate}
          className="block rounded-lg border border-line bg-canvas-inset p-3 transition hover:border-brand-200 hover:bg-brand-50"
        >
          <span className="flex items-center gap-2 text-xs font-medium text-ink-muted">
            <IconGlobe width={14} height={14} />
            Your public agent
          </span>
          <span className="mt-1 block truncate font-mono text-xs text-brand-700">/u/{handle}</span>
        </Link>

        <SignOutButton />
      </div>
    </>
  )
}

export function Sidebar({ handle, fullName }: { handle: string; fullName: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* ---- mobile top bar ---- */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-canvas px-4 py-3 lg:hidden">
        <Link href="/dashboard">
          <Logo size={24} />
        </Link>
        <button
          onClick={() => setOpen((v) => !v)}
          className="btn-ghost p-2"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <IconX /> : <IconMenu />}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 top-[57px] z-30 bg-canvas px-4 py-5 lg:hidden">
          <div className="flex h-full flex-col">
            <NavLinks handle={handle} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      {/* ---- desktop sidebar ---- */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-canvas px-3 py-5 lg:flex">
        <Link href="/dashboard" className="px-2">
          <Logo />
        </Link>

        <div className="mt-6 flex flex-1 flex-col">
          <div className="mb-4 flex items-center gap-2.5 rounded-lg bg-canvas-inset px-3 py-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
              {(fullName || handle).slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{fullName || handle}</p>
              <p className="flex items-center gap-1.5 text-xs text-ink-faint">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Agent live
              </p>
            </div>
          </div>

          <NavLinks handle={handle} />
        </div>
      </aside>
    </>
  )
}
