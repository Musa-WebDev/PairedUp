-- Enforce project deadlines for all project tasks.
create or replace function paired.enforce_task_workspace()
returns trigger language plpgsql security definer set search_path = paired, public as $$
declare
  project_due_date date;
begin
  if new.project_id is not null then
    select due_date into project_due_date from paired.projects where id = new.project_id and workspace_id = new.workspace_id;
    if not found then raise exception 'Task project must belong to the same workspace'; end if;
    if project_due_date is not null and new.due_date is not null and new.due_date > project_due_date then
      raise exception 'Task due date cannot be after its project due date';
    end if;
    if project_due_date is not null and new.starts_at is not null and new.starts_at::date > project_due_date then
      raise exception 'Task time slot cannot start after its project due date';
    end if;
  end if;
  if new.assigned_to is not null and not exists (select 1 from paired.workspace_members m where m.workspace_id = new.workspace_id and m.user_id = new.assigned_to) then raise exception 'Task assignee must be a workspace member'; end if;
  if new.status = 'completed' and new.completed_at is null then new.completed_at := now(); end if;
  if new.status <> 'completed' then new.completed_at := null; end if;
  return new;
end;
$$;