import { supabase } from '@/integrations/supabase/client';
import { VideoProject } from '@/types';

export interface SavedProject {
  id: string;
  user_id: string;
  project_name: string;
  topic?: string;
  angle?: string;
  hook?: string;
  title?: string;
  thumbnail_prompt?: string;
  script?: string;
  image_video_prompts?: string;
  // Generated thumbnail data
  generated_thumbnails?: string; // JSON string of ThumbnailOption[]
  selected_thumbnail_id?: string;
  // Generated production images
  generated_production_images?: string; // JSON string of ProductionImageOption[]
  // Settings
  topic_settings?: string;
  angle_settings?: string;
  hook_settings?: string;
  title_settings?: string;
  thumbnail_settings?: string;
  script_settings?: string;
  production_settings?: string;
  created_at: string;
  updated_at: string;
}

export class SavedProjectsService {
  static async getUserSavedProjects(): Promise<SavedProject[]> {
    // Optimized query for list view - excludes large image columns
    const { data, error } = await supabase
      .from('saved_projects')
      .select(`
        id,
        user_id,
        project_name,
        topic,
        angle,
        hook,
        title,
        thumbnail_prompt,
        script,
        image_video_prompts,
        selected_thumbnail_id,
        topic_settings,
        angle_settings,
        hook_settings,
        title_settings,
        thumbnail_settings,
        script_settings,
        production_settings,
        created_at,
        updated_at
      `)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getSavedProjectById(id: string): Promise<SavedProject | null> {
    // Full query for detailed view - includes all columns
    const { data, error } = await supabase
      .from('saved_projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async saveProject(project: VideoProject, projectName: string): Promise<SavedProject> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('saved_projects')
      .insert({
        user_id: userData.user.id,
        project_name: projectName,
        topic: project.topic,
        angle: project.angle,
        hook: project.hook,
        title: project.title,
        thumbnail_prompt: project.thumbnailPrompt,
        script: project.script,
        image_video_prompts: project.imageVideoPrompts,
        generated_thumbnails: project.generatedThumbnails ? JSON.stringify(project.generatedThumbnails) : undefined,
        selected_thumbnail_id: project.selectedThumbnailId,
        generated_production_images: project.generatedProductionImages ? JSON.stringify(project.generatedProductionImages) : undefined,
        topic_settings: project.topicSettings,
        angle_settings: project.angleSettings,
        hook_settings: project.hookSettings,
        title_settings: project.titleSettings,
        thumbnail_settings: project.thumbnailSettings,
        script_settings: project.scriptSettings,
        production_settings: project.productionSettings,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateSavedProject(id: string, project: VideoProject, projectName: string): Promise<SavedProject> {
    const { data, error } = await supabase
      .from('saved_projects')
      .update({
        project_name: projectName,
        topic: project.topic,
        angle: project.angle,
        hook: project.hook,
        title: project.title,
        thumbnail_prompt: project.thumbnailPrompt,
        script: project.script,
        image_video_prompts: project.imageVideoPrompts,
        generated_thumbnails: project.generatedThumbnails ? JSON.stringify(project.generatedThumbnails) : undefined,
        selected_thumbnail_id: project.selectedThumbnailId,
        generated_production_images: project.generatedProductionImages ? JSON.stringify(project.generatedProductionImages) : undefined,
        topic_settings: project.topicSettings,
        angle_settings: project.angleSettings,
        hook_settings: project.hookSettings,
        title_settings: project.titleSettings,
        thumbnail_settings: project.thumbnailSettings,
        script_settings: project.scriptSettings,
        production_settings: project.productionSettings,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteSavedProject(id: string): Promise<void> {
    const { error } = await supabase
      .from('saved_projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static convertSavedProjectToVideoProject(savedProject: SavedProject): VideoProject {
    let generatedThumbnails = undefined;
    if (savedProject.generated_thumbnails) {
      try {
        generatedThumbnails = JSON.parse(savedProject.generated_thumbnails);
      } catch (error) {
        console.error('Failed to parse generated thumbnails:', error);
      }
    }

    let generatedProductionImages = undefined;
    if (savedProject.generated_production_images) {
      try {
        generatedProductionImages = JSON.parse(savedProject.generated_production_images);
      } catch (error) {
        console.error('Failed to parse generated production images:', error);
      }
    }

    return {
      id: crypto.randomUUID(), // Generate new ID for working project
      topic: savedProject.topic,
      angle: savedProject.angle,
      hook: savedProject.hook,
      title: savedProject.title,
      thumbnailPrompt: savedProject.thumbnail_prompt,
      script: savedProject.script,
      imageVideoPrompts: savedProject.image_video_prompts,
      generatedThumbnails,
      selectedThumbnailId: savedProject.selected_thumbnail_id,
      generatedProductionImages,
      topicSettings: savedProject.topic_settings,
      angleSettings: savedProject.angle_settings,
      hookSettings: savedProject.hook_settings,
      titleSettings: savedProject.title_settings,
      thumbnailSettings: savedProject.thumbnail_settings,
      scriptSettings: savedProject.script_settings,
      productionSettings: savedProject.production_settings,
      currentStep: 8, // Go to media generation step
      completedSteps: new Array(8).fill(true), // Mark all steps as completed
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}