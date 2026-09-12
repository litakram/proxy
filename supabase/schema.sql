-- =============================================================================
-- Proxy — full database schema
-- Run this ONCE in your Supabase project: Project > SQL Editor > New query >
-- paste this whole file > Run.  It is idempotent: re-running it is safe.
-- =============================================================================

-- ============================================================
-- profiles
-- ============================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text unique not null,
  full_name text not null default '',
  public_data jsonb not null default '{}'::jsonb,
  private_data jsonb not null default '{}'::jsonb,
  contact_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Added after the first release; safe no-op on a fresh install.
alter table profiles add column if not exists contact_data jsonb not null default '{}'::jsonb;

alter table profiles enable row level security;

drop policy if exists "Owners manage their own profile" on profiles;
create policy "Owners manage their own profile"
  on profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Views run with the privileges of the view's creator, not the caller, so this
-- safely exposes only non-sensitive columns to anonymous visitors without
-- needing a service-role key anywhere in the app. contact_data is deliberately
-- NOT here: contact details are only released through my_contacts(), after a
-- connection exists.
create or replace view public_profiles as
  select id, handle, full_name, public_data
  from profiles;

grant select on public_profiles to anon, authenticated;

-- Auto-create a profile row whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  base_handle text;
  final_handle text;
  suffix int := 0;
begin
  -- Prefer a readable handle derived from the email local-part, falling back to
  -- the user id. Strip anything that is not url-safe.
  base_handle := lower(regexp_replace(split_part(coalesce(new.email, ''), '@', 1), '[^a-zA-Z0-9]', '', 'g'));

  if base_handle is null or length(base_handle) < 3 then
    base_handle := 'user' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  final_handle := base_handle;
  while exists (select 1 from public.profiles p where p.handle = final_handle) loop
    suffix := suffix + 1;
    final_handle := base_handle || suffix::text;
  end loop;

  insert into public.profiles (id, handle, full_name)
  values (new.id, final_handle, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: give a profile to anyone who signed up before this script ran.
insert into public.profiles (id, handle, full_name)
select u.id,
       'user' || substr(replace(u.id::text, '-', ''), 1, 8),
       coalesce(u.raw_user_meta_data->>'full_name', '')
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

-- ============================================================
-- documents — the knowledge base each agent answers from
-- ============================================================
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled',
  kind text not null default 'document',   -- cv | document | note | link
  content text not null default '',
  is_public boolean not null default false,
  file_name text,
  file_size integer,
  created_at timestamptz not null default now()
);

create index if not exists documents_user_idx on documents (user_id, created_at desc);

alter table documents enable row level security;

drop policy if exists "Owners manage their own documents" on documents;
create policy "Owners manage their own documents"
  on documents for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Only documents explicitly flagged public are readable by visitors. This is
-- the entire source the public agent is allowed to answer from.
create or replace view public_documents as
  select id, user_id, title, kind, content, created_at
  from documents
  where is_public;

grant select on public_documents to anon, authenticated;

-- ============================================================
-- connections (created when two agents meet and confirm)
-- ============================================================
create table if not exists connections (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references auth.users(id) on delete cascade,
  user_b uuid not null references auth.users(id) on delete cascade,
  shared_points jsonb not null default '[]'::jsonb,
  status text not null default 'accepted',
  created_at timestamptz not null default now(),
  constraint different_users check (user_a <> user_b),
  constraint ordered_pair check (user_a < user_b)
);

create unique index if not exists connections_pair_unique on connections (user_a, user_b);

alter table connections enable row level security;

drop policy if exists "Participants can view their connections" on connections;
create policy "Participants can view their connections"
  on connections for select
  using (auth.uid() = user_a or auth.uid() = user_b);

drop policy if exists "Participants can create connections" on connections;
create policy "Participants can create connections"
  on connections for insert
  with check (auth.uid() = user_a or auth.uid() = user_b);

drop policy if exists "Participants can update their connections" on connections;
create policy "Participants can update their connections"
  on connections for update
  using (auth.uid() = user_a or auth.uid() = user_b)
  with check (auth.uid() = user_a or auth.uid() = user_b);

drop policy if exists "Participants can remove their connections" on connections;
create policy "Participants can remove their connections"
  on connections for delete
  using (auth.uid() = user_a or auth.uid() = user_b);

-- One call returning every contact plus the contact details the connection
-- unlocked. security definer so it can read the counterparty's contact_data,
-- but it only ever returns rows where the caller is a participant.
create or replace function public.my_contacts()
returns table (
  connection_id uuid,
  contact_id uuid,
  handle text,
  full_name text,
  public_data jsonb,
  contact_data jsonb,
  shared_points jsonb,
  connected_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select c.id,
         p.id,
         p.handle,
         p.full_name,
         p.public_data,
         p.contact_data,
         c.shared_points,
         c.created_at
  from connections c
  join profiles p
    on p.id = (case when c.user_a = auth.uid() then c.user_b else c.user_a end)
  where auth.uid() in (c.user_a, c.user_b)
  order by c.created_at desc;
$$;

grant execute on function public.my_contacts() to authenticated;

-- ============================================================
-- manual_contacts — people you met who are not on Proxy yet
-- ============================================================
create table if not exists manual_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text,
  email text,
  phone text,
  link text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists manual_contacts_user_idx on manual_contacts (user_id, created_at desc);

alter table manual_contacts enable row level security;

drop policy if exists "Owners manage their own manual contacts" on manual_contacts;
create policy "Owners manage their own manual contacts"
  on manual_contacts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- messages (agent-relayed messages between connected contacts)
-- ============================================================
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references connections(id) on delete cascade,
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists messages_to_idx on messages (to_user, created_at desc);

alter table messages enable row level security;

drop policy if exists "Participants can view their messages" on messages;
create policy "Participants can view their messages"
  on messages for select
  using (auth.uid() = from_user or auth.uid() = to_user);

drop policy if exists "Users can send messages as themselves" on messages;
create policy "Users can send messages as themselves"
  on messages for insert
  with check (auth.uid() = from_user);

drop policy if exists "Recipients can mark messages read" on messages;
create policy "Recipients can mark messages read"
  on messages for update
  using (auth.uid() = to_user)
  with check (auth.uid() = to_user);

-- ============================================================
-- leads — a visitor talked to your public agent and left their details
-- ============================================================
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text,
  email text,
  message text,
  created_at timestamptz not null default now()
);

create index if not exists leads_owner_idx on leads (owner_id, created_at desc);

alter table leads enable row level security;

drop policy if exists "Owners read their leads" on leads;
create policy "Owners read their leads"
  on leads for select
  using (auth.uid() = owner_id);

-- Anyone, including logged-out visitors, may leave their details for an agent.
drop policy if exists "Anyone can leave a lead" on leads;
create policy "Anyone can leave a lead"
  on leads for insert
  with check (true);

grant insert on leads to anon, authenticated;
