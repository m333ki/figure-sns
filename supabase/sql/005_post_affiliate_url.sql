-- Run this in the Supabase dashboard's SQL editor (Database > SQL Editor),
-- after 004_onboarding.sql. Safe to run once; idempotent.

-- Optional per-post "where to buy this figure" link, shown on the post
-- detail view when set (see PostComposerModal.tsx / PostDetailModal.tsx).
alter table public.posts
  add column if not exists affiliate_url text;
