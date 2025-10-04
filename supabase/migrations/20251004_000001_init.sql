-- Supabase migration: initial schema for BassBase
-- 2025-10-04

-- Use pgcrypto for gen_random_uuid
create extension if not exists pgcrypto;

create table if not exists rooms(
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table if not exists transport(
  room_id uuid primary key references rooms(id) on delete cascade,
  bpm int not null default 90,
  key_root text not null default 'C',
  scale_mode text not null default 'ionian',
  bar_start timestamptz not null default now(),
  is_playing boolean not null default true,
  updated_at timestamptz default now()
);

create table if not exists progression(
  room_id uuid references rooms(id) on delete cascade,
  bar int not null,
  rn text not null,
  duration_bars int not null default 1,
  primary key(room_id, bar)
);

create table if not exists instrument_params(
  room_id uuid references rooms(id) on delete cascade,
  instrument text not null check (instrument in ('bass','drums','harmony','melody')),
  params jsonb not null,
  updated_at timestamptz default now(),
  primary key(room_id, instrument)
);

alter table rooms enable row level security;
alter table transport enable row level security;
alter table progression enable row level security;
alter table instrument_params enable row level security;

-- Demo-time policies (loose). Tighten after hackathon.
create policy anon_select_rooms on rooms for select using (true);
create policy anon_insert_rooms on rooms for insert with check (true);
create policy anon_all_transport on transport for all using (true) with check (true);
create policy anon_all_progression on progression for all using (true) with check (true);
create policy anon_all_params on instrument_params for all using (true) with check (true);
