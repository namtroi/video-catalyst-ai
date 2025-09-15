import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MainContentProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  canGoNext: boolean;
  canGoPrev: boolean;
  onNext: () => void;
  onPrev: () => void;
}

export const MainContent = ({
  children,
  currentStep,
  totalSteps,
  canGoNext,
  canGoPrev,
  onNext,
  onPrev,
}: MainContentProps) => {
  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Main Content Area */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="border-t border-border p-6 bg-card">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Button
            variant="outline"
            onClick={onPrev}
            disabled={!canGoPrev}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>

          <div className="text-sm text-muted-foreground">
            Step {currentStep} of {totalSteps}
          </div>

          <Button
            onClick={onNext}
            disabled={!canGoNext}
            className="flex items-center space-x-2 bg-gradient-primary hover:opacity-90"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};