# Development Workflow

## Language conventions

- Cursor/agent prompts: **English**.
- Conversation with the product owner/user: **Portuguese**.
- Code, comments, docs and commit messages: English.

## PR rules

- This repository starts with one intentionally large foundation PR. After it,
  **one PR at a time**, small and focused.
- All PRs are opened as **drafts**.
- **No automatic merges.** A human reviews and merges.
- PR descriptions must state: migrations yes/no, new env vars yes/no, security
  impact, and rollback notes.

## Required validation before pushing

```bash
npm run lint
npm test          # if tests exist (they do)
npm run build
npm audit
npm audit --omit=dev
```

If a command fails and cannot reasonably be fixed in the same PR, document the
failure and the follow-up plan in the PR body.

## Local development

1. `cp .env.example .env.local` and fill in the Supabase values.
2. Apply migrations in `supabase/migrations/` (CLI `supabase db push`, or paste
   into the Supabase SQL editor in order).
3. Optionally apply `supabase/seed.sql` for the Demo Brunch restaurant.
4. `npm install && npm run dev`.

See `docs/testing/smoke-test.md` for the full end-to-end checklist, including
how to create the first platform admin.

## Database changes

- Schema changes are made through new files in `supabase/migrations/` —
  never edit an applied migration.
- Every new table must ship with RLS enabled and policies in the same migration.
- Re-read `docs/security/guardrails.md` whenever touching data access.
