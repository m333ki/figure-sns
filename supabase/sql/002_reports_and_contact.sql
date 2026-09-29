-- Run this in the Supabase dashboard's SQL editor (Database > SQL Editor).
-- Safe to run once; every statement is written to be idempotent.

-- 1. Generalize `reports` from posts-only to post/user/message, and record
--    who filed the report plus their free-text detail.
alter table public.reports
  add column if not exists reporter_id uuid references auth.users(id) on delete set null,
  add column if not exists target_type text not null default 'post',
  add column if not exists target_id text,
  add column if not exists detail text;

-- post_id is now null for user/message reports (only post reports set it),
-- so it can no longer be required. No-op if it's already nullable.
alter table public.reports alter column post_id drop not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'reports_target_type_check'
  ) then
    alter table public.reports
      add constraint reports_target_type_check check (target_type in ('post', 'user', 'message'));
  end if;
end $$;

-- Backfill target_id for any existing post-only rows.
update public.reports set target_id = post_id::text where target_id is null and post_id is not null;

-- Lets logged-in users file a report; adjust/replace if you already have a
-- differently-named insert policy on this table.
drop policy if exists "reports_insert_authenticated" on public.reports;
create policy "reports_insert_authenticated" on public.reports
  for insert
  to authenticated
  with check (true);

-- 2. New table for the contact/support form. Insert-only from the client,
--    same shape as `reports` -- check submissions in the Supabase table
--    editor (no SELECT policy, so end users can't read others' messages).
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  category text not null,
  email text,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

drop policy if exists "contact_messages_insert_anyone" on public.contact_messages;
create policy "contact_messages_insert_anyone" on public.contact_messages
  for insert
  to anon, authenticated
  with check (true);
