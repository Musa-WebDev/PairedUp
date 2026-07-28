-- Include notes attached to dated tasks/projects in the unified calendar feed.
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
  where coalesce(t.due_date, p.due_date, t.starts_at::date) is not null;