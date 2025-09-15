-- Create saved_projects table
CREATE TABLE public.saved_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_name TEXT NOT NULL,
  topic TEXT,
  angle TEXT,
  hook TEXT,
  title TEXT,
  thumbnail_prompt TEXT,
  script TEXT,
  image_video_prompts TEXT,
  topic_settings TEXT DEFAULT '',
  angle_settings TEXT DEFAULT '',
  hook_settings TEXT DEFAULT '',
  title_settings TEXT DEFAULT '',
  thumbnail_settings TEXT DEFAULT '',
  script_settings TEXT DEFAULT '',
  production_settings TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.saved_projects ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own saved projects" 
ON public.saved_projects 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved projects" 
ON public.saved_projects 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved projects" 
ON public.saved_projects 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved projects" 
ON public.saved_projects 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_saved_projects_updated_at
BEFORE UPDATE ON public.saved_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();