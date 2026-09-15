-- SRGU Selections · Stage 2 metadata upgrade
-- Ruleaza o singura data in Supabase > SQL Editor.

alter table public.tracks add column if not exists genre text not null default '';
alter table public.tracks add column if not exists mood text not null default '';
alter table public.tracks add column if not exists energy text not null default '';
alter table public.tracks add column if not exists origin text not null default '';
alter table public.tracks add column if not exists release_year integer;
alter table public.tracks add column if not exists tags text[] not null default '{}'::text[];
alter table public.tracks add column if not exists curator_note text not null default '';

create index if not exists tracks_created_at_idx on public.tracks (created_at desc);
create index if not exists tracks_genre_idx on public.tracks (genre);
create index if not exists tracks_mood_idx on public.tracks (mood);
create index if not exists tracks_tags_gin_idx on public.tracks using gin (tags);

-- Datele existente raman intacte; noile campuri pornesc goale.
