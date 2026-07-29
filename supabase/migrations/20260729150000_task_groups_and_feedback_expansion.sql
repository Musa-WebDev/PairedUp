-- Migration to properly create task_groups and expand accountability feedback

-- 1. Create the Task Groups table
create table if not exists paired.task_groups (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references paired.workspaces(id) on delete cascade,
  created_by uuid not null references paired.profiles(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 1 and 160),
  type text not null default 'personal_project' check (type in ('leisure_activity', 'work_project', 'personal_project')),
  icon text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- RLS and Privileges for task_groups
alter table paired.task_groups enable row level security;
grant select, insert, update, delete on paired.task_groups to authenticated;
create policy "Members manage task_groups" on paired.task_groups for all to authenticated using (paired.is_workspace_member(workspace_id)) with check (paired.is_workspace_member(workspace_id) and created_by = auth.uid());

-- 2. Add task_group_id to Tasks
alter table paired.tasks add column if not exists task_group_id uuid references paired.task_groups(id) on delete cascade;

-- Update tasks constraints to ensure exactly ONE parent (project, goal, or task_group)
alter table paired.tasks drop constraint if exists tasks_one_parent_check;
alter table paired.tasks add constraint tasks_one_parent_check check ((project_id is not null)::integer + (goal_id is not null)::integer + (task_group_id is not null)::integer <= 1) not valid;
alter table paired.tasks validate constraint tasks_one_parent_check;

-- 3. Expand Accountability Feedback to support all entities
alter table paired.accountability_feedback add column if not exists goal_id uuid references paired.goals(id) on delete cascade;
alter table paired.accountability_feedback add column if not exists task_group_id uuid references paired.task_groups(id) on delete cascade;

alter table paired.accountability_feedback drop constraint if exists accountability_feedback_check;
alter table paired.accountability_feedback add constraint accountability_feedback_check 
  check ((task_id is not null)::integer + (project_id is not null)::integer + (goal_id is not null)::integer + (task_group_id is not null)::integer = 1) not valid;
alter table paired.accountability_feedback validate constraint accountability_feedback_check;

-- 4. Update the enforce trigger for accountability feedback
create or replace function paired.enforce_feedback_target()
returns trigger language plpgsql security definer set search_path = paired, public as $$
declare
  target_status text;
  target_workspace_id uuid;
begin
  if new.task_id is not null then
    select workspace_id, status into target_workspace_id, target_status from paired.tasks where id = new.task_id;
  elsif new.project_id is not null then
    select workspace_id, status into target_workspace_id, target_status from paired.projects where id = new.project_id;
  elsif new.goal_id is not null then
    select workspace_id, status into target_workspace_id, target_status from paired.goals where id = new.goal_id;
  elsif new.task_group_id is not null then
    select workspace_id, 'active' into target_workspace_id, target_status from paired.task_groups where id = new.task_group_id;
  end if;
  
  if target_workspace_id is null then raise exception 'Feedback target does not exist'; end if;
  if target_workspace_id <> new.workspace_id then raise exception 'Feedback target must belong to the same workspace'; end if;
  if target_status in ('completed', 'cancelled', 'archived', 'achieved') then raise exception 'Feedback can only be added to active work'; end if;
  if new.parent_id is not null and not exists (select 1 from paired.accountability_feedback f where f.id = new.parent_id and f.workspace_id = new.workspace_id) then
    raise exception 'Feedback reply must remain in the same workspace';
  end if;
  return new;
end;
$$;

-- Remove type and icon from projects (reverting the previous step)
alter table paired.projects drop column if exists "type";
alter table paired.projects drop column if exists "icon";
