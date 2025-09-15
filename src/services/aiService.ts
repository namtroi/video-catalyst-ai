import { supabase } from '@/integrations/supabase/client';
import { AngleOption, HookOption, TitleOption, ThumbnailOption, ScenesResponse } from '@/types';

export type AIModel = 'deepseek' | 'openai-gpt4o-mini' | 'openai-gpt5';

interface AIGenerationRequest {
  type: 'topic' | 'angles' | 'hooks' | 'titles' | 'thumbnails' | 'script' | 'scenes';
  model: AIModel;
  customSettings?: string;
  // Request-specific data
  topic?: string;
  angle?: string;
  hook?: string;
  title?: string;
  script?: string;
}

class AIService {
  async generateWithAI<T>(request: AIGenerationRequest): Promise<T> {
    const { data, error } = await supabase.functions.invoke('ai-generate', {
      body: request
    });

    if (error) {
      throw new Error(error.message || 'AI generation failed');
    }

    return data;
  }

  async generateTopic(model: AIModel, customSettings?: string): Promise<string> {
    return this.generateWithAI<string>({
      type: 'topic',
      model,
      customSettings
    });
  }

  async generateAngles(topic: string, model: AIModel, customSettings?: string): Promise<AngleOption[]> {
    return this.generateWithAI<AngleOption[]>({
      type: 'angles',
      model,
      customSettings,
      topic
    });
  }

  async generateHooks(topic: string, angle: string, model: AIModel, customSettings?: string): Promise<HookOption[]> {
    return this.generateWithAI<HookOption[]>({
      type: 'hooks',
      model,
      customSettings,
      topic,
      angle
    });
  }

  async generateTitles(topic: string, angle: string, hook: string, model: AIModel, customSettings?: string): Promise<TitleOption[]> {
    return this.generateWithAI<TitleOption[]>({
      type: 'titles',
      model,
      customSettings,
      topic,
      angle,
      hook
    });
  }

  async generateThumbnailPrompts(title: string, hook: string, model: AIModel, customSettings?: string): Promise<ThumbnailOption[]> {
    return this.generateWithAI<ThumbnailOption[]>({
      type: 'thumbnails',
      model,
      customSettings,
      title,
      hook
    });
  }

  async generateScript(title: string, hook: string, model: AIModel, customSettings?: string): Promise<string> {
    return this.generateWithAI<string>({
      type: 'script',
      model,
      customSettings,
      title,
      hook
    });
  }

  async generateImageVideoPrompts(script: string, model: AIModel, customSettings?: string): Promise<ScenesResponse> {
    return this.generateWithAI<ScenesResponse>({
      type: 'scenes',
      model,
      customSettings,
      script
    });
  }
}

export const aiService = new AIService();