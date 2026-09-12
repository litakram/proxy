import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractText, guessKind, titleFromFileName, MAX_FILE_BYTES } from '@/lib/extract'

// pdf-parse and mammoth are Node libraries, so this route cannot run on edge.
export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { data, error } = await supabase
    .from('documents')
    .select('id, title, kind, is_public, file_name, file_size, content, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send a preview rather than the whole document — the list only renders a snippet.
  const documents = (data ?? []).map(({ content, ...doc }) => ({
    ...doc,
    chars: content.length,
    preview: content.slice(0, 240),
  }))

  return NextResponse.json({ documents })
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

    const contentType = request.headers.get('content-type') ?? ''

    // ---- a typed note, not a file ----
    if (contentType.includes('application/json')) {
      const { title, content, isPublic } = await request.json()
      if (!content?.trim()) {
        return NextResponse.json({ error: 'Write something first.' }, { status: 400 })
      }

      const { data, error } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          title: title?.trim() || 'Note',
          kind: 'note',
          content: content.trim(),
          is_public: Boolean(isPublic),
        })
        .select('id, title, kind, is_public, file_name, file_size, created_at')
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ document: { ...data, chars: content.trim().length } })
    }

    // ---- an uploaded file ----
    const form = await request.formData()
    const file = form.get('file')
    const isPublic = form.get('isPublic') === 'true'

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file received.' }, { status: 400 })
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `"${file.name}" is larger than the 10 MB limit.` },
        { status: 413 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const { text, pages } = await extractText(file.name, buffer)

    if (!text.trim()) {
      return NextResponse.json(
        {
          error: `No text could be read from "${file.name}". If it is a scanned PDF, the pages are images — upload a text-based copy.`,
        },
        { status: 422 }
      )
    }

    const { data, error } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        title: titleFromFileName(file.name),
        kind: guessKind(file.name),
        content: text,
        is_public: isPublic,
        file_name: file.name,
        file_size: file.size,
      })
      .select('id, title, kind, is_public, file_name, file_size, created_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      document: { ...data, chars: text.length, preview: text.slice(0, 240) },
      pages,
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
