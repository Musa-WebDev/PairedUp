-- Atomic workspace bootstrap. Called only by an authenticated user.
create or replace function paired.create_workspace(workspace_name text)
returns uuid
language plpgsql
security definer
set search_path = paired, public
as $$
declare
  workspace_id uuid;
  actor_id uuid := auth.uid();
begin
  if actor_id is null then
    raise exception 'Authentication is required to create a workspace';
  end if;
  if char_length(trim(workspace_name)) not between 1 and 80 then
    raise exception 'Workspace name must be between 1 and 80 characters';
  end if;

  insert into paired.workspaces (name, created_by)
  values (trim(workspace_name), actor_id)
  returning id into workspace_id;

  insert into paired.workspace_members (workspace_id, user_id, role)
  values (workspace_id, actor_id, 'owner');

  return workspace_id;
end;
$$;

grant execute on function paired.create_workspace(text) to authenticated;