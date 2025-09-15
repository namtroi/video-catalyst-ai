import { Check, ChevronRight } from 'lucide-react';
import { StepData } from '@/types';
import { cn } from '@/lib/utils';

interface SidebarProps {
  steps: StepData[];
  onStepClick: (step: number) => void;
}

export const Sidebar = ({ steps, onStepClick }: SidebarProps) => {
  const completedCount = steps.filter(step => step.isCompleted).length;
  const progressPercentage = (completedCount / steps.length) * 100;

  return (
    <div className="w-72 bg-card border-r border-border h-full flex flex-col">
      {/* Progress Header */}
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground mb-3">
          YouTube Content Pipeline
        </h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progress</span>
            <span>{completedCount}/{steps.length} steps</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className="bg-gradient-primary h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Steps Navigation */}
      <div className="flex-1 p-4 space-y-2">
        {steps.map((step) => (
          <button
            key={step.step}
            onClick={() => !step.isLocked && onStepClick(step.step)}
            disabled={step.isLocked}
            className={cn(
              "w-full text-left p-4 rounded-lg transition-all duration-200 group relative",
              "border border-transparent hover:border-border",
              step.isCompleted && "bg-success/5 border-success/20",
              step.isActive && !step.isCompleted && "bg-primary/5 border-primary/20",
              step.isLocked && "opacity-50 cursor-not-allowed",
              !step.isLocked && "hover:shadow-card"
            )}
          >
            <div className="flex items-center space-x-3">
              {/* Step Indicator */}
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                step.isCompleted && "bg-success text-success-foreground",
                step.isActive && !step.isCompleted && "bg-primary text-primary-foreground",
                !step.isActive && !step.isCompleted && "bg-muted text-muted-foreground"
              )}>
                {step.isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  step.step
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-foreground truncate">
                  {step.label}
                </div>
                <div className="text-xs text-muted-foreground truncate mt-1">
                  {step.description}
                </div>
              </div>

              {/* Arrow Indicator */}
              {!step.isLocked && (
                <ChevronRight className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-1",
                  step.isActive && "text-primary"
                )} />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};