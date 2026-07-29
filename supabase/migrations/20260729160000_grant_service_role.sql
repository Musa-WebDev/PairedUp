-- Grant service_role access to paired schema
grant usage on schema paired to service_role;
grant all privileges on all tables in schema paired to service_role;
grant all privileges on all routines in schema paired to service_role;
grant all privileges on all sequences in schema paired to service_role;
