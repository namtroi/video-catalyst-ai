import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { generateThumbnailPrompts } from '@/services/deepseekAI';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles } from 'lucide-react';

interface ThumbnailOption {
  prompt_id: number;
  prompt_text: string;
}

interface ThumbnailStepProps {
  title?: string;
  hook?: string;
  prompt?: string;
  onPromptChange: (prompt: string) => void;
  thumbnailSettings?: string;
  onThumbnailSettingsChange: (settings: string) => void;
}

export const ThumbnailStep = ({ 
  title, 
  hook, 
  prompt, 
  onPromptChange,
  thumbnailSettings,
  onThumbnailSettingsChange 
}: ThumbnailStepProps) => {
  const [selectedPrompt, setSelectedPrompt] = useState(prompt || '');
  const [prompts, setPrompts] = useState<ThumbnailOption[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePromptsFromAI = async () => {
    if (!title || !hook) return;
    
    setIsGenerating(true);
    try {
      const result = await generateThumbnailPrompts(title, hook, thumbnailSettings);
      setPrompts(result);
      toast.success('Thumbnail prompts generated successfully!');
    } catch (error) {
      toast.error('Failed to generate thumbnail prompts. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectPrompt = (selectedPrompt: string) => {
    setSelectedPrompt(selectedPrompt);
    onPromptChange(selectedPrompt);
  };


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
            <p className="text-sm text-muted-foreground">{hook}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {isGenerating ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Generating thumbnail prompts...</p>
          </div>
        ) : prompts.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Choose a Thumbnail Prompt:</h3>
            <RadioGroup
              value={selectedPrompt}
              onValueChange={handleSelectPrompt}
              className="space-y-3"
            >
              {prompts.map((promptOption, index) => (
                <Card key={promptOption.prompt_id} className="shadow-card hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <RadioGroupItem 
                        value={promptOption.prompt_text} 
                        id={`prompt-${promptOption.prompt_id}`}
                        className="mt-1"
                      />
                      <Label 
                        htmlFor={`prompt-${promptOption.prompt_id}`} 
                        className="flex-1 text-sm leading-relaxed cursor-pointer"
                      >
                        {promptOption.prompt_text}
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </RadioGroup>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No thumbnail prompts generated yet</p>
          </div>
        )}

        <Button
          onClick={generatePromptsFromAI}
          disabled={isGenerating || !title || !hook}
          variant="default"
          className="w-full"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {isGenerating ? "Generating..." : "Generate Thumbnail Prompts"}
        </Button>

        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Custom Instructions (optional)
          </label>
          <Textarea
            value={thumbnailSettings || ''}
            onChange={(e) => onThumbnailSettingsChange?.(e.target.value)}
            placeholder="e.g., Use bright colors, include faces, add text overlay..."
            className="min-h-[80px] resize-y"
          />
        </div>
      </div>
    </div>
  );
};