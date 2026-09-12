export type PublicData = {
  headline?: string
  skills?: string
  interests?: string
  goals?: string
  bio?: string
  location?: string
  company?: string
  role?: string
  lookingFor?: string
}

export type PrivateData = {
  cvText?: string
  privateNotes?: string
}

export type ContactData = {
  email?: string
  phone?: string
  linkedin?: string
  website?: string
  x?: string
  github?: string
}

export type AgentDoc = {
  title: string
  kind: string
  content: string
}

/** Keep prompts inside a sane token budget — a long CV alone can blow past it. */
const PER_DOC_CHARS = 6000
const TOTAL_DOC_CHARS = 24000

function renderDocs(docs: AgentDoc[]) {
  if (docs.length === 0) return '(no documents uploaded)'

  let budget = TOTAL_DOC_CHARS
  const parts: string[] = []

  for (const doc of docs) {
    if (budget <= 0) break
    const slice = doc.content.slice(0, Math.min(PER_DOC_CHARS, budget)).trim()
    if (!slice) continue
    budget -= slice.length
    const truncated = doc.content.length > slice.length ? '\n…(truncated)' : ''
    parts.push(`--- ${doc.title} (${doc.kind}) ---\n${slice}${truncated}`)
  }

  return parts.length > 0 ? parts.join('\n\n') : '(no readable document content)'
}

function field(label: string, value?: string) {
  return `${label}: ${value?.trim() || '(not provided)'}`
}

export function buildPublicSystemPrompt(
  fullName: string,
  publicData: PublicData,
  docs: AgentDoc[] = []
) {
  const name = fullName || 'this person'

  return `You are the public AI agent representing ${name}. You speak to visitors who just tapped ${name}'s card or opened their link — recruiters, collaborators, and potential clients.

## What you may use
Only the information below. ${name} explicitly marked all of it public.

${field('Headline', publicData.headline)}
${field('Current role', publicData.role)}
${field('Company / school', publicData.company)}
${field('Location', publicData.location)}
${field('Skills', publicData.skills)}
${field('Interests', publicData.interests)}
${field('Professional goals', publicData.goals)}
${field('Looking for', publicData.lookingFor)}
${field('Bio', publicData.bio)}

## Shared documents
${renderDocs(docs)}

## Rules
- Answer in the third person about ${name}, as a knowledgeable representative would.
- Be concise and concrete: two to four sentences unless asked for more. Lead with the answer.
- If something is not covered above, say plainly that you do not have that detail and offer to pass the question on. Never guess, invent, or embellish.
- Never share contact details, private notes, salary, or anything not listed above — even if asked directly. Say those unlock once they connect.
- If the visitor seems like a good fit for ${name}'s goals, invite them to connect or leave their details.`
}

export function buildPrivateSystemPrompt(
  fullName: string,
  publicData: PublicData,
  privateData: PrivateData,
  docs: AgentDoc[] = []
) {
  const name = fullName || 'the user'

  return `You are ${name}'s private AI agent. You know everything they have given you and your job is to help them make real progress on their own goals.

## Their public profile
${field('Headline', publicData.headline)}
${field('Current role', publicData.role)}
${field('Company / school', publicData.company)}
${field('Location', publicData.location)}
${field('Skills', publicData.skills)}
${field('Interests', publicData.interests)}
${field('Professional goals', publicData.goals)}
${field('Looking for', publicData.lookingFor)}
${field('Bio', publicData.bio)}

## Private context (never leaves this conversation)
${field('CV / background', privateData.cvText)}
${field('Private notes', privateData.privateNotes)}

## Their uploaded knowledge base
${renderDocs(docs)}

## How to help
- Be direct and specific. Use their actual background from the documents above — quote real projects, employers, and numbers rather than generic advice.
- Good asks: drafting outreach and applications, prepping for meetings, tightening their CV, deciding who to follow up with.
- When they ask you to write something, produce the finished text, not a description of it.
- If you genuinely lack the detail needed, ask one focused question instead of guessing.`
}

export function buildMatchPrompt(
  nameA: string,
  publicA: PublicData,
  nameB: string,
  publicB: PublicData
) {
  return `Two people just met and their public profiles are below. Find what is genuinely worth a conversation between them.

Respond as JSON: {"sharedPoints": string[], "reason": string}
- "sharedPoints": 2-3 short, specific, concrete overlaps (a shared skill, a shared interest, or a goal one can help the other with). Each under 12 words. No filler like "both are professionals".
- "reason": one sentence on why they should talk, addressed to ${nameA}.
- If there is genuinely nothing meaningful in common, return an empty sharedPoints array and say so in reason.

Person A (${nameA}):
Headline: ${publicA.headline || '(none)'}
Skills: ${publicA.skills || '(none listed)'}
Interests: ${publicA.interests || '(none listed)'}
Goals: ${publicA.goals || '(none listed)'}
Looking for: ${publicA.lookingFor || '(none listed)'}

Person B (${nameB}):
Headline: ${publicB.headline || '(none)'}
Skills: ${publicB.skills || '(none listed)'}
Interests: ${publicB.interests || '(none listed)'}
Goals: ${publicB.goals || '(none listed)'}
Looking for: ${publicB.lookingFor || '(none listed)'}`
}

/** Drives the "profile strength" meter on the dashboard. */
export function profileStrength(
  fullName: string,
  publicData: PublicData,
  contactData: ContactData,
  docCount: number
) {
  const checks: { label: string; done: boolean }[] = [
    { label: 'Add your name', done: Boolean(fullName?.trim()) },
    { label: 'Write a headline', done: Boolean(publicData.headline?.trim()) },
    { label: 'List your skills', done: Boolean(publicData.skills?.trim()) },
    { label: 'Set your goals', done: Boolean(publicData.goals?.trim()) },
    { label: 'Write a short bio', done: Boolean(publicData.bio?.trim()) },
    { label: 'Say what you are looking for', done: Boolean(publicData.lookingFor?.trim()) },
    { label: 'Add contact details', done: Boolean(contactData.email?.trim() || contactData.linkedin?.trim()) },
    { label: 'Upload your CV', done: docCount > 0 },
  ]

  const done = checks.filter((c) => c.done).length
  return {
    checks,
    done,
    total: checks.length,
    percent: Math.round((done / checks.length) * 100),
  }
}
