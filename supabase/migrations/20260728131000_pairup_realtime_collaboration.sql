-- Real-time collaboration, invitations, and activity feed for PairUp.
-- Requires 20260728130000_pairup_multitenancy.sql.

create table if not exists paired.workspace_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references paired.workspaces(id) on delete cascade,
  actor_id uuid references paired.profiles(id) on delete set null,
  entity_type text not null check (entity_type in ('activity', 'goal', 'checkin', 'membership')),
  entity_id uuid,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

alter table paired.workspace_events enable row level security;
grant select, insert on paired.workspace_events to authenticated;
create policy "Members view workspace events" on paired.workspace_events for select to authenticated using (paired.is_workspace_member(workspace_id));

-- Prevent browser clients from writing arbitrary audit events. Server-side actions use
-- the authenticated actor and this trigger writes the canonical feed record.
create or replace function paired.log_workspace_event()
returns trigger language plpgsql security definer set search_path = paired, public as $$
declare
  target_workspace_id uuid;
  target_actor_id uuid;
  target_entity_id uuid;
begin
  target_workspace_id := coalesce(new.workspace_id, old.workspace_id);
  target_actor_id := auth.uid();
  target_entity_id := coalesce(new.id, old.id);

  insert into paired.workspace_events (workspace_id, actor_id, entity_type, entity_id, event_type, payload)
  values (
    target_workspace_id,
    target_actor_id,
    tg_argv[0],
    target_entity_id,
    lower(tg_op),
    jsonb_build_object('title', coalesce(new.title, old.title), 'status', coalesce(new.status, old.status))
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists activities_activity_feed on paired.activities;
create trigger activities_activity_feed after insert or update or delete on paired.activities for each row execute function paired.log_workspace_event('activity');
drop trigger if exists goals_activity_feed on paired.goals;
create trigger goals_activity_feed after insert or update or delete on paired.goals for each row execute function paired.log_workspace_event('goal');

-- Atomically redeem an invite. Tokens are never stored in plaintext.
create or replace function paired.accept_workspace_invitation(invite_token text)
returns uuid language plpgsql security definer set search_path = paired, public as $$
declare
  invitation paired.workspace_invitations%rowtype;
begin
  select * into invitation from paired.workspace_invitations
  where token_hash = encode(digest(invite_token, 'sha256'), 'hex')
    and accepted_at is null and expires_at > now()
  for update;
  if not found then raise exception 'This invitation is invalid or has expired'; end if;

  insert into paired.workspace_members (workspace_id, user_id, role)
  values (invitation.workspace_id, auth.uid(), 'member')
  on conflict (workspace_id, user_id) do nothing;
  update paired.workspace_invitations set accepted_at = now() where id = invitation.id;
  return invitation.workspace_id;
end;
$$;
grant execute on function paired.accept_workspace_invitation(text) to authenticated;

create index if not exists workspace_events_workspace_created_idx on paired.workspace_events(workspace_id, created_at desc);

-- Execute once in the SQL Editor after confirming the publication exists. It makes
-- row changes available to authenticated Supabase Realtime subscribers.
alter publication supabase_realtime add table paired.activities, paired.goals, paired.goal_checkins, paired.workspace_events;