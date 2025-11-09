-- Replace conversations INSERT policy to avoid auth.uid() dependency inside security definer
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;

CREATE POLICY "Authenticated can create conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Ensure SELECT remains the same (no change)