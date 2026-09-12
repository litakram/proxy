import { createClient } from '@/lib/supabase/server'

export const hasOpenAIEnv = Boolean(process.env.OPENAI_API_KEY)

/** Tables the app cannot run without. */
const REQUIRED_TABLES = ['profiles', 'documents', 'connections', 'manual_contacts', 'messages', 'leads'] as const

/**
 * PostgREST reports an un-migrated database as a missing relation rather than a
 * connection failure, so we detect that specific shape and route the user to
 * /setup instead of showing a generic error.
 */
function isMissingRelation(error: { code?: string; message?: string } | null) {
  if (!error) return false
  return (
    error.code === 'PGRST205' ||
    error.code === '42P01' ||
    /does not exist|could not find the table/i.test(error.message ?? '')
  )
}

export type DatabaseStatus = {
  ready: boolean
  missingTables: string[]
}

export async function checkDatabase(): Promise<DatabaseStatus> {
  const supabase = await createClient()

  // A real GET, not a HEAD: HEAD responses carry no body, so PostgREST's error
  // code never reaches us and a missing table looks like success.
  const results = await Promise.all(
    REQUIRED_TABLES.map(async (table) => {
      const { error } = await supabase.from(table).select('id').limit(1)
      return { table, missing: isMissingRelation(error) }
    })
  )

  const missingTables = results.filter((r) => r.missing).map((r) => r.table)
  return { ready: missingTables.length === 0, missingTables }
}

/**
 * The signup trigger creates a profile row, but a user who signed up before the
 * schema was applied will not have one. Create it on demand so nobody gets
 * stranded on a dead dashboard.
 */
export async function ensureProfile(userId: string, email?: string, fullName?: string) {
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('profiles')
    .select('id, handle, full_name, public_data, private_data, contact_data')
    .eq('id', userId)
    .maybeSingle()

  if (existing) return existing

  const base =
    (email ?? '').split('@')[0]?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() ||
    `user${userId.replace(/-/g, '').slice(0, 8)}`

  // Handles are unique; if the readable one is taken, fall back to an id-based
  // handle which cannot collide.
  for (const handle of [base, `${base}${userId.slice(0, 4)}`]) {
    const { data, error } = await supabase
      .from('profiles')
      .insert({ id: userId, handle, full_name: fullName ?? '' })
      .select('id, handle, full_name, public_data, private_data, contact_data')
      .single()

    if (!error && data) return data
  }

  return null
}
