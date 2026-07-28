-- 1. Grant usage on the custom schema so the API can access it
grant usage on schema paired to authenticated, anon;

-- 2. Create the profiles table
create table paired.profiles (
  id uuid not null references auth.users on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  primary key (id)
);

-- 3. Create the activities table (for movies, shows, and things to do)
create table paired.activities (
  id uuid not null default gen_random_uuid(),
  created_by uuid not null references paired.profiles(id) on delete cascade,
  title text not null,
  description text,
  category text not null check (category in ('movie', 'show', 'activity')),
  status text not null default 'suggested' check (status in ('suggested', 'planned', 'completed')),
  url text, -- optional link (e.g., IMDB link or booking link)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  primary key (id)
);

-- 4. Create the goals table (for accountability)
create table paired.goals (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references paired.profiles(id) on delete cascade, -- who owns the goal
  title text not null,
  description text,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned')),
  target_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  primary key (id)
);

-- 5. Grant table access to the authenticated role
grant all privileges on all tables in schema paired to authenticated;
grant all privileges on all sequences in schema paired to authenticated;

-- 6. Enable Row Level Security (RLS)
alter table paired.profiles enable row level security;
alter table paired.activities enable row level security;
alter table paired.goals enable row level security;

-- 7. Policies for Profiles
create policy "Authenticated users can view profiles" on paired.profiles for select to authenticated using (true);
create policy "Users can insert their own profile" on paired.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Users can update their own profile" on paired.profiles for update to authenticated using (auth.uid() = id);

-- 8. Policies for Activities (Both can read, insert, update, and delete)
create policy "Authenticated users can manage activities" on paired.activities for all to authenticated using (true);

-- 9. Policies for Goals (Both can manage goals)
create policy "Authenticated users can manage goals" on paired.goals for all to authenticated using (true);

-- 10. Trigger to automatically create a profile when a new user signs up
create or replace function paired.handle_new_user()
returns trigger as $$
begin
  insert into paired.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$ language plpgsql security definer;

-- Drop the old trigger if it existed, and create the new one
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure paired.handle_new_user();