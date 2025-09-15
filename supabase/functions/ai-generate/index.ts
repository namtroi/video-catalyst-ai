import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get user from auth token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    // Get user settings to determine which API keys to use and selected model
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (settingsError) {
      throw new Error('Failed to get user settings');
    }

    const { type, model, customSettings, topic, angle, hook, title, script } = await req.json();

    // Get the appropriate API key from secrets
    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    let result;

    if (model === 'deepseek') {
      if (!deepseekApiKey) {
        throw new Error('Deepseek API key not configured');
      }
      result = await generateWithDeepseek(type, deepseekApiKey, customSettings, topic, angle, hook, title, script);
    } else if (model === 'openai-gpt4o-mini') {
      if (!openaiApiKey) {
        throw new Error('OpenAI API key not configured');
      }
      result = await generateWithOpenAI(type, 'gpt-4o-mini', openaiApiKey, customSettings, topic, angle, hook, title, script);
    } else if (model === 'openai-gpt5') {
      if (!openaiApiKey) {
        throw new Error('OpenAI API key not configured');
      }
      result = await generateWithOpenAI(type, 'gpt-5-2025-08-07', openaiApiKey, customSettings, topic, angle, hook, title, script);
    } else {
      throw new Error('Invalid model specified');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-generate function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateWithDeepseek(type: string, apiKey: string, customSettings?: string, topic?: string, angle?: string, hook?: string, title?: string, script?: string) {
  const prompts = getDeepseekPrompts();
  let prompt = '';

  switch (type) {
    case 'topic':
      prompt = prompts.topic;
      break;
    case 'angles':
      prompt = prompts.angles(topic!);
      break;
    case 'hooks':
      prompt = prompts.hooks(topic!, angle!);
      break;
    case 'titles':
      prompt = prompts.titles(topic!, angle!, hook!);
      break;
    case 'thumbnails':
      prompt = prompts.thumbnails(title!, hook!);
      break;
    case 'script':
      prompt = prompts.script(title!, hook!);
      break;
    case 'scenes':
      prompt = prompts.scenes(script!);
      break;
    default:
      throw new Error('Invalid generation type');
  }

  // Use custom settings as full prompt if provided, otherwise use default prompts
  if (customSettings && customSettings.trim()) {
    prompt = customSettings;
  }

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a helpful YouTube content creation assistant. Always follow the exact format requested.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Deepseek API error');
  }

  const content = data.choices[0].message.content;
  return parseResponse(type, content);
}

async function generateWithOpenAI(type: string, modelName: string, apiKey: string, customSettings?: string, topic?: string, angle?: string, hook?: string, title?: string, script?: string) {
  const prompts = getOpenAIPrompts();
  let prompt = '';

  switch (type) {
    case 'topic':
      prompt = prompts.topic;
      break;
    case 'angles':
      prompt = prompts.angles(topic!);
      break;
    case 'hooks':
      prompt = prompts.hooks(topic!, angle!);
      break;
    case 'titles':
      prompt = prompts.titles(topic!, angle!, hook!);
      break;
    case 'thumbnails':
      prompt = prompts.thumbnails(title!, hook!);
      break;
    case 'script':
      prompt = prompts.script(title!, hook!);
      break;
    case 'scenes':
      prompt = prompts.scenes(script!);
      break;
    default:
      throw new Error('Invalid generation type');
  }

  // Use custom settings as full prompt if provided, otherwise use default prompts
  if (customSettings && customSettings.trim()) {
    prompt = customSettings;
  }

  // Build request body based on model
  const requestBody: any = {
    model: modelName,
    messages: [
      { role: 'system', content: 'You are a helpful YouTube content creation assistant. Always follow the exact format requested.' },
      { role: 'user', content: prompt }
    ],
  };

  // Use correct parameters based on model
  if (modelName === 'gpt-5-2025-08-07') {
    requestBody.max_completion_tokens = 2000;
    // GPT-5 doesn't support temperature parameter
  } else {
    requestBody.max_tokens = 2000;
    requestBody.temperature = 0.7;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'OpenAI API error');
  }

  const content = data.choices[0].message.content;
  return parseResponse(type, content);
}

// Import prompts from centralized repository
import { getDeepseekPrompts, getOpenAIPrompts } from './prompts.ts';

function parseResponse(type: string, content: string) {
  if (type === 'topic' || type === 'script') {
    return content.trim();
  }

  // For JSON responses, try to parse
  try {
    const parsed = JSON.parse(content);
    return parsed;
  } catch {
    // If JSON parsing fails, try to extract JSON from the content
    const jsonMatch = content.match(/\[.*\]|\{.*\}/s);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        throw new Error('Failed to parse AI response');
      }
    }
    throw new Error('Invalid response format from AI');
  }
}