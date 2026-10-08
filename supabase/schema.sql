-- Group Trip Planner: run this once in Supabase (SQL Editor -> New query -> paste -> Run).

create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  -- Any name is allowed; it is unique so answering again replaces that person's row.
  name text not null unique check (length(trim(name)) between 1 and 40),
  budget integer not null check (budget > 0),
  available_from date not null,
  available_to date not null,
  trip_types text[] not null default '{}',
  no_go text[] not null default '{}',
  updated_at timestamptz not null default now(),
  check (available_to >= available_from)
);

-- If the table was created by an earlier version that only allowed the five
-- original names, drop that restriction (harmless to run on a fresh table):
alter table public.responses drop constraint if exists responses_name_check;

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

-- No delete policy on purpose: the "Start over" button clears answers by
-- stamping them with a far-past updated_at, which the edit policy above allows.
