-- the bride feed — schema Supabase pentru calendarul de disponibilitate
-- Rulează tot în Supabase → SQL Editor → New query → Run.

-- 1. Rezervările complete (DOAR adminul autentificat le poate vedea/edita)
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  date date unique not null,
  couple text,
  location text,
  pkg text,
  notes text,
  created_at timestamptz default now()
);

-- 2. Datele ocupate (PUBLIC — conține DOAR data, fără nume/locație/observații)
create table if not exists public.availability_dates (
  date date primary key
);

-- 3. Ține availability_dates sincron cu bookings (automat)
create or replace function public.sync_availability()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'DELETE') then
    delete from public.availability_dates where date = old.date;
    return old;
  elsif (tg_op = 'UPDATE') then
    if (new.date <> old.date) then
      delete from public.availability_dates where date = old.date;
    end if;
    insert into public.availability_dates(date) values (new.date) on conflict do nothing;
    return new;
  else
    insert into public.availability_dates(date) values (new.date) on conflict do nothing;
    return new;
  end if;
end;
$$;

drop trigger if exists trg_sync_availability on public.bookings;
create trigger trg_sync_availability
after insert or update or delete on public.bookings
for each row execute function public.sync_availability();

-- 4. Row Level Security
alter table public.bookings enable row level security;
alter table public.availability_dates enable row level security;

-- bookings: doar utilizatorii autentificați (adminul)
drop policy if exists "admin all bookings" on public.bookings;
create policy "admin all bookings" on public.bookings
  for all to authenticated using (true) with check (true);

-- availability_dates: oricine poate citi; doar adminul poate scrie
drop policy if exists "public read availability" on public.availability_dates;
create policy "public read availability" on public.availability_dates
  for select to anon, authenticated using (true);

drop policy if exists "admin write availability" on public.availability_dates;
create policy "admin write availability" on public.availability_dates
  for all to authenticated using (true) with check (true);

-- 5. Realtime (dacă dă eroare „already member", ignoră — e deja adăugat)
alter publication supabase_realtime add table public.availability_dates;
alter publication supabase_realtime add table public.bookings;

-- 6. Analytics: vizite pe site + click-uri pe WhatsApp (numărate pentru dashboard-ul din /admin)
create table if not exists public.events (
  id bigint generated always as identity primary key,
  type text not null check (type in ('view', 'wa_click')),
  path text,
  created_at timestamptz default now()
);
alter table public.events enable row level security;

-- oricine poate înregistra un eveniment (doar INSERT), dar NIMENI anonim nu le poate citi
drop policy if exists "anyone insert events" on public.events;
create policy "anyone insert events" on public.events
  for insert to anon, authenticated with check (true);

drop policy if exists "admin read events" on public.events;
create policy "admin read events" on public.events
  for select to authenticated using (true);
