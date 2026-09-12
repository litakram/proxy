/**
 * Turns an uploaded file into plain text the agent can reason over.
 * Runs server-side only (pdf-parse and mammoth are Node libraries).
 */

export const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10 MB

export const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.md', '.markdown', '.csv', '.json'] as const

export type ExtractResult = {
  text: string
  pages?: number
}

function extensionOf(fileName: string) {
  const dot = fileName.lastIndexOf('.')
  return dot === -1 ? '' : fileName.slice(dot).toLowerCase()
}

/** Collapse the ragged whitespace PDF extraction tends to produce. */
function tidy(raw: string) {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function extractPdf(buffer: Buffer): Promise<ExtractResult> {
  const { PDFParse } = await import('pdf-parse')
  const parser = new PDFParse({ data: new Uint8Array(buffer) })
  try {
    const result = await parser.getText()
    // pdf-parse appends a "-- n of m --" footer per page; strip those markers.
    const text = tidy(String(result.text ?? '').replace(/^--\s*\d+\s+of\s+\d+\s*--$/gm, ''))
    return { text, pages: result.total }
  } finally {
    await parser.destroy()
  }
}

async function extractDocx(buffer: Buffer): Promise<ExtractResult> {
  const mammoth = await import('mammoth')
  const fn = mammoth.default?.extractRawText ?? mammoth.extractRawText
  const result = await fn({ buffer })
  return { text: tidy(result.value ?? '') }
}

export async function extractText(fileName: string, buffer: Buffer): Promise<ExtractResult> {
  const ext = extensionOf(fileName)

  switch (ext) {
    case '.pdf':
      return extractPdf(buffer)
    case '.docx':
      return extractDocx(buffer)
    case '.txt':
    case '.md':
    case '.markdown':
    case '.csv':
    case '.json':
      return { text: tidy(buffer.toString('utf8')) }
    case '.doc':
      throw new Error('Legacy .doc files are not supported — re-save it as .docx or PDF.')
    default:
      throw new Error(
        `Unsupported file type "${ext || 'unknown'}". Upload a PDF, DOCX, TXT, MD, CSV, or JSON file.`
      )
  }
}

/** Guess a sensible document kind so the UI can badge it. */
export function guessKind(fileName: string) {
  return /\b(cv|resume|resumé)\b/i.test(fileName) ? 'cv' : 'document'
}

/** "my-cv-2026.pdf" -> "My Cv 2026" */
export function titleFromFileName(fileName: string) {
  const dot = fileName.lastIndexOf('.')
  const stem = dot === -1 ? fileName : fileName.slice(0, dot)
  const words = stem.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()
  if (!words) return 'Untitled'
  return words.replace(/\b\w/g, (c) => c.toUpperCase())
}
