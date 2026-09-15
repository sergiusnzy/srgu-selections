create extension if not exists pgcrypto;

create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  yt text not null unique,
  title text not null,
  artist text not null default '',
  views text not null default '',
  own boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.site_config (
  id text primary key,
  ad_active boolean not null default false,
  ad_title text not null default '',
  ad_desc text not null default '',
  ad_img text not null default '',
  ad_url text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.site_config (id) values ('main') on conflict (id) do nothing;

alter table public.tracks enable row level security;
alter table public.site_config enable row level security;

drop policy if exists "Public can read tracks" on public.tracks;
create policy "Public can read tracks" on public.tracks for select to anon, authenticated using (true);

drop policy if exists "Public can read site config" on public.site_config;
create policy "Public can read site config" on public.site_config for select to anon, authenticated using (true);
