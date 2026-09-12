import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * A visitor talked to someone's public agent and wants to be contacted back.
 * Deliberately open to logged-out visitors — that is the whole point of a card
 * you hand to a stranger.
 */
export async function POST(request: Request) {
  try {
    const { handle, name, email, message } = await request.json()

    if (!handle) return NextResponse.json({ error: 'Missing handle' }, { status: 400 })
    if (!email?.trim() && !message?.trim()) {
      return NextResponse.json({ error: 'Leave an email or a message.' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: owner } = await supabase
      .from('public_profiles')
      .select('id')
      .eq('handle', handle)
      .single()

    if (!owner) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const { error } = await supabase.from('leads').insert({
      owner_id: owner.id,
      name: name?.trim() || null,
      email: email?.trim() || null,
      message: message?.trim() || null,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
