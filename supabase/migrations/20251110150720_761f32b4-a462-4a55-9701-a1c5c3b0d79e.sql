-- Create enum for group roles
CREATE TYPE public.group_role AS ENUM ('admin', 'moderator', 'member');

-- Drop all existing policies on group_members
DROP POLICY IF EXISTS "Group admins can add members" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;
DROP POLICY IF EXISTS "Group members viewable by everyone" ON public.group_members;

-- Add new column with enum type
ALTER TABLE public.group_members ADD COLUMN role_new group_role DEFAULT 'member'::group_role;

-- Copy data from old column to new column
UPDATE public.group_members SET role_new = 
  CASE 
    WHEN role = 'admin' THEN 'admin'::group_role
    WHEN role = 'moderator' THEN 'moderator'::group_role
    ELSE 'member'::group_role
  END;

-- Make new column NOT NULL
ALTER TABLE public.group_members ALTER COLUMN role_new SET NOT NULL;

-- Drop old column
ALTER TABLE public.group_members DROP COLUMN role;

-- Rename new column to role
ALTER TABLE public.group_members RENAME COLUMN role_new TO role;

-- Create security definer function
CREATE OR REPLACE FUNCTION public.has_group_role(_user_id uuid, _group_id uuid, _role text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE user_id = _user_id
      AND group_id = _group_id
      AND role::text = _role
  );
END;
$$;

-- Recreate policies
CREATE POLICY "Group members viewable by everyone"
ON public.group_members
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Group admins can add members"
ON public.group_members
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_group_role(auth.uid(), group_id, 'admin')
);

CREATE POLICY "Users can join groups"
ON public.group_members
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups or admins can remove"
ON public.group_members
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id 
  OR public.has_group_role(auth.uid(), group_id, 'admin')
);

CREATE POLICY "Group admins can update member roles"
ON public.group_members
FOR UPDATE
TO authenticated
USING (
  public.has_group_role(auth.uid(), group_id, 'admin')
);

-- Update policies for group_posts
DROP POLICY IF EXISTS "Users can delete own posts" ON public.group_posts;
CREATE POLICY "Users can delete own posts or moderators can delete"
ON public.group_posts
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id 
  OR public.has_group_role(auth.uid(), group_id, 'admin')
  OR public.has_group_role(auth.uid(), group_id, 'moderator')
);

DROP POLICY IF EXISTS "Users can update own posts" ON public.group_posts;
CREATE POLICY "Users can update own posts or moderators can update"
ON public.group_posts
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_group_role(auth.uid(), group_id, 'admin')
  OR public.has_group_role(auth.uid(), group_id, 'moderator')
);