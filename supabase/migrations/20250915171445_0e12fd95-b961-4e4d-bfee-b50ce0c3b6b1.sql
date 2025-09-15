-- Create user_templates table for storing reusable instruction templates
CREATE TABLE public.user_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
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

-- Enable RLS
ALTER TABLE public.user_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own templates" 
ON public.user_templates 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates" 
ON public.user_templates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" 
ON public.user_templates 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" 
ON public.user_templates 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_user_templates_updated_at
BEFORE UPDATE ON public.user_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();