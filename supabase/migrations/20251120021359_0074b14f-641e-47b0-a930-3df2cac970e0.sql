-- Fix search_path for get_current_season function
CREATE OR REPLACE FUNCTION public.get_current_season()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Assumes season 1 started on 2025-01-01, adjust as needed
  SELECT FLOOR(EXTRACT(EPOCH FROM (NOW() - '2025-01-01'::timestamp)) / (7 * 24 * 60 * 60))::INTEGER + 1;
$$;