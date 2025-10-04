# BassBase Additions

This bundle adds:
- Supabase migration schema in `supabase/migrations/20251004_000001_init.sql`
- Seed SQL in `supabase/seed.sql`
- Realtime channel helpers in `app/realtime/channels.ts`
- Event contracts with Zod in `app/realtime/contracts.ts`
- Web Audio scheduler and instrument stubs
- Human-readable docs for channels, contracts, and schema
- Runner prompt for Claude in `.claude/CLAUDE_PROMPT.md`
- `.env.example` for local dev

## How to use
1. Unzip into your project root (it creates a `BassBase_additions/` folder).
2. Move the files into place or merge directories.
3. Run Supabase locally and apply migration:
   ```bash
   supabase start
   supabase db reset
   psql "$DB_URL" -f supabase/seed.sql # optional seed
   ```
4. Set env vars from `.env.example`.
5. Open `.claude/CLAUDE_PROMPT.md` in Claude Code and say: **"Use this prompt and the docs in /docs to implement MUST_HAVE."**
