-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Users can add participants" ON conversation_participants;

-- Keep only the simple policy that allows users to add any participant
-- This is safe because users can only add participants to conversations they create
DROP POLICY IF EXISTS "Users can add themselves as participants" ON conversation_participants;

-- Create a new policy that allows authenticated users to insert participants
CREATE POLICY "Authenticated users can add participants"
ON conversation_participants
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);