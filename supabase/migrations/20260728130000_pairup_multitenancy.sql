-- PairUp commercial-grade multi-tenant foundation
-- Run in the Supabase SQL editor or with `supabase db push`.
-- Existing paired.activities and paired.goals rows must be assigned a workspace
-- before the NOT NULL constraints below are applied.

create extension if not exists pgcrypto;

create table if not exists paired.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 80),
  created_by uuid not null references paired.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists paired.workspace_members (
  workspace_id uuid not null references paired.workspaces(id) on delete cascade,
  user_id uuid not null references paired.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz not null default timezone('utc', now()),
  primary key (workspace_id, user_id)
);

create table if not exists paired.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references paired.workspaces(id) on delete cascade,
  email text not null,
  token_hash text not null unique,
  invited_by uuid not null references paired.profiles(id) on delete cascade,
  expires_at timestamptz not null default timezone('utc', now()) + interval '7 days',
  accepted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

alter table paired.activities add column if not exists workspace_id uuid references paired.workspaces(id) on delete cascade;
alter table paired.activities add column if not exists updated_at timestamptz not null default timezone('utc', now());
alter table paired.activities add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table paired.activities add column if not exists scheduled_for timestamptz;

alter table paired.goals add column if not exists workspace_id uuid references paired.workspaces(id) on delete cascade;
alter table paired.goals add column if not exists created_by uuid references paired.profiles(id) on delete set null;
alter table paired.goals add column if not exists progress smallint not null default 0 check (progress between 0 and 100);
alter table paired.goals add column if not exists priority text not null default 'medium' check (priority in ('low', 'medium', 'high'));
alter table paired.goals add column if not exists visibility text not null default 'shared' check (visibility in ('shared', 'private'));
alter table paired.goals add column if not exists updated_at timestamptz not null default timezone('utc', now());

create table if not exists paired.goal_checkins (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references paired.goals(id) on delete cascade,
  user_id uuid not null references paired.profiles(id) on delete cascade,
  note text check (char_length(note) <= 1000),
  progress smallint check (progress between 0 and 100),
  created_at timestamptz not null default timezone('utc', now())
);

-- Empty projects can enforce these immediately. Backfill first if you already have data.
alter table paired.activities alter column workspace_id set not null;
alter table paired.goals alter column workspace_id set not null;
update paired.goals set created_by = user_id where created_by is null;
alter table paired.goals alter column created_by set not null;

create or replace function paired.is_workspace_member(target_workspace_id uuid)
returns boolean language sql stable security definer set search_path = paired, public as $$
  select exists (
    select 1 from paired.workspace_members
    where workspace_id = target_workspace_id and user_id = auth.uid()
  );
$$;

create or replace function paired.is_workspace_admin(target_workspace_id uuid)
returns boolean language sql stable security definer set search_path = paired, public as $$
  select exists (
    select 1 from paired.workspace_members
    where workspace_id = target_workspace_id and user_id = auth.uid() and role in ('owner', 'admin')
  );
$$;

grant usage on schema paired to authenticated;
grant select, insert, update, delete on all tables in schema paired to authenticated;

alter table paired.workspaces enable row level security;
alter table paired.workspace_members enable row level security;
alter table paired.workspace_invitations enable row level security;
alter table paired.goal_checkins enable row level security;

-- Replace broad policies from the initial prototype.
drop policy if exists "Authenticated users can manage activities" on paired.activities;
drop policy if exists "Authenticated users can manage goals" on paired.goals;

create policy "Members can view workspaces" on paired.workspaces for select to authenticated using (paired.is_workspace_member(id));
create policy "Users can create workspaces" on paired.workspaces for insert to authenticated with check (created_by = auth.uid());
create policy "Admins can update workspaces" on paired.workspaces for update to authenticated using (paired.is_workspace_admin(id)) with check (paired.is_workspace_admin(id));

create policy "Members can view memberships" on paired.workspace_members for select to authenticated using (paired.is_workspace_member(workspace_id));
create policy "Creator can add initial owner membership" on paired.workspace_members for insert to authenticated with check (user_id = auth.uid() and role = 'owner' and exists (select 1 from paired.workspaces where id = workspace_id and created_by = auth.uid()));
create policy "Owners can manage memberships" on paired.workspace_members for all to authenticated using (paired.is_workspace_admin(workspace_id)) with check (paired.is_workspace_admin(workspace_id));

create policy "Admins manage invitations" on paired.workspace_invitations for all to authenticated using (paired.is_workspace_admin(workspace_id)) with check (paired.is_workspace_admin(workspace_id));

create policy "Members view activities" on paired.activities for select to authenticated using (paired.is_workspace_member(workspace_id));
create policy "Members create activities" on paired.activities for insert to authenticated with check (paired.is_workspace_member(workspace_id) and created_by = auth.uid());
create policy "Members update activities" on paired.activities for update to authenticated using (paired.is_workspace_member(workspace_id)) with check (paired.is_workspace_member(workspace_id));
create policy "Creators or admins delete activities" on paired.activities for delete to authenticated using (created_by = auth.uid() or paired.is_workspace_admin(workspace_id));

create policy "Members view shared goals" on paired.goals for select to authenticated using (paired.is_workspace_member(workspace_id) and (visibility = 'shared' or user_id = auth.uid()));
create policy "Members create goals" on paired.goals for insert to authenticated with check (paired.is_workspace_member(workspace_id) and user_id = auth.uid() and created_by = auth.uid());
create policy "Members update goals" on paired.goals for update to authenticated using (paired.is_workspace_member(workspace_id) and (visibility = 'shared' or user_id = auth.uid())) with check (paired.is_workspace_member(workspace_id));
create policy "Creators or admins delete goals" on paired.goals for delete to authenticated using (created_by = auth.uid() or paired.is_workspace_admin(workspace_id));

create policy "Members view goal checkins" on paired.goal_checkins for select to authenticated using (exists (select 1 from paired.goals g where g.id = goal_id and paired.is_workspace_member(g.workspace_id)));
create policy "Members add their checkins" on paired.goal_checkins for insert to authenticated with check (user_id = auth.uid() and exists (select 1 from paired.goals g where g.id = goal_id and paired.is_workspace_member(g.workspace_id)));

create index if not exists activities_workspace_created_idx on paired.activities(workspace_id, created_at desc);
create index if not exists goals_workspace_status_idx on paired.goals(workspace_id, status, target_date);
create index if not exists goal_checkins_goal_created_idx on paired.goal_checkins(goal_id, created_at desc);
