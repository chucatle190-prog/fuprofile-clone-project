-- Create helper function to safely create a user wallet
CREATE OR REPLACE FUNCTION public.ensure_user_wallet(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create wallet if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM public.user_wallets WHERE user_id = p_user_id
  ) THEN
    INSERT INTO public.user_wallets (user_id)
    VALUES (p_user_id);
  END IF;
END;
$function$;