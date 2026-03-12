-- Events table
create table events (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Attendees table
create table attendees (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  email text not null,
  name text,
  joined_at timestamptz default now(),
  unique(event_id, email)
);

-- Enable realtime for attendees table
alter publication supabase_realtime add table attendees;

-- Seed a default event for MVP
insert into events (code, name) values ('KILO2024', 'Kilo Code Launch Event');
