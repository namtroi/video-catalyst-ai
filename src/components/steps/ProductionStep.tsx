import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { generateImageVideoPrompts } from '@/services/deepseekAI';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface ProductionStepProps {
  script?: string;
  imageVideoPrompts?: string;
  onImageVideoPromptsChange: (prompts: string) => void;
  productionSettings?: string;
  onProductionSettingsChange: (settings: string) => void;
  onShowSummary: () => void;
}

export const ProductionStep = ({ 
  script, 
  imageVideoPrompts, 
  onImageVideoPromptsChange, 
  productionSettings,
  onProductionSettingsChange,
  onShowSummary 
}: ProductionStepProps) => {
  const [generatedPrompts, setGeneratedPrompts] = useState(imageVideoPrompts || '');
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePromptsFromAI = async () => {
    if (!script) return;
    
    setIsGenerating(true);
    try {
      const result = await generateImageVideoPrompts(script, productionSettings);
      setGeneratedPrompts(result);
      onImageVideoPromptsChange(result);
      toast.success('Production prompts generated successfully!');
    } catch (error) {
      toast.error('Failed to generate production prompts. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectPrompts = () => {
    if (generatedPrompts) {
      onImageVideoPromptsChange(generatedPrompts);
      onShowSummary();
    }
  };

  useEffect(() => {
    if (script && !imageVideoPrompts) {
      generatePromptsFromAI();
    } else if (imageVideoPrompts) {
      setGeneratedPrompts(imageVideoPrompts);
    }
  }, [script, imageVideoPrompts]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Step 7: Production
        </h2>
        <p className="text-muted-foreground">
          Generate prompts for images and video clips based on your script
        </p>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-4">
          <h4 className="font-semibold text-foreground mb-2">Script Preview:</h4>
          <div className="text-sm text-muted-foreground max-h-32 overflow-y-auto border rounded p-2 bg-muted/50">
            {script?.substring(0, 200)}...
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Generated Image & Video Prompts
          </label>
          <Textarea
            value={generatedPrompts}
            onChange={(e) => {
              setGeneratedPrompts(e.target.value);
              onImageVideoPromptsChange(e.target.value);
            }}
            placeholder={isGenerating ? "Generating prompts..." : "Your production prompts will appear here"}
            className="min-h-[300px] resize-y"
            readOnly={isGenerating}
          />
        </div>

        <Button
          onClick={generatePromptsFromAI}
          disabled={isGenerating || !script}
          variant="outline"
          className="w-full"
        >
          {isGenerating ? "Regenerating..." : "Re-generate Prompts"}
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
                value={productionSettings || ''}
                onChange={(e) => onProductionSettingsChange(e.target.value)}
                placeholder="e.g., Focus on high-quality visuals, include specific shot types, target specific mood..."
                className="min-h-[80px] resize-y"
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Show Summary Button */}
        <Button
          onClick={handleSelectPrompts}
          disabled={!generatedPrompts}
          className="w-full bg-gradient-primary hover:opacity-90"
        >
          Show Project Summary
        </Button>
      </div>
    </div>
  );
};