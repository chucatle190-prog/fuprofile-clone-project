-- Allow users to create conversations
CREATE POLICY "Users can create conversations"
ON conversations
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to add participants to conversations
CREATE POLICY "Users can add participants"
ON conversation_participants
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = conversation_participants.conversation_id
    AND user_id = auth.uid()
  )
);

-- Allow users to add themselves as participants when creating new conversation
CREATE POLICY "Users can add themselves as participants"
ON conversation_participants
FOR INSERT
WITH CHECK (auth.uid() = user_id);