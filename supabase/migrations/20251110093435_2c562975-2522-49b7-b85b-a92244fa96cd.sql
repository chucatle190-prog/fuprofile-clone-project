-- Cho phép admin/creator của group thêm thành viên
CREATE POLICY "Group admins can add members"
ON public.group_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = group_members.group_id
    AND (
      g.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.group_members gm
        WHERE gm.group_id = g.id
        AND gm.user_id = auth.uid()
        AND gm.role = 'admin'
      )
    )
  )
);