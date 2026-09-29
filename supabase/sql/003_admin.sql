-- Run this in the Supabase dashboard's SQL editor, after 002_reports_and_contact.sql.
-- Safe to run once; every statement is written to be idempotent.

-- 1. Admin flag on profiles.
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- 2. Let admins (and only admins) read every report / contact message --
--    the existing policies only allow inserting, not reading.
drop policy if exists "reports_select_admin" on public.reports;
create policy "reports_select_admin" on public.reports
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.user_id = auth.uid() and profiles.is_admin
    )
  );

drop policy if exists "contact_messages_select_admin" on public.contact_messages;
create policy "contact_messages_select_admin" on public.contact_messages
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.user_id = auth.uid() and profiles.is_admin
    )
  );

-- 3. Let admins delete any post (on top of whatever policy already lets an
--    author delete their own).
drop policy if exists "posts_delete_admin" on public.posts;
create policy "posts_delete_admin" on public.posts
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.user_id = auth.uid() and profiles.is_admin
    )
  );

-- 4. Finally, mark your own account as admin. Find your user id first:
--   select id, email from auth.users;
-- then run (with your real id):
--   update public.profiles set is_admin = true where user_id = '<paste-your-uuid-here>';
