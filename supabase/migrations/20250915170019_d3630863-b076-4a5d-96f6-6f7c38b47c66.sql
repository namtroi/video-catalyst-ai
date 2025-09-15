-- Remove the existing check constraint
ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS valid_model;

-- Add a new check constraint that allows the new model values
ALTER TABLE user_settings ADD CONSTRAINT valid_model 
CHECK (selected_model IN ('deepseek', 'openai', 'openai-gpt4o-mini', 'openai-gpt5'));

-- Update existing 'openai' model selections to 'openai-gpt4o-mini' for backward compatibility
UPDATE user_settings 
SET selected_model = 'openai-gpt4o-mini' 
WHERE selected_model = 'openai';