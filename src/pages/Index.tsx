import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/hooks/useProjectStore';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from '@/components/layout/Sidebar';
import { MainContent } from '@/components/layout/MainContent';
import { SavedProjectsLibrary } from '@/components/SavedProjectsLibrary';
import { SavedProjectsService, SavedProject } from '@/services/savedProjectsService';

import { SettingsModal } from '@/components/SettingsModal';
import { TopicStep } from '@/components/steps/TopicStep';
import { AngleStep } from '@/components/steps/AngleStep';
import { HookStep } from '@/components/steps/HookStep';
import { TitleStep } from '@/components/steps/TitleStep';
import { ThumbnailStep } from '@/components/steps/ThumbnailStep';
import { ScriptStep } from '@/components/steps/ScriptStep';
import { ProductionStep } from '@/components/steps/ProductionStep';
import { ProjectSummary } from '@/components/ProjectSummary';
import { Button } from '@/components/ui/button';
import { Settings, LogOut, Youtube } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AIModel } from '@/services/aiService';
import { toast } from '@/components/ui/use-toast';

interface StepData {
  label: string;
  title: string;
  description: string;
  completed: boolean;
  active: boolean;
  locked: boolean;
}

export default function Index() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { project, updateProject, completeStep, resetProject, selectedTemplate, applyTemplate } = useProjectStore();
  const [showSummary, setShowSummary] = useState(false);
  const [showSavedProjects, setShowSavedProjects] = useState(false);
  const [viewingSavedProject, setViewingSavedProject] = useState<SavedProject | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [userSettings, setUserSettings] = useState<{selected_model: AIModel} | null>(null);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Load user settings
  useEffect(() => {
    if (user) {
      loadUserSettings();
    }
  }, [user]);

  const loadUserSettings = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_settings')
      .select('selected_model')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setUserSettings({ selected_model: data.selected_model as AIModel });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const totalSteps = 7;

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1: return !!project.topic?.trim();
      case 2: return !!project.angle?.trim();
      case 3: return !!project.hook?.trim();
      case 4: return !!project.title?.trim();
      case 5: return !!project.thumbnailPrompt?.trim();
      case 6: return !!project.script?.trim();
      case 7: return !!project.imageVideoPrompts?.trim();
      default: return false;
    }
  };

  const handleNext = () => {
    const currentStepValid = isStepValid(project.currentStep);
    if (currentStepValid && project.currentStep < totalSteps) {
      completeStep(project.currentStep);
    }
  };

  const handlePrev = () => {
    if (project.currentStep > 1) {
      updateProject({ currentStep: project.currentStep - 1 });
    }
  };

  const handleStartOver = () => {
    resetProject();
    setShowSummary(false);
    setShowSavedProjects(false);
    setViewingSavedProject(null);
    toast({
      title: "Project Reset",
      description: "Starting fresh with a new project.",
    });
  };

  const handleViewSavedProjects = () => {
    setShowSavedProjects(true);
    setShowSummary(false);
    setViewingSavedProject(null);
  };

  const handleViewSavedProject = (savedProject: SavedProject) => {
    setViewingSavedProject(savedProject);
    setShowSavedProjects(false);
    setShowSummary(true);
  };

  const handleBackFromSavedProject = () => {
    if (viewingSavedProject) {
      setShowSavedProjects(true);
      setViewingSavedProject(null);
      setShowSummary(false);
    } else {
      setShowSummary(false);
    }
  };

  const handleBackToDashboard = () => {
    setShowSavedProjects(false);
    setShowSummary(false);
    setViewingSavedProject(null);
  };


  const steps = [
    { 
      step: 1,
      label: "Topic",
      title: "Choose Topic",
      description: "Select your video idea",
      isCompleted: project.completedSteps[0],
      isActive: project.currentStep === 1,
      isLocked: false
    },
    { 
      step: 2,
      label: "Angle",
      title: "Define Angle", 
      description: "Choose your perspective",
      isCompleted: project.completedSteps[1],
      isActive: project.currentStep === 2,
      isLocked: project.currentStep < 2 && !project.completedSteps[0]
    },
    { 
      step: 3,
      label: "Hook",
      title: "Create Hook",
      description: "Write engaging opener", 
      isCompleted: project.completedSteps[2],
      isActive: project.currentStep === 3,
      isLocked: project.currentStep < 3 && !project.completedSteps[1]
    },
    { 
      step: 4,
      label: "Title",
      title: "Generate Title",
      description: "Create compelling title",
      isCompleted: project.completedSteps[3],
      isActive: project.currentStep === 4,
      isLocked: project.currentStep < 4 && !project.completedSteps[2]
    },
    { 
      step: 5,
      label: "Thumbnail", 
      title: "Design Thumbnail",
      description: "Create thumbnail prompt",
      isCompleted: project.completedSteps[4],
      isActive: project.currentStep === 5,
      isLocked: project.currentStep < 5 && !project.completedSteps[3]
    },
    { 
      step: 6,
      label: "Script",
      title: "Write Script",
      description: "Generate video script",
      isCompleted: project.completedSteps[5],
      isActive: project.currentStep === 6,
      isLocked: project.currentStep < 6 && !project.completedSteps[4]
    },
    { 
      step: 7,
      label: "Production",
      title: "Production Ready",
      description: "Generate final prompts",
      isCompleted: project.completedSteps[6],
      isActive: project.currentStep === 7,
      isLocked: project.currentStep < 7 && !project.completedSteps[5]
    },
  ];

  const renderCurrentStep = () => {
    const selectedModel = userSettings?.selected_model || 'deepseek';
    
    switch (project.currentStep) {
      case 1:
        return (
          <TopicStep
            topic={project.topic}
            onTopicChange={(topic) => updateProject({ topic })}
            topicSettings={project.topicSettings}
            onTopicSettingsChange={(topicSettings) => updateProject({ topicSettings })}
            selectedModel={selectedModel}
            selectedTemplate={selectedTemplate}
            onTemplateSelect={applyTemplate}
            currentStep={project.currentStep}
          />
        );
      case 2:
        return (
          <AngleStep
            topic={project.topic}
            angle={project.angle}
            onAngleChange={(angle) => updateProject({ angle })}
            angleSettings={project.angleSettings}
            onAngleSettingsChange={(angleSettings) => updateProject({ angleSettings })}
            selectedModel={selectedModel}
          />
        );
      case 3:
        return (
          <HookStep
            topic={project.topic}
            angle={project.angle}
            hook={project.hook}
            onHookChange={(hook) => updateProject({ hook })}
            hookSettings={project.hookSettings}
            onHookSettingsChange={(hookSettings) => updateProject({ hookSettings })}
            selectedModel={selectedModel}
          />
        );
      case 4:
        return (
          <TitleStep
            topic={project.topic}
            angle={project.angle}
            hook={project.hook}
            title={project.title}
            onTitleChange={(title) => updateProject({ title })}
            titleSettings={project.titleSettings}
            onTitleSettingsChange={(titleSettings) => updateProject({ titleSettings })}
            selectedModel={selectedModel}
          />
        );
      case 5:
        return (
          <ThumbnailStep
            title={project.title}
            hook={project.hook}
            thumbnailPrompt={project.thumbnailPrompt}
            onThumbnailPromptChange={(prompt) => updateProject({ thumbnailPrompt: prompt })}
            thumbnailSettings={project.thumbnailSettings}
            onThumbnailSettingsChange={(thumbnailSettings) => updateProject({ thumbnailSettings })}
            selectedModel={selectedModel}
          />
        );
      case 6:
        return (
          <ScriptStep
            title={project.title}
            hook={project.hook}
            script={project.script}
            onScriptChange={(script) => updateProject({ script })}
            scriptSettings={project.scriptSettings}
            onScriptSettingsChange={(scriptSettings) => updateProject({ scriptSettings })}
            selectedModel={selectedModel}
          />
        );
      case 7:
        return (
          <ProductionStep
            script={project.script}
            imageVideoPrompts={project.imageVideoPrompts}
            onImageVideoPromptsChange={(prompts) => updateProject({ imageVideoPrompts: prompts })}
            productionSettings={project.productionSettings}
            onProductionSettingsChange={(productionSettings) => updateProject({ productionSettings })}
            onShowSummary={() => setShowSummary(true)}
            selectedModel={selectedModel}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Youtube className="h-12 w-12 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground">Loading YouTube Catalyst...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (showSavedProjects && !viewingSavedProject) {
    return (
      <SavedProjectsLibrary 
        onViewProject={handleViewSavedProject} 
        onBackToDashboard={handleBackToDashboard}
      />
    );
  }

  if (showSummary) {
    const displayProject = viewingSavedProject 
      ? SavedProjectsService.convertSavedProjectToVideoProject(viewingSavedProject)
      : project;
    
    return (
      <div className="min-h-screen bg-background">
        <ProjectSummary 
          project={displayProject} 
          onBackToSteps={viewingSavedProject ? handleBackFromSavedProject : () => setShowSummary(false)}
          onViewSavedProjects={!viewingSavedProject ? handleViewSavedProjects : undefined}
          isReadOnly={!!viewingSavedProject}
          savedProjectName={viewingSavedProject?.project_name}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar 
        steps={steps}
        onStepClick={() => {}} // Navigation handled by next/prev buttons
        onStartOver={handleStartOver}
      />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-card">
          <div className="flex items-center gap-3">
            <Youtube className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-semibold">YouTube Catalyst</h1>
            {userSettings && (
              <span className="text-sm text-muted-foreground px-2 py-1 bg-muted rounded">
                {userSettings.selected_model === 'deepseek' ? 'Deepseek' : 'ChatGPT'}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleViewSavedProjects}>
              My Projects
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        <MainContent
          currentStep={project.currentStep}
          totalSteps={totalSteps}
          canGoNext={project.currentStep < totalSteps && isStepValid(project.currentStep)}
          canGoPrev={project.currentStep > 1}
          onNext={handleNext}
          onPrev={handlePrev}
        >
          {renderCurrentStep()}
        </MainContent>
      </div>

      <SettingsModal 
        open={showSettings} 
        onOpenChange={setShowSettings} 
      />
    </div>
  );
}