-- 1) Create security definer function to avoid recursive RLS
create or replace function public.is_conversation_member(_conversation_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_participants
    where conversation_id = _conversation_id
      and user_id = _user_id
  );
$$;

-- 2) Replace recursive SELECT policy on conversation_participants
drop policy if exists "Participants viewable by conversation members" on public.conversation_participants;

create policy "Participants viewable by conversation members"
on public.conversation_participants
for select
using (public.is_conversation_member(conversation_id, auth.uid()));