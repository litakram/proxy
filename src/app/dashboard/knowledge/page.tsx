import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { KnowledgeManager, type Doc } from '@/components/KnowledgeManager'

export const metadata = { title: 'Knowledge' }
export const dynamic = 'force-dynamic'

export default async function KnowledgePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('documents')
    .select('id, title, kind, is_public, file_name, file_size, content, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const docs: Doc[] = (data ?? []).map(({ content, ...doc }) => ({
    ...doc,
    chars: content?.length ?? 0,
    preview: (content ?? '').slice(0, 240),
  }))

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-5 sm:p-8">
      <PageHeader
        title="Knowledge"
        subtitle="Everything your agents know comes from here. Upload once, both agents learn it."
      />
      <KnowledgeManager initialDocs={docs} />
    </div>
  )
}
