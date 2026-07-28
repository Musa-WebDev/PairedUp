-- Goal sub-tasks and deadline enforcement.
alter table paired.tasks add column if not exists goal_id uuid references paired.goals(id) on delete cascade;
alter table paired.tasks add constraint tasks_one_parent_check check ((project_id is not null)::integer + (goal_id is not null)::integer <= 1) not valid;
alter table paired.tasks validate constraint tasks_one_parent_check;

create or replace function paired.enforce_task_workspace()
returns trigger language plpgsql security definer set search_path = paired, public as $$
declare parent_due_date date;
begin
  if new.project_id is not null then
    select due_date into parent_due_date from paired.projects where id = new.project_id and workspace_id = new.workspace_id;
    if not found then raise exception 'Task project must belong to the same workspace'; end if;
  elsif new.goal_id is not null then
    select target_date into parent_due_date from paired.goals where id = new.goal_id and workspace_id = new.workspace_id;
    if not found then raise exception 'Task goal must belong to the same workspace'; end if;
  end if;
  if parent_due_date is not null and new.due_date is not null and new.due_date > parent_due_date then raise exception 'Task due date cannot be after its parent due date'; end if;
  if parent_due_date is not null and new.starts_at is not null and new.starts_at::date > parent_due_date then raise exception 'Task time slot cannot start after its parent due date'; end if;
  if new.assigned_to is not null and not exists (select 1 from paired.workspace_members m where m.workspace_id = new.workspace_id and m.user_id = new.assigned_to) then raise exception 'Task assignee must be a workspace member'; end if;
  if new.status = 'completed' and new.completed_at is null then new.completed_at := now(); end if;
  if new.status <> 'completed' then new.completed_at := null; end if;
  return new;
end;
$$;
create index if not exists tasks_goal_idx on paired.tasks(goal_id, created_at);