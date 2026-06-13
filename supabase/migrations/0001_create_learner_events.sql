-- Anonymous learner event logging for JAID.
-- Apply manually in the Supabase SQL editor.
-- No user accounts exist; events are tied only to a random client-side session id.

create table learner_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  event_type text not null,
  search_term text,
  category text,
  result_count integer,
  word_id integer,
  pair_matched boolean,
  created_at timestamptz not null default now()
);

-- Row Level Security: the frontend (anon key) may INSERT events but cannot read them.
-- Analytics reads are done with the service role key, which bypasses RLS.
alter table learner_events enable row level security;

create policy "Anonymous inserts allowed"
  on learner_events
  for insert
  to anon
  with check (true);

-- No SELECT / UPDATE / DELETE policy is defined for anon, so RLS denies those by
-- default. Only the service role (which bypasses RLS) can read this table.
grant insert on table learner_events to anon;
