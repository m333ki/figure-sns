-- Run this in the Supabase dashboard's SQL editor (Database > SQL Editor),
-- after 005_post_affiliate_url.sql. Safe to run once; idempotent.

-- 1. Shelf case color -- one value per user, lives on profiles.
alter table public.profiles
  add column if not exists shelf_case_color text not null default 'black';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_shelf_case_color_check'
  ) then
    alter table public.profiles
      add constraint profiles_shelf_case_color_check check (shelf_case_color in ('black', 'white'));
  end if;
end $$;

-- 2. Per-row lighting color -- reuses shelf_row_titles (already one row per
--    user_id+row_index). title is made nullable so clearing it updates the
--    row instead of deleting it -- deleting would also wipe a saved
--    lighting choice for that same row.
alter table public.shelf_row_titles alter column title drop not null;
alter table public.shelf_row_titles
  add column if not exists lighting text not null default 'warm';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'shelf_row_titles_lighting_check'
  ) then
    alter table public.shelf_row_titles
      add constraint shelf_row_titles_lighting_check check (lighting in ('warm', 'cool', 'pink', 'off'));
  end if;
end $$;
