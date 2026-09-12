import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { ChatWindow } from '@/components/ChatWindow'
import { IconLock, IconLibrary, IconArrow } from '@/components/ui/Icons'

export const metadata = { title: 'Your agent' }
export const dynamic = 'force-dynamic'

const SUGGESTIONS = [
  'Summarise my CV in three bullets',
  'Draft a cold email to a startup founder',
  'What should I work on next?',
  'Prep me for an interview',
]

export default async function AgentPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { count }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    supabase.from('documents').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  const docCount = count ?? 0
  const firstName = profile?.full_name?.split(' ')[0] ?? 'you'

  return (
    <div className="mx-auto flex h-screen max-w-4xl flex-col gap-5 p-5 sm:p-8">
      <PageHeader
        title="Your agent"
        subtitle="Private. It reads everything you uploaded, including what you kept to yourself."
        action={
          <span className="badge-neutral">
            <IconLock width={13} height={13} />
            Private conversation
          </span>
        }
      />

      {docCount === 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="flex items-center gap-2 text-sm text-amber-900">
            <IconLibrary width={15} height={15} />
            Your knowledge base is empty, so the agent only has your profile fields to work from.
          </p>
          <Link href="/dashboard/knowledge" className="btn-secondary btn-sm">
            Upload your CV <IconArrow width={13} height={13} />
          </Link>
        </div>
      )}

      <ChatWindow
        endpoint="/api/chat/private"
        className="min-h-0 flex-1"
        agentName="your agent"
        greeting={`I have read everything you gave me${
          docCount > 0 ? ` — ${docCount} ${docCount === 1 ? 'document' : 'documents'}` : ''
        }. Ask me to draft something, plan something, or tell you what to do next, ${firstName}.`}
        suggestions={SUGGESTIONS}
      />
    </div>
  )
}
