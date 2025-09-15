import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { MainContent } from '@/components/layout/MainContent';
import { SettingsPanel } from '@/components/layout/SettingsPanel';
import { TopicStep } from '@/components/steps/TopicStep';
import { AngleStep } from '@/components/steps/AngleStep';
import { HookStep } from '@/components/steps/HookStep';
import { TitleStep } from '@/components/steps/TitleStep';
import { ThumbnailStep } from '@/components/steps/ThumbnailStep';
import { ScriptStep } from '@/components/steps/ScriptStep';
import { ProductionStep } from '@/components/steps/ProductionStep';
import { useProjectStore } from '@/hooks/useProjectStore';
import { StepData } from '@/types';

const Index = () => {
  const { project, updateProject, completeStep, goToStep } = useProjectStore();

  const steps: StepData[] = [
    {
      step: 1,
      label: "Step 1: Topic",
      title: "Topic",
      description: "Enter or generate a video idea",
      isCompleted: project.completedSteps[0],
      isActive: project.currentStep === 1,
      isLocked: false,
    },
    {
      step: 2,
      label: "Step 2: Angle",
      title: "Angle",
      description: "Choose a perspective for your topic",
      isCompleted: project.completedSteps[1],
      isActive: project.currentStep === 2,
      isLocked: !project.completedSteps[0],
    },
    {
      step: 3,
      label: "Step 3: Hook",
      title: "Hook",
      description: "Select an attention-grabbing opener",
      isCompleted: project.completedSteps[2],
      isActive: project.currentStep === 3,
      isLocked: !project.completedSteps[1],
    },
    {
      step: 4,
      label: "Step 4: Title",
      title: "Title",
      description: "Pick a clickable video title",
      isCompleted: project.completedSteps[3],
      isActive: project.currentStep === 4,
      isLocked: !project.completedSteps[2],
    },
    {
      step: 5,
      label: "Step 5: Thumbnail",
      title: "Thumbnail",
      description: "Generate image prompts for visuals",
      isCompleted: project.completedSteps[4],
      isActive: project.currentStep === 5,
      isLocked: !project.completedSteps[3],
    },
    {
      step: 6,
      label: "Step 6: Script",
      title: "Script",
      description: "Build the full video outline",
      isCompleted: project.completedSteps[5],
      isActive: project.currentStep === 6,
      isLocked: !project.completedSteps[4],
    },
    {
      step: 7,
      label: "Step 7: Production",
      title: "Production",
      description: "Create image and video generation prompts",
      isCompleted: project.completedSteps[6],
      isActive: project.currentStep === 7,
      isLocked: !project.completedSteps[5],
    },
  ];

  const handleStepComplete = (step: number) => {
    completeStep(step);
  };

  const handleNext = () => {
    if (project.currentStep < 7) {
      goToStep(project.currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (project.currentStep > 1) {
      goToStep(project.currentStep - 1);
    }
  };

  const canGoNext = project.currentStep < 7 && project.completedSteps[project.currentStep - 1];
  const canGoPrev = project.currentStep > 1;

  const renderCurrentStep = () => {
    switch (project.currentStep) {
      case 1:
        return (
          <TopicStep
            topic={project.topic}
            onTopicChange={(topic) => updateProject({ topic })}
            onComplete={() => handleStepComplete(1)}
            isCompleted={project.completedSteps[0]}
            customSettings={project.customSettings}
          />
        );
      case 2:
        return (
          <AngleStep
            topic={project.topic!}
            angle={project.angle}
            onAngleChange={(angle) => updateProject({ angle })}
            onComplete={() => handleStepComplete(2)}
            isCompleted={project.completedSteps[1]}
            customSettings={project.customSettings}
          />
        );
      case 3:
        return (
          <HookStep
            topic={project.topic!}
            angle={project.angle!}
            hook={project.hook}
            onHookChange={(hook) => updateProject({ hook })}
            onComplete={() => handleStepComplete(3)}
            isCompleted={project.completedSteps[2]}
            customSettings={project.customSettings}
          />
        );
      case 4:
        return (
          <TitleStep
            topic={project.topic!}
            angle={project.angle!}
            hook={project.hook!}
            title={project.title}
            onTitleChange={(title) => updateProject({ title })}
            onComplete={() => handleStepComplete(4)}
            isCompleted={project.completedSteps[3]}
            customSettings={project.customSettings}
          />
        );
      case 5:
        return (
          <ThumbnailStep
            title={project.title!}
            hook={project.hook!}
            thumbnailPrompt={project.thumbnailPrompt}
            onThumbnailPromptChange={(thumbnailPrompt) => updateProject({ thumbnailPrompt })}
            onComplete={() => handleStepComplete(5)}
            isCompleted={project.completedSteps[4]}
            customSettings={project.customSettings}
          />
        );
      case 6:
        return (
          <ScriptStep
            title={project.title!}
            hook={project.hook!}
            script={project.script}
            onScriptChange={(script) => updateProject({ script })}
            onComplete={() => handleStepComplete(6)}
            isCompleted={project.completedSteps[5]}
            customSettings={project.customSettings}
          />
        );
      case 7:
        return (
          <ProductionStep
            script={project.script!}
            imageVideoPrompts={project.imageVideoPrompts}
            onImageVideoPromptsChange={(imageVideoPrompts) => updateProject({ imageVideoPrompts })}
            onComplete={() => handleStepComplete(7)}
            isCompleted={project.completedSteps[6]}
            customSettings={project.customSettings}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-background flex">
      {/* Left Sidebar */}
      <Sidebar 
        steps={steps} 
        onStepClick={goToStep}
      />

      {/* Main Content */}
      <MainContent
        currentStep={project.currentStep}
        totalSteps={7}
        canGoNext={canGoNext}
        canGoPrev={canGoPrev}
        onNext={handleNext}
        onPrev={handlePrev}
      >
        {renderCurrentStep()}
      </MainContent>

      {/* Right Settings Panel */}
      <SettingsPanel
        customSettings={project.customSettings || ''}
        onSettingsChange={(customSettings) => updateProject({ customSettings })}
      />
    </div>
  );
};

export default Index;