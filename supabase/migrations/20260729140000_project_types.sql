-- Migration to add type and icon to projects (task groups)

alter table paired.projects add column if not exists "type" text not null default 'personal_project' check ("type" in ('leisure_activity', 'work_project', 'personal_project'));
alter table paired.projects add column if not exists "icon" text;
