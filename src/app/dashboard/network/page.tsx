import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { NetworkView, type Connection, type InboxMessage } from '@/components/NetworkView'
import type { PublicData, ContactData } from '@/lib/profile'

export const metadata = { title: 'Network' }
export const dynamic = 'force-dynamic'

type ContactRow = {
  connection_id: string
  contact_id: string
  handle: string
  full_name: string
  public_data: PublicData | null
  contact_data: ContactData | null
  shared_points: string[] | null
  connected_at: string
}

export default async function NetworkPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: rows }, { data: manual }, { data: messages }, { data: leads }] = await Promise.all([
    supabase.rpc('my_contacts'),
    supabase
      .from('manual_contacts')
      .select('id, full_name, role, email, phone, link, note')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('messages')
      .select('id, content, created_at, from_user')
      .eq('to_user', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('leads')
      .select('id, name, email, message, created_at')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const contactRows = (rows ?? []) as ContactRow[]

  const connections: Connection[] = contactRows.map((r) => ({
    connectionId: r.connection_id,
    contactId: r.contact_id,
    handle: r.handle,
    fullName: r.full_name,
    headline: r.public_data?.headline ?? '',
    sharedPoints: r.shared_points ?? [],
    email: r.contact_data?.email,
    phone: r.contact_data?.phone,
    linkedin: r.contact_data?.linkedin,
    website: r.contact_data?.website,
    connectedAt: r.connected_at,
  }))

  // Resolve sender names from the connections we already loaded.
  const nameById = new Map(connections.map((c) => [c.contactId, c.fullName || c.handle]))

  const inbox: InboxMessage[] = (messages ?? []).map((m) => ({
    id: m.id,
    content: m.content,
    created_at: m.created_at,
    fromName: nameById.get(m.from_user) ?? 'A connection',
  }))

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-5 sm:p-8">
      <PageHeader
        title="Network"
        subtitle="Everyone your agent has met, and everything they left behind."
      />
      <NetworkView
        connections={connections}
        manualContacts={manual ?? []}
        inbox={inbox}
        leads={leads ?? []}
      />
    </div>
  )
}
