import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { ProfileEditor } from '@/components/ProfileEditor'

export const metadata = { title: 'Settings' }
export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, handle, full_name, public_data, private_data, contact_data')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/setup')

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-5 sm:p-8">
      <PageHeader
        title="Settings"
        subtitle="What your agents know, and which half of it the world can see."
      />
      <ProfileEditor initialProfile={profile} />
    </div>
  )
}
