-- Let workspace members collaborate on shared workspace records after an invite
-- has been accepted. Creation still stamps ownership through application actions,
-- while updates are scoped by workspace membership instead of original creator.

drop policy if exists "Members manage projects" on paired.projects;
drop policy if exists "Members manage tasks" on paired.tasks;
drop policy if exists "Members manage notes" on paired.notes;

create policy "Members view projects" on paired.projects
  for select to authenticated
  using (paired.is_workspace_member(workspace_id));

create policy "Members create projects" on paired.projects
  for insert to authenticated
  with check (paired.is_workspace_member(workspace_id) and created_by = auth.uid());

create policy "Members update projects" on paired.projects
  for update to authenticated
  using (paired.is_workspace_member(workspace_id))
  with check (paired.is_workspace_member(workspace_id));

create policy "Creators or admins delete projects" on paired.projects
  for delete to authenticated
  using (created_by = auth.uid() or paired.is_workspace_admin(workspace_id));

create policy "Members view tasks" on paired.tasks
  for select to authenticated
  using (paired.is_workspace_member(workspace_id));

create policy "Members create tasks" on paired.tasks
  for insert to authenticated
  with check (paired.is_workspace_member(workspace_id) and created_by = auth.uid());

create policy "Members update tasks" on paired.tasks
  for update to authenticated
  using (paired.is_workspace_member(workspace_id))
  with check (paired.is_workspace_member(workspace_id));

create policy "Creators or admins delete tasks" on paired.tasks
  for delete to authenticated
  using (created_by = auth.uid() or paired.is_workspace_admin(workspace_id));

create policy "Members view notes" on paired.notes
  for select to authenticated
  using (paired.is_workspace_member(workspace_id));

create policy "Members create notes" on paired.notes
  for insert to authenticated
  with check (paired.is_workspace_member(workspace_id) and created_by = auth.uid());

create policy "Members update notes" on paired.notes
  for update to authenticated
  using (paired.is_workspace_member(workspace_id))
  with check (paired.is_workspace_member(workspace_id));

create policy "Creators or admins delete notes" on paired.notes
  for delete to authenticated
  using (created_by = auth.uid() or paired.is_workspace_admin(workspace_id));
