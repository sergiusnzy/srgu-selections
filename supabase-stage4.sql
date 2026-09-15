-- SRGU Selections · Stage 4 recommendations inbox
-- Ruleaza o singura data in Supabase > SQL Editor.

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  yt text not null,
  title text not null default '',
  artist text not null default '',
  message text not null default '',
  status text not null default 'pending' check (status in ('pending','published','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table public.submissions enable row level security;

create index if not exists submissions_status_created_idx on public.submissions (status, created_at desc);
create index if not exists submissions_yt_idx on public.submissions (yt);

-- Nu cream politici publice pentru submissions.
-- Citirea si scrierea trec doar prin endpointurile Vercel server-side.
