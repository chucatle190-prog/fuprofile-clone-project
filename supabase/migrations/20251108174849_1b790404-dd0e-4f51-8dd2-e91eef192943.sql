-- Add more profile fields for Facebook-like profile
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS work TEXT,
ADD COLUMN IF NOT EXISTS education TEXT,
ADD COLUMN IF NOT EXISTS lives_in TEXT,
ADD COLUMN IF NOT EXISTS from_location TEXT,
ADD COLUMN IF NOT EXISTS relationship TEXT;