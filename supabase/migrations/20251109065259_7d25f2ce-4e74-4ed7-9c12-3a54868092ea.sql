-- Create helper function to create or fetch a direct conversation atomically
create or replace function public.create_direct_conversation(other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conv_id uuid;
  v_self uuid := auth.uid();
begin
  if v_self is null then
    raise exception 'Not authenticated';
  end if;
  if other_user_id is null or other_user_id = v_self then
    raise exception 'Invalid other_user_id';
  end if;

  -- Try to find existing direct conversation between the two users
  select c.id into v_conv_id
  from conversations c
  join conversation_participants cp1 on cp1.conversation_id = c.id and cp1.user_id = v_self
  join conversation_participants cp2 on cp2.conversation_id = c.id and cp2.user_id = other_user_id
  where c.type = 'direct'
  limit 1;

  if v_conv_id is not null then
    return v_conv_id;
  end if;

  -- Create new conversation
  insert into conversations(type)
  values ('direct')
  returning id into v_conv_id;

  -- Add both participants
  insert into conversation_participants(conversation_id, user_id)
  values (v_conv_id, v_self), (v_conv_id, other_user_id);

  return v_conv_id;
end;
$$;