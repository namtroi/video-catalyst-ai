-- Add generated_production_images column to saved_projects table
ALTER TABLE public.saved_projects 
ADD COLUMN generated_production_images text;