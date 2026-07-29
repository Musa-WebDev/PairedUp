-- Device subscriptions for web push and a richer workspace activity feed.
create table if not exists paired.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references paired.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists push_subscriptions_user_idx on paired.push_subscriptions(user_id);
grant select, insert, update, delete on paired.push_subscriptions to authenticated;
alter table paired.push_subscriptions enable row level security;

drop policy if exists "Users manage their own push subscriptions" on paired.push_subscriptions;
create policy "Users manage their own push subscriptions" on paired.push_subscriptions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table paired.workspace_events drop constraint if exists workspace_events_entity_type_check;
alter table paired.workspace_events add constraint workspace_events_entity_type_check check (entity_type in ('activity', 'goal', 'checkin', 'membership', 'project', 'task', 'note', 'reminder'));

create or replace function paired.log_workspace_event()
returns trigger language plpgsql security definer set search_path = paired, public as $$
declare
  target_workspace_id uuid;
  target_actor_id uuid;
  target_entity_id uuid;
  target_row jsonb;
begin
  target_workspace_id := coalesce(new.workspace_id, old.workspace_id);
  target_actor_id := auth.uid();
  target_entity_id := coalesce(new.id, old.id);
  target_row := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;

  insert into paired.workspace_events (workspace_id, actor_id, entity_type, entity_id, event_type, payload)
  values (
    target_workspace_id,
    target_actor_id,
    tg_argv[0],
    target_entity_id,
    lower(tg_op),
    jsonb_build_object('title', target_row->>'title', 'status', target_row->>'status')
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists projects_activity_feed on paired.projects;
create trigger projects_activity_feed after insert or update or delete on paired.projects for each row execute function paired.log_workspace_event('project');
drop trigger if exists tasks_activity_feed on paired.tasks;
create trigger tasks_activity_feed after insert or update or delete on paired.tasks for each row execute function paired.log_workspace_event('task');
drop trigger if exists notes_activity_feed on paired.notes;
create trigger notes_activity_feed after insert or update or delete on paired.notes for each row execute function paired.log_workspace_event('note');
drop trigger if exists reminders_activity_feed on paired.reminders;
create trigger reminders_activity_feed after insert or update or delete on paired.reminders for each row execute function paired.log_workspace_event('reminder');

alter publication supabase_realtime add table paired.push_subscriptions;