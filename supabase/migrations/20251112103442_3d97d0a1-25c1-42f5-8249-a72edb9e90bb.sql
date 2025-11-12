-- Enable realtime for candy_crush_progress table
ALTER TABLE candy_crush_progress REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE candy_crush_progress;