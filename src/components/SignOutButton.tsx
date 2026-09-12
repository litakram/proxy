'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { IconLogout } from '@/components/ui/Icons'

export function SignOutButton() {
  const router = useRouter()

  return (
    <button
      onClick={async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/')
        router.refresh()
      }}
      className="nav-item w-full"
    >
      <IconLogout width={17} height={17} />
      Sign out
    </button>
  )
}
