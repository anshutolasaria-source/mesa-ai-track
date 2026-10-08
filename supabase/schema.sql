-- Group Trip Planner: run this once in Supabase (SQL Editor -> New query -> paste -> Run).

create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
    check (name in ('Riya', 'Siddharth', 'Karan', 'Aisha', 'Preethi')),
  budget integer not null check (budget > 0),
  available_from date not null,
  available_to date not null,
  trip_types text[] not null default '{}',
  no_go text[] not null default '{}',
  updated_at timestamptz not null default now(),
  check (available_to >= available_from)
);

-- The app has no logins, so anyone with the link can read, add and edit answers.
alter table public.responses enable row level security;

drop policy if exists "Anyone can read responses" on public.responses;
create policy "Anyone can read responses"
  on public.responses for select to anon using (true);

drop policy if exists "Anyone can add a response" on public.responses;
create policy "Anyone can add a response"
  on public.responses for insert to anon with check (true);

drop policy if exists "Anyone can edit a response" on public.responses;
create policy "Anyone can edit a response"
  on public.responses for update to anon using (true) with check (true);

-- Lets the "Start over" button on the results page wipe all answers.
drop policy if exists "Anyone can clear responses" on public.responses;
create policy "Anyone can clear responses"
  on public.responses for delete to anon using (true);
