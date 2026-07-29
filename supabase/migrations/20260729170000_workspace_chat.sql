create table if not exists paired.workspace_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references paired.workspaces(id) on delete cascade,
  author_id uuid not null references paired.profiles(id) on delete restrict,
  message text not null check (char_length(trim(message)) > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table paired.workspace_messages enable row level security;
grant select, insert, update, delete on paired.workspace_messages to authenticated;

create policy "Members view workspace messages" on paired.workspace_messages for select to authenticated using (paired.is_workspace_member(workspace_id));
create policy "Members insert workspace messages" on paired.workspace_messages for insert to authenticated with check (paired.is_workspace_member(workspace_id) and author_id = auth.uid());
create policy "Authors update messages" on paired.workspace_messages for update to authenticated using (author_id = auth.uid() and paired.is_workspace_member(workspace_id));
create policy "Authors or admins delete messages" on paired.workspace_messages for delete to authenticated using (author_id = auth.uid() or paired.is_workspace_admin(workspace_id));

alter publication supabase_realtime add table paired.workspace_messages;
