-- Generic calendar events are stored as workspace reminders.
create table if not exists paired.reminders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references paired.workspaces(id) on delete cascade,
  created_by uuid not null references paired.profiles(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 1 and 240),
  description text,
  scheduled_date date not null,
  scheduled_time time,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (scheduled_time is null or scheduled_date is not null)
);

grant select, insert, update, delete on paired.reminders to authenticated;
alter table paired.reminders enable row level security;

drop policy if exists "Members view reminders" on paired.reminders;
drop policy if exists "Members create reminders" on paired.reminders;
drop policy if exists "Members update reminders" on paired.reminders;
drop policy if exists "Creators or admins delete reminders" on paired.reminders;

create policy "Members view reminders" on paired.reminders for select to authenticated using (paired.is_workspace_member(workspace_id));
create policy "Members create reminders" on paired.reminders for insert to authenticated with check (paired.is_workspace_member(workspace_id) and created_by = auth.uid());
create policy "Members update reminders" on paired.reminders for update to authenticated using (paired.is_workspace_member(workspace_id)) with check (paired.is_workspace_member(workspace_id));
create policy "Creators or admins delete reminders" on paired.reminders for delete to authenticated using (created_by = auth.uid() or paired.is_workspace_admin(workspace_id));

create index if not exists reminders_workspace_scheduled_idx on paired.reminders(workspace_id, scheduled_date, scheduled_time);
alter publication supabase_realtime add table paired.reminders;

create or replace view paired.calendar_entries with (security_invoker = true) as
  select 'task'::text as kind, t.id, t.workspace_id, t.title, t.due_date as entry_date, t.due_time as entry_time, t.starts_at, t.ends_at, t.status, t.project_id
  from paired.tasks t where t.due_date is not null or t.starts_at is not null
  union all
  select 'project', p.id, p.workspace_id, p.title, p.due_date, p.due_time, null::timestamptz, null::timestamptz, p.status, p.id
  from paired.projects p where p.due_date is not null
  union all
  select 'goal', g.id, g.workspace_id, g.title, g.target_date, null::time, null::timestamptz, null::timestamptz, g.status, null::uuid
  from paired.goals g
  union all
  select 'note', n.id, n.workspace_id, 'Note: ' || n.title, coalesce(t.due_date, p.due_date), coalesce(t.due_time, p.due_time), t.starts_at, t.ends_at, 'active', coalesce(t.project_id, p.id)
  from paired.notes n
  left join paired.tasks t on t.id = n.task_id
  left join paired.projects p on p.id = n.project_id
  where coalesce(t.due_date, p.due_date, t.starts_at::date) is not null
  union all
  select 'reminder', r.id, r.workspace_id, r.title, r.scheduled_date, r.scheduled_time, null::timestamptz, null::timestamptz, r.status, null::uuid
  from paired.reminders r;

grant select on paired.calendar_entries to authenticated;