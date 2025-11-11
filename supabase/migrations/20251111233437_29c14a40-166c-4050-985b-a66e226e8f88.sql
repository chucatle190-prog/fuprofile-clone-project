-- Allow both sides of a friendship to delete the relationship
CREATE POLICY "Users can delete friendships they're involved in"
ON public.friendships
FOR DELETE
USING (auth.uid() = user_id OR auth.uid() = friend_id);
