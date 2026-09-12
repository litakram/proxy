import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chatJSON } from '@/lib/openai'
import { buildMatchPrompt } from '@/lib/profile'

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

    const { ownerHandle } = await request.json()
    if (!ownerHandle) {
      return NextResponse.json({ error: 'Missing ownerHandle' }, { status: 400 })
    }

    const [{ data: owner }, { data: visitor }] = await Promise.all([
      supabase.from('public_profiles').select('id, full_name, public_data').eq('handle', ownerHandle).single(),
      supabase.from('profiles').select('id, full_name, public_data').eq('id', user.id).single(),
    ])

    if (!owner) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }
    if (owner.id === user.id) {
      return NextResponse.json({ isSelf: true, sharedPoints: [], reason: '' })
    }

    // connections stores the pair in sorted order, so sort before looking it up.
    const [userA, userB] = [user.id, owner.id].sort()
    const { data: existing } = await supabase
      .from('connections')
      .select('id')
      .eq('user_a', userA)
      .eq('user_b', userB)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({
        ownerId: owner.id,
        alreadyConnected: true,
        sharedPoints: [],
        reason: '',
      })
    }

    const prompt = buildMatchPrompt(
      visitor?.full_name ?? 'Visitor',
      visitor?.public_data ?? {},
      owner.full_name,
      owner.public_data ?? {}
    )

    let sharedPoints: string[] = []
    let reason = ''

    try {
      const result = await chatJSON(prompt)
      sharedPoints = Array.isArray(result.sharedPoints) ? (result.sharedPoints as string[]) : []
      reason = typeof result.reason === 'string' ? result.reason : ''
    } catch {
      // A matching failure should never block the connect button — that is the
      // action that actually matters here.
      reason = 'Connect to swap contact details.'
    }

    return NextResponse.json({
      ownerId: owner.id,
      alreadyConnected: false,
      sharedPoints,
      reason: reason || 'Connect to swap contact details.',
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
