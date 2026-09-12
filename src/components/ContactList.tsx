'use client'

import { useState } from 'react'

type Contact = {
  connectionId: string
  id: string
  handle: string
  full_name: string
  sharedPoints: string[]
}

export function ContactList({ contacts }: { contacts: Contact[] }) {
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [sent, setSent] = useState<Record<string, boolean>>({})

  async function sendTo(contact: Contact) {
    const content = drafts[contact.id]?.trim()
    if (!content) return
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionId: contact.connectionId, toUser: contact.id, content }),
    })
    setDrafts((d) => ({ ...d, [contact.id]: '' }))
    setSent((s) => ({ ...s, [contact.id]: true }))
    setTimeout(() => setSent((s) => ({ ...s, [contact.id]: false })), 2000)
  }

  if (contacts.length === 0) {
    return <p className="text-sm text-gray-400">No contacts yet — share your card link with someone to connect.</p>
  }

  return (
    <div className="space-y-3">
      {contacts.map((c) => (
        <div key={c.id} className="border rounded-lg p-3">
          <p className="font-medium text-sm">{c.full_name || c.handle}</p>
          {c.sharedPoints.length > 0 && (
            <p className="text-xs text-gray-500 mb-2">{c.sharedPoints.join(' · ')}</p>
          )}
          <div className="flex gap-2 mt-2">
            <input
              className="flex-1 border rounded-md px-2 py-1 text-sm"
              placeholder={`Message ${c.full_name || c.handle}…`}
              value={drafts[c.id] ?? ''}
              onChange={(e) => setDrafts((d) => ({ ...d, [c.id]: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && sendTo(c)}
            />
            <button onClick={() => sendTo(c)} className="text-sm bg-gray-800 text-white px-3 py-1 rounded-md">
              {sent[c.id] ? 'Sent!' : 'Send'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
