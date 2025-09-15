import { useState } from 'react';
import { useProjectStore } from '@/hooks/useProjectStore';
import { Sidebar } from '@/components/layout/Sidebar';
import { MainContent } from '@/components/layout/MainContent';
import { TopicStep } from '@/components/steps/TopicStep';
import { AngleStep } from '@/components/steps/AngleStep';
import { HookStep } from '@/components/steps/HookStep';
import { TitleStep } from '@/components/steps/TitleStep';
import { ThumbnailStep } from '@/components/steps/ThumbnailStep';
import { ScriptStep } from '@/components/steps/ScriptStep';
import { ProductionStep } from '@/components/steps/ProductionStep';
import { ProjectSummary } from '@/components/ProjectSummary';
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
  const { project, updateProject, completeStep, resetProject } = useProjectStore();
  const [showSummary, setShowSummary] = useState(false);

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
      // Auto-complete current step and move to next
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
    toast({
      title: "Project Reset",
      description: "Starting fresh with a new project.",
    });
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
    switch (project.currentStep) {
        case 1:
          return (
            <TopicStep
              topic={project.topic}
              onTopicChange={(topic) => updateProject({ topic })}
              topicSettings={project.topicSettings}
              onTopicSettingsChange={(topicSettings) => updateProject({ topicSettings })}
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
          />
        );
      case 5:
        return (
          <ThumbnailStep
            title={project.title}
            hook={project.hook}
            prompt={project.thumbnailPrompt}
            onPromptChange={(prompt) => updateProject({ thumbnailPrompt: prompt })}
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
          />
        );
      default:
        return null;
    }
  };

  if (showSummary) {
    return (
      <div className="min-h-screen bg-background">
        <ProjectSummary 
          project={project} 
          onBackToSteps={() => setShowSummary(false)}
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
  );
}