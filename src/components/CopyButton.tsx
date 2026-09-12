'use client'

import { useState } from 'react'
import { IconCopy, IconCheck } from '@/components/ui/Icons'

export function CopyButton({
  value,
  label = 'Copy',
  className = 'btn-secondary btn-sm',
}: {
  value: string
  label?: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // Clipboard API needs a secure context; fall back to a temporary textarea.
      const el = document.createElement('textarea')
      el.value = value
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <button type="button" onClick={copy} className={className}>
      {copied ? <IconCheck width={14} height={14} /> : <IconCopy width={14} height={14} />}
      {copied ? 'Copied' : label}
    </button>
  )
}
