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

-- 7. Lead-uri (cereri trimise din calendarul public)
-- Publicul poate DOAR insera (trimite o cerere). Doar adminul autentificat le poate citi/edita/șterge.
-- Conține date personale (nume, telefon, email) → niciodată citibile de anonimi.
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  date date,
  couple text,
  location text,
  pkg text,
  notes text,
  name text,
  phone text,
  email text,
  status text not null default 'neprelucrat',
  avans_incasat boolean not null default false,
  plata_integrala boolean not null default false,
  facturat boolean not null default false,
  livrat boolean not null default false,
  contract_semnat boolean not null default false,
  data_confirmata boolean not null default false,
  recenzie_primita boolean not null default false,
  created_at timestamptz default now()
);
alter table public.leads enable row level security;

-- dacă tabelul exista deja dintr-o versiune mai veche, adaugă coloanele CRM noi
alter table public.leads add column if not exists avans_incasat boolean not null default false;
alter table public.leads add column if not exists plata_integrala boolean not null default false;
alter table public.leads add column if not exists facturat boolean not null default false;
alter table public.leads add column if not exists livrat boolean not null default false;
alter table public.leads add column if not exists contract_semnat boolean not null default false;
alter table public.leads add column if not exists data_confirmata boolean not null default false;
alter table public.leads add column if not exists recenzie_primita boolean not null default false;
alter table public.leads alter column status set default 'neprelucrat';

-- migrează statusurile vechi și pune constrângerea (pipeline-ul nou)
update public.leads set status = 'neprelucrat' where status = 'nou';
update public.leads set status = 'castigat' where status = 'convertit';
update public.leads set status = 'anulat' where status = 'respins';
alter table public.leads drop constraint if exists leads_status_check;
alter table public.leads add constraint leads_status_check
  check (status in ('neprelucrat', 'contactat', 'oferta_trimisa', 'castigat', 'anulat'));

drop policy if exists "anyone insert leads" on public.leads;
create policy "anyone insert leads" on public.leads
  for insert to anon, authenticated with check (true);

drop policy if exists "admin read leads" on public.leads;
create policy "admin read leads" on public.leads
  for select to authenticated using (true);

drop policy if exists "admin update leads" on public.leads;
create policy "admin update leads" on public.leads
  for update to authenticated using (true) with check (true);

drop policy if exists "admin delete leads" on public.leads;
create policy "admin delete leads" on public.leads
  for delete to authenticated using (true);

alter publication supabase_realtime add table public.leads;

-- 8. Portofoliu (clipuri IG/TikTok afișate pe /portofoliu și pe homepage)
-- PUBLIC poate citi; doar adminul autentificat poate scrie.
create table if not exists public.portfolio (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  caption text,
  poster text,
  sort int not null default 0,
  created_at timestamptz default now()
);
alter table public.portfolio enable row level security;
-- dacă tabelul exista deja fără coloana de copertă:
alter table public.portfolio add column if not exists poster text;

drop policy if exists "public read portfolio" on public.portfolio;
create policy "public read portfolio" on public.portfolio
  for select to anon, authenticated using (true);

drop policy if exists "admin write portfolio" on public.portfolio;
create policy "admin write portfolio" on public.portfolio
  for all to authenticated using (true) with check (true);

do $$
begin
  alter publication supabase_realtime add table public.portfolio;
exception when duplicate_object then null;
end $$;

-- 9. Storage: bucket public pentru fișierele video din portofoliu
insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do update set public = true;

drop policy if exists "public read portfolio files" on storage.objects;
create policy "public read portfolio files" on storage.objects
  for select to anon, authenticated using (bucket_id = 'portfolio');

drop policy if exists "admin write portfolio files" on storage.objects;
create policy "admin write portfolio files" on storage.objects
  for all to authenticated using (bucket_id = 'portfolio') with check (bucket_id = 'portfolio');
