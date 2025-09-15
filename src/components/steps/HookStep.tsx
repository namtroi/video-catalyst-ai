import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { generateHooks } from '@/services/deepseekAI';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface HookStepProps {
  topic?: string;
  angle?: string;
  hook?: string;
  onHookChange: (hook: string) => void;
  hookSettings?: string;
  onHookSettingsChange: (settings: string) => void;
}

export const HookStep = ({ 
  topic, 
  angle, 
  hook, 
  onHookChange, 
  hookSettings,
  onHookSettingsChange 
}: HookStepProps) => {
  const [selectedHook, setSelectedHook] = useState(hook || '');
  const [hooks, setHooks] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateHooksFromAI = async () => {
    if (!topic || !angle) return;
    
    setIsGenerating(true);
    try {
      const result = await generateHooks(topic, angle, hookSettings);
      setHooks(Array.isArray(result) ? result : (typeof result === 'string' ? result.split('\n').filter(line => line.trim()) : []));
      toast.success('Hooks generated successfully!');
    } catch (error) {
      toast.error('Failed to generate hooks. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectHook = (selectedHook: string) => {
    setSelectedHook(selectedHook);
    onHookChange(selectedHook);
  };

  useEffect(() => {
    if (topic && angle && hooks.length === 0) {
      generateHooksFromAI();
    }
  }, [topic, angle]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Step 3: Hook
        </h2>
        <p className="text-muted-foreground">
          Create an engaging opener that will hook your viewers from the start
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
        {isGenerating ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Generating hook suggestions...</p>
          </div>
        ) : hooks.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Choose a Hook:</h3>
            <RadioGroup
              value={selectedHook}
              onValueChange={handleSelectHook}
              className="space-y-3"
            >
              {hooks.map((hookOption, index) => (
                <Card key={index} className="shadow-card hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <RadioGroupItem 
                        value={hookOption} 
                        id={`hook-${index}`}
                        className="mt-1"
                      />
                      <Label 
                        htmlFor={`hook-${index}`} 
                        className="flex-1 text-sm leading-relaxed cursor-pointer"
                      >
                        {hookOption}
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </RadioGroup>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No hooks generated yet</p>
          </div>
        )}

        <Button
          onClick={generateHooksFromAI}
          disabled={isGenerating || !topic || !angle}
          variant="outline"
          className="w-full"
        >
          {isGenerating ? "Regenerating..." : "Re-generate Hooks"}
        </Button>

        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              Customize Generation Instructions
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Custom Instructions (optional)
              </label>
              <Textarea
                value={hookSettings || ''}
                onChange={(e) => onHookSettingsChange(e.target.value)}
                placeholder="e.g., Make it emotional, use curiosity gap, target specific audience..."
                className="min-h-[80px] resize-y"
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};