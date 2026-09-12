import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
    }

    const { ownerId, sharedPoints } = await request.json()
    if (!ownerId) {
      return NextResponse.json({ error: 'Missing ownerId' }, { status: 400 })
    }
    if (ownerId === user.id) {
      return NextResponse.json({ error: 'Cannot connect to yourself' }, { status: 400 })
    }

    const [user_a, user_b] = [user.id, ownerId].sort()

    const { error } = await supabase
      .from('connections')
      .upsert({ user_a, user_b, shared_points: sharedPoints ?? [], status: 'accepted' }, { onConflict: 'user_a,user_b' })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
