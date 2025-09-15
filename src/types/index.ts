export interface VideoProject {
  id: string;
  topic?: string;
  angle?: string;
  hook?: string;
  title?: string;
  thumbnailPrompt?: string;
  script?: string;
  imageVideoPrompts?: string;
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

export interface AIGenerationResponse {
  success: boolean;
  data?: string | GenerationOption[];
  error?: string;
}