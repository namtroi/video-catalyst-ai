import { useState, useEffect, useRef } from 'react';
import { VideoProject, Template, ThumbnailOption, ProductionImageOption } from '@/types';

const STORAGE_KEY = 'youtube-pipeline-project';
const SESSION_IMAGES_KEY = 'youtube-pipeline-session-images';

export const useProjectStore = () => {
  // Separate state for session images to prevent loss during localStorage operations
  const [sessionImages, setSessionImages] = useState<{
    thumbnails: ThumbnailOption[];
    productionImages: ProductionImageOption[];
  }>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_IMAGES_KEY);
      return saved ? JSON.parse(saved) : { thumbnails: [], productionImages: [] };
    } catch {
      return { thumbnails: [], productionImages: [] };
    }
  });

  const [project, setProject] = useState<VideoProject>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        createdAt: new Date(parsed.createdAt),
        updatedAt: new Date(parsed.updatedAt),
      };
    }
    
    return {
      id: crypto.randomUUID(),
      currentStep: 1,
      completedSteps: new Array(8).fill(false),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // Save session images separately
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_IMAGES_KEY, JSON.stringify(sessionImages));
    } catch (error) {
      console.warn('Failed to save session images:', error);
    }
  }, [sessionImages]);

  // Merge session images with project data for display
  const projectWithImages: VideoProject = {
    ...project,
    generatedThumbnails: sessionImages.thumbnails.length > 0 ? sessionImages.thumbnails : project.generatedThumbnails,
    generatedProductionImages: sessionImages.productionImages.length > 0 ? sessionImages.productionImages : project.generatedProductionImages,
  };

  useEffect(() => {
    try {
      // Create a lightweight version without heavy image data
      const toSave = {
        ...project,
        updatedAt: new Date(),
        // Store thumbnails without imageUrl to save space
        generatedThumbnails: project.generatedThumbnails?.map(thumbnail => ({
          ...thumbnail,
          imageUrl: undefined // Remove base64 data URLs
        })),
        // Store production images without imageUrl to save space
        generatedProductionImages: project.generatedProductionImages?.map(image => ({
          ...image,
          imageUrl: undefined // Remove base64 data URLs
        }))
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('LocalStorage quota exceeded. Clearing old data and retrying with minimal project data.');
        
        // Clear localStorage and save only essential data
        localStorage.removeItem(STORAGE_KEY);
        
        try {
          const minimalProject = {
            id: project.id,
            topic: project.topic,
            angle: project.angle,
            hook: project.hook,
            title: project.title,
            thumbnailPrompt: project.thumbnailPrompt,
            script: project.script,
            imageVideoPrompts: project.imageVideoPrompts,
            currentStep: project.currentStep,
            completedSteps: project.completedSteps,
            createdAt: project.createdAt,
            updatedAt: new Date(),
            // Store only metadata, not actual images
            thumbnailCount: project.generatedThumbnails?.length || 0,
            productionImageCount: project.generatedProductionImages?.length || 0
          };
          
          localStorage.setItem(STORAGE_KEY, JSON.stringify(minimalProject));
        } catch (retryError) {
          console.error('Failed to save even minimal project data:', retryError);
        }
      } else {
        console.error('Failed to save project:', error);
      }
    }
  }, [project]);

  const updateProject = (updates: Partial<VideoProject>) => {
    // Handle image updates separately
    if (updates.generatedThumbnails) {
      setSessionImages(prev => ({
        ...prev,
        thumbnails: updates.generatedThumbnails || []
      }));
    }
    
    if (updates.generatedProductionImages) {
      setSessionImages(prev => ({
        ...prev,
        productionImages: updates.generatedProductionImages || []
      }));
    }

    setProject(prev => ({
      ...prev,
      ...updates,
      updatedAt: new Date(),
    }));
  };

  const completeStep = (step: number) => {
    setProject(prev => {
      const newCompletedSteps = [...prev.completedSteps];
      newCompletedSteps[step - 1] = true;
      
      return {
        ...prev,
        completedSteps: newCompletedSteps,
        currentStep: Math.min(step + 1, 8),
        updatedAt: new Date(),
      };
    });
  };

  const goToStep = (step: number) => {
    // Only allow going to completed steps or the next available step
    const canAccess = step <= project.currentStep || project.completedSteps[step - 1];
    if (canAccess) {
      updateProject({ currentStep: step });
    }
  };

  const resetProject = () => {
    const newProject: VideoProject = {
      id: crypto.randomUUID(),
      currentStep: 1,
      completedSteps: new Array(8).fill(false),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setProject(newProject);
    setSelectedTemplate(null);
    
    // Clear session images
    setSessionImages({ thumbnails: [], productionImages: [] });
  };

  const applyTemplate = (template: Template | null) => {
    setSelectedTemplate(template);
    if (template) {
      updateProject({
        topicSettings: template.topic_settings,
        angleSettings: template.angle_settings,
        hookSettings: template.hook_settings,
        titleSettings: template.title_settings,
        thumbnailSettings: template.thumbnail_settings,
        scriptSettings: template.script_settings,
        productionSettings: template.production_settings,
      });
    }
  };

  return {
    project: projectWithImages,
    updateProject,
    completeStep,
    goToStep,
    resetProject,
    selectedTemplate,
    applyTemplate,
  };
};