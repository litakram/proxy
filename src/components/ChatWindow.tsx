'use client'

import { useEffect, useRef, useState } from 'react'
import { IconSend, IconSpark } from '@/components/ui/Icons'

type Message = { role: 'user' | 'assistant'; content: string }

export function ChatWindow({
  endpoint,
  extraBody,
  greeting,
  suggestions = [],
  avatar,
  agentName = 'Agent',
  className = '',
}: {
  endpoint: string
  extraBody?: Record<string, unknown>
  greeting?: string
  suggestions?: string[]
  avatar?: string
  agentName?: string
  className?: string
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  async function send(text?: string) {
    const content = (text ?? input).trim()
    if (!content || loading) return

    const next = [...messages, { role: 'user' as const, content }]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, ...extraBody }),
      })
      const data = await res.json()

      setMessages([
        ...next,
        {
          role: 'assistant',
          content: data.reply || `Something went wrong: ${data.error ?? 'unknown error'}`,
        },
      ])
    } catch (err) {
      setMessages([...next, { role: 'assistant', content: `Something went wrong: ${(err as Error).message}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`card flex flex-col overflow-hidden ${className}`}>
      <div ref={scrollRef} className="scroll-slim flex-1 space-y-4 overflow-y-auto p-5">
        {messages.length === 0 && (
          <div className="flex flex-col items-center py-8 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              {avatar ? (
                <span className="text-sm font-semibold">{avatar}</span>
              ) : (
                <IconSpark width={20} height={20} />
              )}
            </span>
            <p className="mt-3 max-w-sm text-sm text-ink-muted">
              {greeting ?? 'Ask me anything to get started.'}
            </p>

            {suggestions.length > 0 && (
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-line bg-canvas px-3 py-1.5 text-xs text-ink-soft transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed animate-fade-up ${
                m.role === 'user'
                  ? 'rounded-br-sm bg-brand-600 text-white'
                  : 'rounded-bl-sm bg-canvas-inset text-ink-soft'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-canvas-inset px-4 py-3">
              <span className="h-1.5 w-1.5 animate-blink rounded-full bg-ink-faint" />
              <span className="h-1.5 w-1.5 animate-blink rounded-full bg-ink-faint [animation-delay:200ms]" />
              <span className="h-1.5 w-1.5 animate-blink rounded-full bg-ink-faint [animation-delay:400ms]" />
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-line bg-canvas p-3">
        <div className="flex items-end gap-2">
          <textarea
            className="field max-h-32 min-h-[40px] flex-1 resize-none py-2.5"
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              // Enter sends, Shift+Enter makes a new line.
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            placeholder={`Message ${agentName}…`}
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="btn-primary h-10 w-10 shrink-0 p-0"
            aria-label="Send message"
          >
            <IconSend width={16} height={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
