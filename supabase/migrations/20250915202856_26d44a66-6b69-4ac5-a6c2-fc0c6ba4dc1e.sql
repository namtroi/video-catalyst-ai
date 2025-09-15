-- Add columns for storing generated thumbnail data
ALTER TABLE public.saved_projects 
ADD COLUMN generated_thumbnails TEXT,
ADD COLUMN selected_thumbnail_id TEXT;