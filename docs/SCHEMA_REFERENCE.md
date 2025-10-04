# Database Schema Reference

The canonical schema is in `supabase/migrations/20251004_000001_init.sql`.

Tables
- `rooms(id uuid pk, name text, created_at timestamptz)`
- `transport(room_id uuid pk, bpm int, key_root text, scale_mode text, bar_start timestamptz, is_playing boolean, updated_at timestamptz)`
- `progression(room_id uuid, bar int, rn text, duration_bars int, primary key(room_id, bar))`
- `instrument_params(room_id uuid, instrument text, params jsonb, updated_at timestamptz, primary key(room_id,instrument))`

RLS: enabled on all. Demo-time policy allows anon read/write.
