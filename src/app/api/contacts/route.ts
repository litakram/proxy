import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/** Manually added contacts — people you met who are not on Proxy yet. */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

    const { fullName, role, email, phone, link, note } = await request.json()

    if (!fullName?.trim()) {
      return NextResponse.json({ error: 'A name is required.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('manual_contacts')
      .insert({
        user_id: user.id,
        full_name: fullName.trim(),
        role: role?.trim() || null,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        link: link?.trim() || null,
        note: note?.trim() || null,
      })
      .select('id, full_name, role, email, phone, link, note, created_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ contact: data })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
