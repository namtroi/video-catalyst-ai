import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { aiService, AIModel } from '@/services/aiService';
import { ScenesResponse } from '@/types';
import { Sparkles } from 'lucide-react';

interface ProductionStepProps {
  topic?: string;
  angle?: string;
  hook?: string;
  title?: string;
  thumbnailPrompt?: string;
  script?: string;
  imageVideoPrompts?: string;
  onImageVideoPromptsChange: (prompts: string) => void;
  productionSettings?: string;
  onProductionSettingsChange: (settings: string) => void;
  onShowSummary: () => void;
  selectedModel: AIModel;
}

export const ProductionStep = ({ 
  topic,
  angle,
  hook,
  title,
  thumbnailPrompt,
  script, 
  imageVideoPrompts, 
  onImageVideoPromptsChange, 
  productionSettings,
  onProductionSettingsChange,
  onShowSummary,
  selectedModel
}: ProductionStepProps) => {
  const [generatedPrompts, setGeneratedPrompts] = useState(imageVideoPrompts || '');
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePromptsFromAI = async () => {
    if (!script) return;
    
    setIsGenerating(true);
    try {
      const result = await aiService.generateImageVideoPrompts(script, selectedModel, productionSettings);
      const formattedResult = JSON.stringify(result, null, 2);
      setGeneratedPrompts(formattedResult);
      onImageVideoPromptsChange(formattedResult);
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
    if (imageVideoPrompts) {
      setGeneratedPrompts(imageVideoPrompts);
    }
  }, [imageVideoPrompts]);

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

        <Card className="shadow-card">
          <CardContent className="p-4">
            <h4 className="font-semibold text-foreground mb-2">Selected Hook:</h4>
            <p className="text-sm text-muted-foreground">{hook}</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <h4 className="font-semibold text-foreground mb-2">Selected Title:</h4>
            <p className="text-sm text-muted-foreground">{title}</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <h4 className="font-semibold text-foreground mb-2">Selected Thumbnail:</h4>
            <p className="text-sm text-muted-foreground">{thumbnailPrompt}</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <h4 className="font-semibold text-foreground mb-2">Script Preview:</h4>
            <div className="text-sm text-muted-foreground max-h-32 overflow-y-auto border rounded p-2 bg-muted/50">
              {script?.substring(0, 200)}...
            </div>
          </CardContent>
        </Card>
      </div>

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
          variant="default"
          className="w-full"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {isGenerating ? "Generating..." : "Generate Production Prompts"}
        </Button>

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