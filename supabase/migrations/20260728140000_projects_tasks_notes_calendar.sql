-- PairUp work management and calendar data model.
-- Requires the workspace/membership migration. Apply before building calendar UI.

create table if not exists paired.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references paired.workspaces(id) on delete cascade,
  created_by uuid not null references paired.profiles(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 1 and 160),
  description text,
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled', 'archived')),
  due_date date,
  due_time time,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  archived_at timestamptz
);

create table if not exists paired.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references paired.workspaces(id) on delete cascade,
  project_id uuid references paired.projects(id) on delete cascade,
  created_by uuid not null references paired.profiles(id) on delete restrict,
  assigned_to uuid references paired.profiles(id) on delete set null,
  title text not null check (char_length(trim(title)) between 1 and 240),
  description text,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'cancelled', 'postponed')),
  due_date date,
  due_time time,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  check (ends_at is null or starts_at is not null),
  check (ends_at is null or ends_at > starts_at),
  check (due_time is null or due_date is not null)
);

create table if not exists paired.notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references paired.workspaces(id) on delete cascade,
  created_by uuid not null references paired.profiles(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 1 and 160),
  body text not null default '',
  task_id uuid references paired.tasks(id) on delete cascade,
  project_id uuid references paired.projects(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (task_id is null or project_id is null)
);

-- Upgrade the prototype goals table to the product rules.
alter table paired.goals add column if not exists term text not null default 'short_term' check (term in ('short_term', 'long_term'));
alter table paired.goals add column if not exists achieved_at timestamptz;
alter table paired.goals add column if not exists postponement_count smallint not null default 0 check (postponement_count between 0 and 3);
alter table paired.goals drop constraint if exists goals_status_check;
update paired.goals set status = case status when 'completed' then 'achieved' when 'abandoned' then 'cancelled' else status end;
alter table paired.goals add constraint goals_status_check check (status in ('not_started', 'in_progress', 'achieved', 'postponed', 'cancelled')) not valid;
alter table paired.goals validate constraint goals_status_check;
alter table paired.goals add constraint goals_due_date_required check (target_date is not null) not valid;

-- A project relation must remain within the same workspace as its task.
create or replace function paired.enforce_task_workspace()
returns trigger language plpgsql security definer set search_path = paired, public as $$
begin
  if new.project_id is not null and not exists (
    select 1 from paired.projects p where p.id = new.project_id and p.workspace_id = new.workspace_id
  ) then raise exception 'Task project must belong to the same workspace'; end if;
  if new.assigned_to is not null and not exists (
    select 1 from paired.workspace_members m where m.workspace_id = new.workspace_id and m.user_id = new.assigned_to
  ) then raise exception 'Task assignee must be a workspace member'; end if;
  if new.status = 'completed' and new.completed_at is null then new.completed_at := now(); end if;
  if new.status <> 'completed' then new.completed_at := null; end if;
  return new;
end;
$$;
drop trigger if exists tasks_workspace_guard on paired.tasks;
create trigger tasks_workspace_guard before insert or update on paired.tasks for each row execute function paired.enforce_task_workspace();

-- Postponements are auditable and hard-limited to three due-date extensions.
create or replace function paired.enforce_goal_postponements()
returns trigger language plpgsql security definer set search_path = paired, public as $$
begin
  if tg_op = 'INSERT' then return new; end if;
  if new.postponement_count < old.postponement_count then raise exception 'Goal postponement count cannot decrease'; end if;
  if new.target_date is distinct from old.target_date then
    if old.target_date is not null and new.target_date > old.target_date then
      if old.postponement_count >= 3 then raise exception 'This goal has reached its limit of three postponements'; end if;
      new.postponement_count := old.postponement_count + 1;
      new.status := 'postponed';
    elsif new.postponement_count <> old.postponement_count then
      raise exception 'Postponement count is managed automatically';
    end if;
  elsif new.postponement_count <> old.postponement_count then
    raise exception 'Postponement count is managed automatically';
  end if;
  if new.status = 'achieved' and old.status <> 'achieved' then new.achieved_at := now(); end if;
  return new;
end;
$$;
drop trigger if exists goals_postponement_guard on paired.goals;
create trigger goals_postponement_guard before update on paired.goals for each row execute function paired.enforce_goal_postponements();

-- Unified calendar read model. The UI can filter by date range for month/week/day views.
create or replace view paired.calendar_entries with (security_invoker = true) as
  select 'task'::text as kind, t.id, t.workspace_id, t.title, t.due_date as entry_date, t.due_time as entry_time, t.starts_at, t.ends_at, t.status, t.project_id
  from paired.tasks t where t.due_date is not null or t.starts_at is not null
  union all
  select 'project', p.id, p.workspace_id, p.title, p.due_date, p.due_time, null::timestamptz, null::timestamptz, p.status, p.id
  from paired.projects p where p.due_date is not null
  union all
  select 'goal', g.id, g.workspace_id, g.title, g.target_date, null::time, null::timestamptz, null::timestamptz, g.status, null::uuid
  from paired.goals g;

grant select, insert, update, delete on paired.projects, paired.tasks, paired.notes to authenticated;
grant select on paired.calendar_entries to authenticated;
alter table paired.projects enable row level security;
alter table paired.tasks enable row level security;
alter table paired.notes enable row level security;

create policy "Members manage projects" on paired.projects for all to authenticated using (paired.is_workspace_member(workspace_id)) with check (paired.is_workspace_member(workspace_id) and created_by = auth.uid());
create policy "Members manage tasks" on paired.tasks for all to authenticated using (paired.is_workspace_member(workspace_id)) with check (paired.is_workspace_member(workspace_id) and created_by = auth.uid());
create policy "Members manage notes" on paired.notes for all to authenticated using (paired.is_workspace_member(workspace_id)) with check (paired.is_workspace_member(workspace_id) and created_by = auth.uid());

create index if not exists projects_workspace_due_idx on paired.projects(workspace_id, due_date);
create index if not exists tasks_workspace_due_idx on paired.tasks(workspace_id, due_date);
create index if not exists tasks_workspace_starts_idx on paired.tasks(workspace_id, starts_at);
create index if not exists notes_workspace_task_idx on paired.notes(workspace_id, task_id);

alter publication supabase_realtime add table paired.projects, paired.tasks, paired.notes;