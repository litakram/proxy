import OpenAI from 'openai'

type ChatMessage = { role: 'user' | 'assistant'; content: string }

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set — add it to .env.local and restart the dev server')
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

export async function chatComplete(systemPrompt: string, messages: ChatMessage[]) {
  const client = getClient()
  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    temperature: 0.6,
  })
  return completion.choices[0]?.message?.content ?? ''
}

export async function chatJSON(prompt: string): Promise<Record<string, unknown>> {
  const client = getClient()
  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.4,
  })
  const text = completion.choices[0]?.message?.content ?? '{}'
  try {
    return JSON.parse(text)
  } catch {
    return {}
  }
}
