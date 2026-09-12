'use client'

import { useCallback, useRef, useState, type DragEvent } from 'react'
import { useRouter } from 'next/navigation'
import {
  IconUpload,
  IconFile,
  IconTrash,
  IconGlobe,
  IconLock,
  IconPlus,
  IconCheck,
} from '@/components/ui/Icons'

export type Doc = {
  id: string
  title: string
  kind: string
  is_public: boolean
  file_name: string | null
  file_size: number | null
  chars: number
  preview: string
  created_at: string
}

const ACCEPT = '.pdf,.docx,.txt,.md,.markdown,.csv,.json'

function formatBytes(n: number | null) {
  if (!n) return null
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function kindBadge(kind: string) {
  if (kind === 'cv') return 'badge-brand'
  if (kind === 'note') return 'badge-amber'
  return 'badge-neutral'
}

export function KnowledgeManager({ initialDocs }: { initialDocs: Doc[] }) {
  const router = useRouter()
  const fileInput = useRef<HTMLInputElement>(null)

  const [docs, setDocs] = useState<Doc[]>(initialDocs)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState<string[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteBody, setNoteBody] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  const upload = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files)
      if (list.length === 0) return

      setErrors([])
      setUploading((u) => [...u, ...list.map((f) => f.name)])

      for (const file of list) {
        try {
          const body = new FormData()
          body.append('file', file)
          body.append('isPublic', 'false')

          const res = await fetch('/api/documents', { method: 'POST', body })
          const data = await res.json()

          if (!res.ok) {
            setErrors((e) => [...e, data.error ?? `Could not upload ${file.name}`])
          } else {
            setDocs((d) => [data.document, ...d])
          }
        } catch (err) {
          setErrors((e) => [...e, `${file.name}: ${(err as Error).message}`])
        } finally {
          setUploading((u) => u.filter((n) => n !== file.name))
        }
      }

      router.refresh()
    },
    [router]
  )

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files?.length) upload(e.dataTransfer.files)
  }

  async function toggleVisibility(doc: Doc) {
    const next = !doc.is_public
    setDocs((d) => d.map((x) => (x.id === doc.id ? { ...x, is_public: next } : x)))

    const res = await fetch(`/api/documents/${doc.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: next }),
    })

    if (!res.ok) {
      // Put the toggle back so the UI never claims a change that did not stick.
      setDocs((d) => d.map((x) => (x.id === doc.id ? { ...x, is_public: !next } : x)))
      setErrors((e) => [...e, `Could not update "${doc.title}".`])
      return
    }

    router.refresh()
  }

  async function remove(doc: Doc) {
    if (!confirm(`Delete "${doc.title}"? Your agents will forget it.`)) return

    const previous = docs
    setDocs((d) => d.filter((x) => x.id !== doc.id))

    const res = await fetch(`/api/documents/${doc.id}`, { method: 'DELETE' })
    if (!res.ok) {
      setDocs(previous)
      setErrors((e) => [...e, `Could not delete "${doc.title}".`])
      return
    }

    router.refresh()
  }

  async function saveNote() {
    if (!noteBody.trim()) return
    setSavingNote(true)

    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: noteTitle, content: noteBody, isPublic: false }),
    })
    const data = await res.json()
    setSavingNote(false)

    if (!res.ok) {
      setErrors((e) => [...e, data.error ?? 'Could not save the note.'])
      return
    }

    setDocs((d) => [{ ...data.document, preview: noteBody.slice(0, 240) }, ...d])
    setNoteTitle('')
    setNoteBody('')
    setNoteOpen(false)
    router.refresh()
  }

  const publicCount = docs.filter((d) => d.is_public).length

  return (
    <div className="space-y-6">
      {/* ---------- dropzone ---------- */}
      <label
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
          dragging ? 'border-brand-400 bg-brand-50' : 'border-line bg-canvas hover:border-brand-300 hover:bg-canvas-subtle'
        }`}
      >
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) upload(e.target.files)
            e.target.value = ''
          }}
        />

        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <IconUpload width={20} height={20} />
        </span>

        <p className="mt-3 text-sm font-medium text-ink">
          Drop your CV here, or <span className="text-brand-700 underline underline-offset-2">browse</span>
        </p>
        <p className="mt-1 text-xs text-ink-faint">PDF, DOCX, TXT, MD, CSV or JSON · up to 10 MB each</p>
      </label>

      {/* ---------- in-flight + errors ---------- */}
      {uploading.length > 0 && (
        <div className="space-y-2">
          {uploading.map((name) => (
            <div
              key={name}
              className="flex items-center gap-2.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2.5 text-sm text-brand-800"
            >
              <span className="h-2 w-2 animate-blink rounded-full bg-brand-600" />
              Reading <span className="font-medium">{name}</span>…
            </div>
          ))}
        </div>
      )}

      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((msg, i) => (
            <p key={i} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {msg}
            </p>
          ))}
        </div>
      )}

      {/* ---------- add a note ---------- */}
      {noteOpen ? (
        <div className="card space-y-3 p-4">
          <input
            className="field"
            placeholder="Title (e.g. Side project: real-time CV parser)"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
          />
          <textarea
            className="field"
            rows={5}
            placeholder="Anything your agent should know — a project write-up, what you are looking for, context that is not on your CV."
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
          />
          <div className="flex gap-2">
            <button onClick={saveNote} disabled={savingNote || !noteBody.trim()} className="btn-primary btn-sm">
              {savingNote ? 'Saving…' : 'Save note'}
            </button>
            <button onClick={() => setNoteOpen(false)} className="btn-ghost btn-sm">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setNoteOpen(true)} className="btn-secondary btn-sm">
          <IconPlus width={14} height={14} />
          Write a note instead
        </button>
      )}

      {/* ---------- document list ---------- */}
      <div>
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h2 className="section-title">
            Knowledge base{' '}
            <span className="font-normal text-ink-faint">
              · {docs.length} {docs.length === 1 ? 'item' : 'items'}
            </span>
          </h2>
          {docs.length > 0 && (
            <span className="hint">
              {publicCount} shared with your public agent
            </span>
          )}
        </div>

        {docs.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-faint">
            Nothing uploaded yet. Your agents have nothing to work with.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {docs.map((doc) => (
              <li key={doc.id} className="flex items-start gap-3 py-4">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-canvas-inset text-ink-muted">
                  <IconFile width={16} height={16} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium text-ink">{doc.title}</p>
                    <span className={kindBadge(doc.kind)}>{doc.kind}</span>
                  </div>

                  <p className="mt-0.5 text-xs text-ink-faint">
                    {[
                      doc.file_name,
                      formatBytes(doc.file_size),
                      `${doc.chars.toLocaleString()} characters read`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>

                  {doc.preview && (
                    <p className="mt-2 line-clamp-2 rounded-lg bg-canvas-inset px-3 py-2 text-xs leading-relaxed text-ink-muted">
                      {doc.preview}…
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => toggleVisibility(doc)}
                    title={
                      doc.is_public
                        ? 'Public — your public agent can quote this'
                        : 'Private — only your own agent sees this'
                    }
                    className={`btn btn-sm gap-1.5 ${
                      doc.is_public
                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'border border-line bg-canvas text-ink-muted hover:bg-canvas-inset'
                    }`}
                  >
                    {doc.is_public ? <IconGlobe width={13} height={13} /> : <IconLock width={13} height={13} />}
                    {doc.is_public ? 'Public' : 'Private'}
                  </button>

                  <button onClick={() => remove(doc)} className="btn-danger btn-sm" aria-label={`Delete ${doc.title}`}>
                    <IconTrash width={14} height={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {publicCount > 0 && (
        <p className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
          <IconCheck width={15} height={15} />
          {publicCount} {publicCount === 1 ? 'document is' : 'documents are'} available to your public agent.
          Everything else stays private.
        </p>
      )}
    </div>
  )
}
