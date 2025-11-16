-- Create function to increment wallet balance safely
CREATE OR REPLACE FUNCTION public.increment_wallet_balance(p_user_id UUID, p_amount NUMERIC)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_wallets
  SET camly_balance = camly_balance + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;