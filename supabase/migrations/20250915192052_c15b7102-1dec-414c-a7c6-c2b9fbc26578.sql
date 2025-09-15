-- Add segmind_api_key_set column to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN segmind_api_key_set boolean NOT NULL DEFAULT false;