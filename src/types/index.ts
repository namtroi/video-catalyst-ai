export interface VideoProject {
  id: string;
  topic?: string;
  angle?: string;
  hook?: string;
  title?: string;
  thumbnailPrompt?: string;
  script?: string;
  imageVideoPrompts?: string;
  // Generated thumbnail data
  generatedThumbnails?: ThumbnailOption[];
  selectedThumbnailId?: string;
  // Step-specific custom settings
  topicSettings?: string;
  angleSettings?: string;
  hookSettings?: string;
  titleSettings?: string;
  thumbnailSettings?: string;
  scriptSettings?: string;
  productionSettings?: string;
  currentStep: number;
  completedSteps: boolean[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StepData {
  step: number;
  label: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isActive: boolean;
  isLocked: boolean;
}

export interface GenerationOption {
  id: string;
  text: string;
  selected?: boolean;
}

export interface AngleOption {
  id: string;
  description: string;
}

export interface HookOption {
  id: string;
  text: string;
}

export interface TitleOption {
  id: string;
  text: string;
}

export interface ThumbnailOption {
  id: string;
  text: string;
  imageUrl?: string;
  imageQuality?: 'standard' | '4k';
  imageModel?: ImageModel;
}

export interface ImageGenerationRequest {
  prompts: string[];
  quality: 'standard' | '4k';
  model: 'seedream-4' | 'flux-1.1-pro-ultra';
}

export type ImageModel = 'seedream-4' | 'flux-1.1-pro-ultra';

export interface GeneratedImage {
  promptId: string;
  imageUrl: string;
  quality: 'standard' | '4k';
}

export interface Scene {
  scene_number: number;
  image_prompt: string;
  video_prompt: string;
}

export interface ScenesResponse {
  scenes: Scene[];
}

export interface AIGenerationResponse {
  success: boolean;
  data?: string | GenerationOption[];
  error?: string;
}

export interface Template {
  id: string;
  user_id: string;
  name: string;
  topic_settings: string;
  angle_settings: string;
  hook_settings: string;
  title_settings: string;
  thumbnail_settings: string;
  script_settings: string;
  production_settings: string;
  created_at: Date;
  updated_at: Date;
}