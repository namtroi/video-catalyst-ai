import { Check, ChevronRight, RotateCcw } from 'lucide-react';
import { StepData } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface SidebarProps {
  steps: StepData[];
  onStepClick: (step: number) => void;
  onStartOver: () => void;
}

export const Sidebar = ({ steps, onStepClick, onStartOver }: SidebarProps) => {
  const completedCount = steps.filter(step => step.isCompleted).length;
  const progressPercentage = (completedCount / steps.length) * 100;

  return (
    <div className="w-72 bg-card border-r border-border h-full flex flex-col">
      {/* Progress Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">
            YouTube Content Pipeline
          </h2>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Start Over?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reset all your progress and delete all generated content. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={onStartOver}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Start Over
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
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