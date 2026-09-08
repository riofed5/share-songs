-- Run this once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Safe to run more than once.

create table if not exists public.song_requests (
  id         uuid primary key default gen_random_uuid(),
  song       text not null check (char_length(btrim(song)) between 1 and 200),
  came_from  text check (came_from is null or char_length(came_from) <= 100),
  created_at timestamptz not null default now()
);

-- The admin list is ordered newest first, so index that.
create index if not exists song_requests_created_at_idx
  on public.song_requests (created_at desc);

alter table public.song_requests enable row level security;

-- One rule: anyone holding the public key may add a request.
drop policy if exists "anyone can add a song request" on public.song_requests;
drop policy if exists "customers can add a song request" on public.song_requests;
create policy "customers can add a song request"
  on public.song_requests
  as permissive
  for insert
  to anon, authenticated
  with check (true);

grant usage on schema public to anon, authenticated;
grant insert on public.song_requests to anon, authenticated;

-- There is deliberately NO select, update or delete rule for the public key.
-- Row level security denies what no rule permits, so customers cannot read,
-- change or delete the queue. The admin page reads with the service role key,
-- which bypasses these rules and is only ever used on the server.
--
-- A consequence worth knowing: an insert made with the public key cannot ask
-- the database to hand the new row back, because that would be a read. The app
-- inserts without asking for it back, which is why it works.

-- Remove the temporary helper used while diagnosing.
drop function if exists public.whoami();
