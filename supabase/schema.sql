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
