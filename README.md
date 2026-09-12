# Proxy — your agent stands in for you

One profile, two agents:

- a **private agent** that reads everything you upload (CV, portfolio, notes) and helps you act on it
- a **public agent** anyone can talk to when they tap your NFC card — answering only from what you marked public

Plus the handshake: when two members meet, their agents compare profiles, surface what they
actually have in common, and swap contact details on one tap.

---

## Setup

### 1. Environment

`.env` in the project root needs three values:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
OPENAI_API_KEY=<your key>
```

The first two come from Supabase → Project Settings → API.

### 2. Database — required, nothing works without it

Open **Supabase → SQL Editor → New query**, paste all of [`supabase/schema.sql`](supabase/schema.sql),
and hit **Run**. The script is idempotent, so re-running it is safe.

Then in **Authentication → Providers → Email**, turn **off** "Confirm email" so signups work
instantly during a demo.

> Not sure if it worked? Run the app and open **http://localhost:3000/setup** — it checks your
> credentials, your OpenAI key, and every required table, and hands you the SQL with a copy button
> and a direct link to your project's SQL editor.

### 3. Run

```bash
npm install
npm run dev
```

---

## What the schema creates

| Object | Purpose |
| --- | --- |
| `profiles` | Identity, plus `public_data` / `private_data` / `contact_data` as separate JSON columns |
| `public_profiles` (view) | The only profile columns anonymous visitors can read — `contact_data` is excluded |
| `documents` | Extracted text from uploads, each flagged public or private |
| `public_documents` (view) | Filtered to `is_public` — the entire source the public agent may quote |
| `connections` | A mutual link between two members, with the AI-generated shared points |
| `my_contacts()` | `security definer` function that releases a counterparty's contact details **only** to someone actually connected to them |
| `manual_contacts` | People you met who are not on Proxy yet |
| `messages` | Member-to-member messages |
| `leads` | Details left by logged-out visitors who talked to your public agent |

Row Level Security is on for every table, so the privacy boundary is enforced in the database
rather than in application code.

---

## Demo script

1. **Sign up** as user A, land on the dashboard.
2. **Knowledge** → drop in a real CV (PDF or DOCX). The text is extracted server-side and the
   character count appears — the agent now knows it.
3. Flip one document to **Public**. Leave the CV private.
4. **Settings** → fill in headline, skills, goals, "looking for", and contact details. Save.
5. **Your agent** → ask "summarise my CV in three bullets". It answers from the uploaded file.
6. Copy your **card link** from Overview (or scan the QR with a phone on the same network).
7. Open the link in an **incognito window**: the public agent answers about your public material,
   and refuses to reveal contact details or anything private. Leave your details as a lead.
8. Sign up as user B in that window, revisit A's link → the agents compare notes, show shared
   points, and **Connect** swaps contact details.
9. Check **Network** on both accounts: each sees the other with contact details unlocked, the
   reason they matched, and a message box.

A real NFC tag just needs to be written with the card URL — no app code changes.

---

## Notes

- File extraction handles PDF, DOCX, TXT, MD, CSV and JSON, up to 10 MB. Scanned (image-only) PDFs
  have no text layer and are rejected with a message saying so.
- Document text is truncated to a token budget before it reaches the model, so a long CV cannot
  blow up the prompt.
- `NEXT_PUBLIC_SITE_URL` is optional; the card link and QR are otherwise built from the incoming
  request host, so a LAN IP works for phone demos out of the box.
