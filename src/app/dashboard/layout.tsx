import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { hasSupabaseEnv } from '@/lib/env'
import { checkDatabase, ensureProfile } from '@/lib/setup'
import { Sidebar } from '@/components/Sidebar'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!hasSupabaseEnv) redirect('/setup')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // An un-migrated database is the single most likely reason a page here fails,
  // so check it once in the layout and send the user somewhere actionable.
  const db = await checkDatabase()
  if (!db.ready) redirect('/setup')

  // Users created before the trigger existed have no profile row; make one
  // rather than stranding them on an empty dashboard.
  const profile = await ensureProfile(
    user.id,
    user.email,
    (user.user_metadata?.full_name as string | undefined) ?? ''
  )

  if (!profile) redirect('/setup')

  return (
    <div className="flex min-h-screen flex-col bg-canvas-subtle lg:flex-row">
      <Sidebar handle={profile.handle} fullName={profile.full_name} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
