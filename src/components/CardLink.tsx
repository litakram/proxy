import QRCode from 'qrcode'
import Link from 'next/link'
import { CopyButton } from '@/components/CopyButton'
import { IconNfc, IconArrow } from '@/components/ui/Icons'

/**
 * The thing the user actually hands out: the URL an NFC tag is written with,
 * plus a scannable QR for anyone without an NFC phone.
 */
export async function CardLink({ url, handle }: { url: string; handle: string }) {
  let qr: string | null = null
  try {
    qr = await QRCode.toDataURL(url, {
      width: 320,
      margin: 1,
      color: { dark: '#0d1117', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })
  } catch {
    qr = null
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <span className="badge-brand">
            <IconNfc width={14} height={14} />
            Your card link
          </span>

          <p className="mt-3 truncate font-mono text-sm text-ink-soft" title={url}>
            {url}
          </p>

          <p className="mt-2 text-sm text-ink-muted">
            Write this to an NFC tag, or let people scan the code. It opens your public agent — no app
            needed.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <CopyButton value={url} label="Copy link" className="btn-primary btn-sm" />
            <Link href={`/u/${handle}`} target="_blank" className="btn-secondary btn-sm">
              Preview <IconArrow width={14} height={14} />
            </Link>
          </div>
        </div>

        {qr && (
          <div className="shrink-0 self-start rounded-xl border border-line bg-canvas p-2 sm:self-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt={`QR code linking to ${url}`} width={116} height={116} className="rounded-lg" />
          </div>
        )}
      </div>
    </div>
  )
}
