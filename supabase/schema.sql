-- Scheidingsbuddy: profielen bij het inloggen met een code.
-- Plakken in Supabase → SQL Editor → Run. Eenmalig.
-- Bewust minimaal: op de server staan alleen e-mailadres (in auth.users) en naam.
-- Check-ins, taken en financiën blijven op het toestel van de gebruiker.

create table if not exists public.profielen (
  id          uuid primary key references auth.users (id) on delete cascade,
  naam        text check (char_length(naam) <= 80),
  aangemaakt  timestamptz not null default now()
);

alter table public.profielen enable row level security;

-- Iedereen ziet en wijzigt alleen het eigen profiel.
drop policy if exists "eigen profiel lezen" on public.profielen;
create policy "eigen profiel lezen" on public.profielen
  for select to authenticated using (auth.uid() = id);

drop policy if exists "eigen profiel aanmaken" on public.profielen;
create policy "eigen profiel aanmaken" on public.profielen
  for insert to authenticated with check (auth.uid() = id);

drop policy if exists "eigen profiel wijzigen" on public.profielen;
create policy "eigen profiel wijzigen" on public.profielen
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Account verwijderen vanuit de app (AVG): wist het eigen account, het profiel gaat mee (cascade).
create or replace function public.verwijder_mijn_account()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = auth.uid();
$$;

revoke all on function public.verwijder_mijn_account() from public, anon;
grant execute on function public.verwijder_mijn_account() to authenticated;

-- ---------------------------------------------------------------------------
-- Gegevens op elk toestel (toegevoegd 24 november 2026).
-- Eén rij per gebruiker met ALLE app-gegevens, in de browser versleuteld (AES-GCM).
-- De sleutel staat niet in Supabase maar komt van /api/sleutel (Vercel, SYNC_SECRET).

create table if not exists public.gegevens (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  inhoud      text not null,   -- versleuteld, base64
  iv          text not null,   -- base64
  bijgewerkt  timestamptz not null default now()
);

alter table public.gegevens enable row level security;

drop policy if exists "eigen gegevens lezen" on public.gegevens;
create policy "eigen gegevens lezen" on public.gegevens
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "eigen gegevens aanmaken" on public.gegevens;
create policy "eigen gegevens aanmaken" on public.gegevens
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "eigen gegevens wijzigen" on public.gegevens;
create policy "eigen gegevens wijzigen" on public.gegevens
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.zet_bijgewerkt()
returns trigger language plpgsql set search_path = '' as $$
begin new.bijgewerkt := now(); return new; end; $$;

drop trigger if exists gegevens_bijgewerkt on public.gegevens;
create trigger gegevens_bijgewerkt before update on public.gegevens
  for each row execute function public.zet_bijgewerkt();
