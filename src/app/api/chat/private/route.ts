import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chatComplete } from '@/lib/openai'
import { buildPrivateSystemPrompt, type AgentDoc } from '@/lib/profile'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
    }

    const { messages } = await request.json()
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
    }

    const [{ data: profile, error }, { data: documents }] = await Promise.all([
      supabase.from('profiles').select('full_name, public_data, private_data').eq('id', user.id).single(),
      // The private agent sees every document, public or not.
      supabase
        .from('documents')
        .select('title, kind, content')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
    ])

    if (error || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const systemPrompt = buildPrivateSystemPrompt(
      profile.full_name,
      profile.public_data ?? {},
      profile.private_data ?? {},
      (documents ?? []) as AgentDoc[]
    )

    const reply = await chatComplete(systemPrompt, messages)
    return NextResponse.json({ reply })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
