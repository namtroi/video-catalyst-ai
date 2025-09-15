import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, RefreshCw, Video, Image as ImageIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { generateImageVideoPrompts } from '@/services/deepseekAI';

interface ProductionStepProps {
  script: string;
  imageVideoPrompts?: string;
  onImageVideoPromptsChange: (prompts: string) => void;
  onComplete: () => void;
  isCompleted: boolean;
  productionSettings?: string;
  onProductionSettingsChange: (settings: string) => void;
  onShowSummary?: () => void;
}

export const ProductionStep = ({ 
  script,
  imageVideoPrompts, 
  onImageVideoPromptsChange, 
  onComplete, 
  isCompleted,
  productionSettings,
  onProductionSettingsChange,
  onShowSummary 
}: ProductionStepProps) => {
  const [generatedPrompts, setGeneratedPrompts] = useState(imageVideoPrompts || '');
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePromptsFromAI = async () => {
    setIsGenerating(true);
    try {
      const prompts = await generateImageVideoPrompts(script, productionSettings);
      setGeneratedPrompts(prompts);
      
      toast({
        title: "Production Prompts Generated!",
        description: "Complete image and video prompts for your production pipeline have been created.",
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

  const handleSelectPrompts = () => {
    if (generatedPrompts) {
      onImageVideoPromptsChange(generatedPrompts);
      onComplete();
      // Trigger summary view after a short delay
      setTimeout(() => {
        onShowSummary?.();
      }, 500);
    }
  };

  useEffect(() => {
    if (script && !generatedPrompts) {
      generatePromptsFromAI();
    }
  }, [script]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Step 7: Production
        </h2>
        <p className="text-muted-foreground">
          Create image and video generation prompts for final production
        </p>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-4">
          <h4 className="font-semibold text-foreground mb-2">Script Overview:</h4>
          <p className="text-sm text-muted-foreground">
            {script.split('\n').slice(0, 3).join(' ').substring(0, 200)}...
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {generatedPrompts ? (
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <div className="flex items-center space-x-1">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  <Video className="w-4 h-4 text-primary" />
                </div>
                <span className="font-medium text-foreground">Production Prompts</span>
              </div>
              <Textarea
                value={generatedPrompts}
                readOnly
                className="min-h-[500px] resize-y text-sm font-mono"
              />
            </CardContent>
          </Card>
        ) : (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-muted-foreground">Generating production prompts...</span>
          </div>
        )}

        <Button
          onClick={generatePromptsFromAI}
          disabled={isGenerating || isCompleted}
          variant="outline"
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Regenerating Prompts...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Re-generate Prompts
            </>
          )}
        </Button>

        <div className="flex items-center space-x-2 pt-4">
          <Checkbox
            id="select-prompts"
            checked={isCompleted}
            onCheckedChange={handleSelectPrompts}
            disabled={!generatedPrompts || isCompleted}
          />
          <label
            htmlFor="select-prompts"
            className={`text-sm font-medium cursor-pointer ${
              isCompleted ? 'text-success' : 'text-foreground'
            }`}
          >
            {isCompleted ? '✓ Production Prompts Selected' : 'Select Production Prompts'}
          </label>
        </div>
      </div>
    </div>
  );
};