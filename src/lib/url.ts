import { headers } from 'next/headers'

/**
 * The absolute origin this request came in on — used to build the card link and
 * its QR code so they work on localhost, a LAN IP (handy for demoing from a
 * phone), and production without any configuration.
 */
export async function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  }

  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')

  return `${proto}://${host}`
}

export async function getCardUrl(handle: string) {
  return `${await getBaseUrl()}/u/${handle}`
}
