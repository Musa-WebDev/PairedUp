-- Accountability conversations for active projects and tasks.
create table if not exists paired.accountability_feedback (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references paired.workspaces(id) on delete cascade,
  task_id uuid references paired.tasks(id) on delete cascade,
  project_id uuid references paired.projects(id) on delete cascade,
  parent_id uuid references paired.accountability_feedback(id) on delete cascade,
  author_id uuid not null references paired.profiles(id) on delete restrict,
  kind text not null default 'question' check (kind in ('question', 'nudge', 'update', 'reply', 'encouragement')),
  message text not null check (char_length(trim(message)) between 1 and 2000),
  resolved_at timestamptz,
  resolved_by uuid references paired.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check ((task_id is not null)::integer + (project_id is not null)::integer = 1)
);

create or replace function paired.enforce_feedback_target()
returns trigger language plpgsql security definer set search_path = paired, public as $$
declare
  target_status text;
  target_workspace_id uuid;
begin
  if new.task_id is not null then
    select workspace_id, status into target_workspace_id, target_status from paired.tasks where id = new.task_id;
  else
    select workspace_id, status into target_workspace_id, target_status from paired.projects where id = new.project_id;
  end if;
  if target_workspace_id is null then raise exception 'Feedback target does not exist'; end if;
  if target_workspace_id <> new.workspace_id then raise exception 'Feedback target must belong to the same workspace'; end if;
  if target_status in ('completed', 'cancelled', 'archived') then raise exception 'Feedback can only be added to active work'; end if;
  if new.parent_id is not null and not exists (select 1 from paired.accountability_feedback f where f.id = new.parent_id and f.workspace_id = new.workspace_id) then
    raise exception 'Feedback reply must remain in the same workspace';
  end if;
  return new;
end;
$$;
drop trigger if exists accountability_feedback_target_guard on paired.accountability_feedback;
create trigger accountability_feedback_target_guard before insert or update on paired.accountability_feedback for each row execute function paired.enforce_feedback_target();

alter table paired.accountability_feedback enable row level security;
grant select, insert, update, delete on paired.accountability_feedback to authenticated;
create policy "Members view accountability feedback" on paired.accountability_feedback for select to authenticated using (paired.is_workspace_member(workspace_id));
create policy "Members add accountability feedback" on paired.accountability_feedback for insert to authenticated with check (paired.is_workspace_member(workspace_id) and author_id = auth.uid());
create policy "Authors or admins update feedback" on paired.accountability_feedback for update to authenticated using (author_id = auth.uid() or paired.is_workspace_admin(workspace_id)) with check (paired.is_workspace_member(workspace_id));
create policy "Authors or admins delete feedback" on paired.accountability_feedback for delete to authenticated using (author_id = auth.uid() or paired.is_workspace_admin(workspace_id));

create index if not exists accountability_feedback_task_created_idx on paired.accountability_feedback(task_id, created_at);
create index if not exists accountability_feedback_project_created_idx on paired.accountability_feedback(project_id, created_at);
alter publication supabase_realtime add table paired.accountability_feedback;