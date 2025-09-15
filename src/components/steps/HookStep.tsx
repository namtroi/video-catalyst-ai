import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface HookStepProps {
  topic: string;
  angle: string;
  hook?: string;
  onHookChange: (hook: string) => void;
  onComplete: () => void;
  isCompleted: boolean;
  customSettings?: string;
}

export const HookStep = ({ 
  topic, 
  angle,
  hook, 
  onHookChange, 
  onComplete, 
  isCompleted,
  customSettings 
}: HookStepProps) => {
  const [selectedHook, setSelectedHook] = useState(hook || '');
  const [hooks, setHooks] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateHooks = async () => {
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const generatedHooks = [
        "Have you ever wondered why some people seem to have all the luck? Well, I discovered something that changed everything...",
        "What I'm about to show you goes against everything you've been told, but stick with me because the results will shock you...",
        "Three months ago, I thought I knew everything about this topic. I was wrong, and what I learned next completely blew my mind..."
      ];
      
      setHooks(generatedHooks);
      
      toast({
        title: "Hooks Generated!",
        description: "Three compelling video openers have been created.",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Try again or adjust settings",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectHook = () => {
    if (selectedHook) {
      onHookChange(selectedHook);
      onComplete();
    }
  };

  useEffect(() => {
    if (topic && angle && hooks.length === 0) {
      generateHooks();
    }
  }, [topic, angle]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Step 3: Hook
        </h2>
        <p className="text-muted-foreground">
          Select an attention-grabbing opener to hook viewers in the first 30-60 seconds
        </p>
      </div>

      <div className="space-y-3">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <h4 className="font-semibold text-foreground mb-2">Selected Topic:</h4>
            <p className="text-sm text-muted-foreground">{topic}</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <h4 className="font-semibold text-foreground mb-2">Selected Angle:</h4>
            <p className="text-sm text-muted-foreground">{angle}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {hooks.length > 0 ? (
          <RadioGroup
            value={selectedHook}
            onValueChange={setSelectedHook}
            disabled={isCompleted}
            className="space-y-3"
          >
            {hooks.map((hookOption, index) => (
              <Card key={index} className={`cursor-pointer transition-colors hover:shadow-card ${
                selectedHook === hookOption ? 'border-primary shadow-card' : ''
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value={hookOption} id={`hook-${index}`} className="mt-1" />
                    <Label htmlFor={`hook-${index}`} className="cursor-pointer flex-1">
                      <div className="font-medium text-foreground mb-2">
                        Hook {index + 1}
                      </div>
                      <div className="text-sm text-muted-foreground italic">
                        "{hookOption}"
                      </div>
                    </Label>
                  </div>
                </CardContent>
              </Card>
            ))}
          </RadioGroup>
        ) : (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-muted-foreground">Generating hooks...</span>
          </div>
        )}

        <Button
          onClick={generateHooks}
          disabled={isGenerating || isCompleted}
          variant="outline"
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Regenerating...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Re-generate Hooks
            </>
          )}
        </Button>

        <div className="flex items-center space-x-2 pt-4">
          <Checkbox
            id="select-hook"
            checked={isCompleted}
            onCheckedChange={handleSelectHook}
            disabled={!selectedHook || isCompleted}
          />
          <label
            htmlFor="select-hook"
            className={`text-sm font-medium cursor-pointer ${
              isCompleted ? 'text-success' : 'text-foreground'
            }`}
          >
            {isCompleted ? '✓ Hook Selected' : 'Select Hook'}
          </label>
        </div>
      </div>
    </div>
  );
};