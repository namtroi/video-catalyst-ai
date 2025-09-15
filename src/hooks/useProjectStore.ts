import { useState, useEffect } from 'react';
import { VideoProject } from '@/types';

const STORAGE_KEY = 'youtube-pipeline-project';

export const useProjectStore = () => {
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
      completedSteps: new Array(7).fill(false),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  useEffect(() => {
    const toSave = {
      ...project,
      updatedAt: new Date(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }, [project]);

  const updateProject = (updates: Partial<VideoProject>) => {
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
        currentStep: Math.min(step + 1, 7),
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
      completedSteps: new Array(7).fill(false),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setProject(newProject);
  };

  return {
    project,
    updateProject,
    completeStep,
    goToStep,
    resetProject,
  };
};