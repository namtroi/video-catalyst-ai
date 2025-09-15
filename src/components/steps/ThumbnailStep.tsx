import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, RefreshCw, Image } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { generateThumbnailPrompts } from '@/services/deepseekAI';

interface ThumbnailStepProps {
  title: string;
  hook: string;
  thumbnailPrompt?: string;
  onThumbnailPromptChange: (prompt: string) => void;
  onComplete: () => void;
  isCompleted: boolean;
  customSettings?: string;
}

export const ThumbnailStep = ({ 
  title,
  hook,
  thumbnailPrompt, 
  onThumbnailPromptChange, 
  onComplete, 
  isCompleted,
  customSettings 
}: ThumbnailStepProps) => {
  const [selectedPrompt, setSelectedPrompt] = useState(thumbnailPrompt || '');
  const [prompts, setPrompts] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePromptsFromAI = async () => {
    setIsGenerating(true);
    try {
      const generatedPrompts = await generateThumbnailPrompts(title, hook, customSettings);
      setPrompts(generatedPrompts);
      
      toast({
        title: "Thumbnail Prompts Generated!",
        description: "Three detailed image prompts for striking thumbnails have been created.",
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

  const handleSelectPrompt = () => {
    if (selectedPrompt) {
      onThumbnailPromptChange(selectedPrompt);
      onComplete();
    }
  };

  useEffect(() => {
    if (title && hook && prompts.length === 0) {
      generatePromptsFromAI();
    }
  }, [title, hook]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Step 5: Thumbnail
        </h2>
        <p className="text-muted-foreground">
          Generate image prompts for visually striking YouTube thumbnails
        </p>
      </div>

      <div className="space-y-3">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <h4 className="font-semibold text-foreground mb-2">Selected Title:</h4>
            <p className="text-sm text-muted-foreground">{title}</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <h4 className="font-semibold text-foreground mb-2">Selected Hook:</h4>
            <p className="text-sm text-muted-foreground italic">"{hook}"</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {prompts.length > 0 ? (
          <RadioGroup
            value={selectedPrompt}
            onValueChange={setSelectedPrompt}
            disabled={isCompleted}
            className="space-y-3"
          >
            {prompts.map((promptOption, index) => (
              <Card key={index} className={`cursor-pointer transition-colors hover:shadow-card ${
                selectedPrompt === promptOption ? 'border-primary shadow-card' : ''
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value={promptOption} id={`prompt-${index}`} className="mt-1" />
                    <Label htmlFor={`prompt-${index}`} className="cursor-pointer flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Image className="w-4 h-4 text-primary" />
                        <span className="font-medium text-foreground">
                          Thumbnail Prompt {index + 1}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {promptOption}
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
            <span className="text-muted-foreground">Generating thumbnail prompts...</span>
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
              Regenerating...
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
            id="select-prompt"
            checked={isCompleted}
            onCheckedChange={handleSelectPrompt}
            disabled={!selectedPrompt || isCompleted}
          />
          <label
            htmlFor="select-prompt"
            className={`text-sm font-medium cursor-pointer ${
              isCompleted ? 'text-success' : 'text-foreground'
            }`}
          >
            {isCompleted ? '✓ Thumbnail Prompt Selected' : 'Select Thumbnail Prompt'}
          </label>
        </div>
      </div>
    </div>
  );
};