import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chatComplete } from '@/lib/openai'
import { buildPublicSystemPrompt, type AgentDoc } from '@/lib/profile'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const { handle, messages } = await request.json()
    if (!handle) {
      return NextResponse.json({ error: 'Missing handle' }, { status: 400 })
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: profile, error } = await supabase
      .from('public_profiles')
      .select('id, full_name, public_data')
      .eq('handle', handle)
      .single()

    if (error || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // public_documents is a view filtered to is_public, so a private document
    // cannot reach this prompt even if the query were wrong.
    const { data: documents } = await supabase
      .from('public_documents')
      .select('title, kind, content')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })

    const systemPrompt = buildPublicSystemPrompt(
      profile.full_name,
      profile.public_data ?? {},
      (documents ?? []) as AgentDoc[]
    )

    const reply = await chatComplete(systemPrompt, messages)
    return NextResponse.json({ reply })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
