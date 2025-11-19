-- Enable REPLICA IDENTITY FULL for realtime updates on user_wallets
ALTER TABLE public.user_wallets REPLICA IDENTITY FULL;

-- Enable REPLICA IDENTITY FULL for realtime updates on token_transfers  
ALTER TABLE public.token_transfers REPLICA IDENTITY FULL;

-- Add tables to realtime publication if not already added
DO $$
BEGIN
  -- Add user_wallets to realtime publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'user_wallets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_wallets;
  END IF;

  -- Add token_transfers to realtime publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'token_transfers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.token_transfers;
  END IF;
END $$;