const DEEPSEEK_API_KEY = 'sk-d9d31b467d314a63919561d49cc95637';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

interface DeepseekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export const generateWithDeepseek = async (prompt: string, customSettings?: string): Promise<string> => {
  try {
    const fullPrompt = customSettings 
      ? `${prompt}\n\nAdditional instructions: ${customSettings}`
      : prompt;

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: fullPrompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data: DeepseekResponse = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Deepseek API error:', error);
    throw new Error('Failed to generate content. Please try again.');
  }
};

export const generateTopic = async (customSettings?: string): Promise<string> => {
  const prompt = "Generate one engaging YouTube video topic for an 8-15 minute video, trending or evergreen. Output only the topic text.";
  return generateWithDeepseek(prompt, customSettings);
};

interface AngleOption {
  id: number;
  description: string;
}

interface AnglesResponse {
  angles: AngleOption[];
}

export const generateAngles = async (topic: string, customSettings?: string): Promise<AngleOption[]> => {
  const prompt = `From the topic '${topic}', generate 3 unique angles or viewpoints for a YouTube video (8-15 min). Each angle should be concise (1-2 sentences) and engaging.
  
  Respond ONLY with a valid JSON object in this exact structure:
{
  "angles": [
    {
      "id": 1,
      "description": "Full description of Angle 1 here."
    },
    {
      "id": 2,
      "description": "Full description of Angle 2 here."
    },
    {
      "id": 3,
      "description": "Full description of Angle 3 here."
    }
  ]
}

Do not include any additional text, explanations, or markdown outside the JSON.`;
  
  const response = await generateWithDeepseek(prompt, customSettings);
  
  try {
    // Clean the response to extract JSON
    const cleanedResponse = response.trim();
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : cleanedResponse;
    
    const parsedData: AnglesResponse = JSON.parse(jsonString);
    
    if (!parsedData.angles || !Array.isArray(parsedData.angles)) {
      throw new Error('Invalid angles format in response');
    }
    
    return parsedData.angles.slice(0, 3);
  } catch (error) {
    console.error('Failed to parse angles JSON:', error);
    // Fallback to line parsing if JSON fails
    const lines = response.split('\n').filter(line => line.trim());
    return lines.slice(0, 3).map((line, index) => ({
      id: index + 1,
      description: line.replace(/^\d+\.\s*/, '').trim()
    }));
  }
};

export const generateHooks = async (topic: string, angle: string, customSettings?: string): Promise<string[]> => {
  const prompt = `From the topic '${topic}' and angle '${angle}', generate 3 compelling video hooks (first 30-60 seconds script snippets) to hook viewers immediately. Make them intriguing and story-driven. Format as numbered list.

   
    Respond ONLY with a valid JSON object in this exact structure:
{
  "hooks": [
    {
    "hook_id": 1,
    "hook_text": "Full script snippet for Hook 1 here..."
  },
  {
    "hook_id": 2,
    "hook_text": "Full script snippet for Hook 2 here..."
  },
  {
    "hook_id": 3,
    "hook_text": "Full script snippet for Hook 3 here..."
  }
  ]
}

Do not include any additional text, explanations, or markdown outside the JSON.
  
  
  `;
  const response = await generateWithDeepseek(prompt, customSettings);
  
  const lines = response.split('\n').filter(line => line.trim());
  return lines.slice(0, 3).map(line => line.replace(/^\d+\.\s*/, '').trim());
};

export const generateTitles = async (topic: string, angle: string, hook: string, customSettings?: string): Promise<string[]> => {
  const prompt = `From the hook '${hook}' (and underlying topic/angle), generate 3 SEO-optimized YouTube titles that are clickbait-y yet honest, under 60 characters each. Aim for curiosity or benefit-driven. Format as numbered list.
  
  
  Respond ONLY with a valid JSON object in this exact structure:
{
  "titles": [
    {
      "title_id": 1,
      "title_text": "Full title text for Title 1 here..."
    },
    {
      "title_id": 2,
      "title_text": "Full title text for Title 2 here..."
    },
    {
      "title_id": 3,
      "title_text": "Full title text for Title 3 here..."
    }
  ]
}Do not include any additional text, explanations, or markdown outside the JSON.


  
  
  `;
  const response = await generateWithDeepseek(prompt, customSettings);
  
  const lines = response.split('\n').filter(line => line.trim());
  return lines.slice(0, 3).map(line => line.replace(/^\d+\.\s*/, '').trim());
};

export const generateThumbnailPrompts = async (title: string, hook: string, customSettings?: string): Promise<string[]> => {
  const prompt = `From the title '${title}' and hook '${hook}', generate 3 detailed DALL-E/Midjourney-style prompts for YouTube thumbnails. Each should be visually striking, high-contrast, with text overlay ideas, optimized for 1280x720. Format as numbered list.
  
  
  Respond ONLY with a valid JSON object in this exact structure:
{
  "thumbnail_prompts": [
    {
      "prompt_id": 1,
      "prompt_text": "Detailed prompt for Thumbnail 1 here..."
    },
    {
      "prompt_id": 2,
      "prompt_text": "Detailed prompt for Thumbnail 2 here..."
    },
    {
      "prompt_id": 3,
      "prompt_text": "Detailed prompt for Thumbnail 3 here..."
    }
  ]
}Do not include any additional text, explanations, or markdown outside the JSON.


  
  
  `;
  const response = await generateWithDeepseek(prompt, customSettings);
  
  const lines = response.split('\n').filter(line => line.trim());
  return lines.slice(0, 3).map(line => line.replace(/^\d+\.\s*/, '').trim());
};

export const generateScript = async (title: string, hook: string, customSettings?: string): Promise<string> => {
  const prompt = `From the title '${title}', hook '${hook}', and overall topic/angle, generate a complete YouTube video script for 8-15 minutes. Structure: Intro (hook), Body (3-5 sections with key points/transitions), Outro (CTA). Word count ~1200-2200. Output the entire script as pure plain text only, with no markdown, code blocks, bullet points, or any other formatting—just continuous readable text with natural paragraphs and line breaks for sections.`;
  return generateWithDeepseek(prompt, customSettings);
};

export const generateImageVideoPrompts = async (script: string, customSettings?: string): Promise<string> => {
  const prompt = `From the full script '${script}', break it into 10-20 scene segments. For each: Generate a detailed image prompt (DALL-E style for static visuals) and a Veo 3 video prompt (for animating the image into 5-10 second clips). Ensure consistency in style/theme. Output as a numbered list with format: "Scene X: Image Prompt: [prompt] | Video Prompt: [prompt]"`;
  return generateWithDeepseek(prompt, customSettings);
};