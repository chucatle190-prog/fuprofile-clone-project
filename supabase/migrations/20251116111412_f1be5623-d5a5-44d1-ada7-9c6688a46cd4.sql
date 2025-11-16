-- Create token transfers table
CREATE TABLE public.token_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'completed'
);

-- Enable RLS
ALTER TABLE public.token_transfers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for token_transfers
CREATE POLICY "Users can view their own transfers"
  ON public.token_transfers
  FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create transfers as sender"
  ON public.token_transfers
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Add index for better performance
CREATE INDEX idx_token_transfers_sender ON public.token_transfers(sender_id);
CREATE INDEX idx_token_transfers_receiver ON public.token_transfers(receiver_id);
CREATE INDEX idx_token_transfers_created_at ON public.token_transfers(created_at DESC);