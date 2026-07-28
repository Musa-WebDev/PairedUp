-- Avoid relying on the pgcrypto digest() function at invite-accept time.
-- The application server already computes the SHA-256 hash using Node crypto
-- and passes that hash in the existing invite_token RPC argument.

create or replace function paired.accept_workspace_invitation(invite_token text)
returns uuid
language plpgsql
security definer
set search_path = paired, public
as $$
declare
  invitation paired.workspace_invitations%rowtype;
begin
  select * into invitation
  from paired.workspace_invitations
  where token_hash = invite_token
    and accepted_at is null
    and expires_at > now()
  for update;

  if not found then
    raise exception 'This invitation is invalid or has expired';
  end if;

  insert into paired.workspace_members (workspace_id, user_id, role)
  values (invitation.workspace_id, auth.uid(), 'member')
  on conflict (workspace_id, user_id) do nothing;

  update paired.workspace_invitations
  set accepted_at = now()
  where id = invitation.id;

  return invitation.workspace_id;
end;
$$;

grant execute on function paired.accept_workspace_invitation(text) to authenticated;
