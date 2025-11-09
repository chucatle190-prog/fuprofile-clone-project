-- Add wallet_address to profiles for crypto payments
ALTER TABLE public.profiles
ADD COLUMN wallet_address TEXT;

-- Create crypto_transactions table to track payments
CREATE TABLE public.crypto_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  marketplace_item_id UUID NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_hash TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  token_symbol TEXT NOT NULL,
  network TEXT NOT NULL DEFAULT 'BSC Testnet',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crypto_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for crypto_transactions
CREATE POLICY "Users can view their own transactions"
ON public.crypto_transactions
FOR SELECT
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create transactions"
ON public.crypto_transactions
FOR INSERT
WITH CHECK (auth.uid() = buyer_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.crypto_transactions;