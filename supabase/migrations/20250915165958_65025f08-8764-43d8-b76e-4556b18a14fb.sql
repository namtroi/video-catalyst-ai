-- Update existing 'openai' model selections to 'openai-gpt4o-mini' for backward compatibility
UPDATE user_settings 
SET selected_model = 'openai-gpt4o-mini' 
WHERE selected_model = 'openai';