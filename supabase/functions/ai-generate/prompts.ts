/**
 * Centralized prompt repository for AI content generation
 * Contains all prompts for YouTube content creation pipeline
 */

export function getDeepseekPrompts() {
  return {
    topic: `Generate a trending YouTube video topic that would be engaging and viral. Focus on current trends, popular culture, technology, lifestyle, or educational content. Return just the topic text, no additional formatting.`,
    
    angles: (topic: string) => `Based on the topic "${topic}", generate 3 unique angles or perspectives to approach this topic. Each angle should be distinct and compelling. Return the response in this exact JSON format:
[
  {"id": "1", "description": "First angle description"},
  {"id": "2", "description": "Second angle description"},
  {"id": "3", "description": "Third angle description"}
]`,
    
    hooks: (topic: string, angle: string) => `Create 3 compelling YouTube video hooks for the topic "${topic}" with the angle "${angle}". Each hook should grab attention in the first few seconds. Return the response in this exact JSON format:
[
  {"id": "1", "text": "First hook text"},
  {"id": "2", "text": "Second hook text"},
  {"id": "3", "text": "Third hook text"}
]`,
    
    titles: (topic: string, angle: string, hook: string) => `Generate 3 SEO-optimized YouTube titles based on:
- Topic: "${topic}"
- Angle: "${angle}"
- Hook: "${hook}"

Each title should be under 60 characters, engaging, and optimized for YouTube search. Return the response in this exact JSON format:
[
  {"id": "1", "text": "First title"},
  {"id": "2", "text": "Second title"},
  {"id": "3", "text": "Third title"}
]`,
    
    thumbnails: (title: string, hook: string) => `Create 3 detailed thumbnail prompts for DALL-E/Midjourney based on:
- Title: "${title}"
- Hook: "${hook}"

Each prompt should describe visual elements, colors, composition, and text overlay. Return the response in this exact JSON format:
[
  {"id": "1", "text": "First thumbnail prompt"},
  {"id": "2", "text": "Second thumbnail prompt"},
  {"id": "3", "text": "Third thumbnail prompt"}
]`,
    
    script: (title: string, hook: string) => `Write a complete YouTube video script based on:
- Title: "${title}"
- Hook: "${hook}"

The script should be engaging, well-structured with clear sections, and approximately 5-10 minutes when spoken. Include the hook at the beginning and maintain viewer engagement throughout.`,
    
    scenes: (script: string) => `Break down this YouTube script into scenes for video production:

"${script}"

Analyze the script and create scenes with image and video prompts for each segment. Return the response in this exact JSON format:
{
  "scenes": [
    {
      "scene_number": 1,
      "image_prompt": "Detailed prompt for scene image",
      "video_prompt": "Detailed prompt for scene video"
    }
  ]
}`
  };
}

export function getOpenAIPrompts() {
  // Use the same prompts as Deepseek for consistency
  return getDeepseekPrompts();
}