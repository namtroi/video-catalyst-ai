import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { generateTitles } from '@/services/deepseekAI';
import { Textarea } from '@/components/ui/textarea';

interface TitleStepProps {
  topic?: string;
  angle?: string;
  hook?: string;
  title?: string;
  onTitleChange: (title: string) => void;
  titleSettings?: string;
  onTitleSettingsChange: (settings: string) => void;
}

export const TitleStep = ({ 
  topic, 
  angle, 
  hook, 
  title, 
  onTitleChange, 
  titleSettings,
  onTitleSettingsChange 
}: TitleStepProps) => {
  const [selectedTitle, setSelectedTitle] = useState(title || '');
  const [titles, setTitles] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateTitlesFromAI = async () => {
    if (!topic || !angle || !hook) return;
    
    setIsGenerating(true);
    try {
      const result = await generateTitles(topic, angle, hook, titleSettings);
      const resultStr = String(result);
      const titlesArray = resultStr.split('\n').filter(line => line.trim());
      setTitles(titlesArray);
      toast.success('Titles generated successfully!');
    } catch (error) {
      toast.error('Failed to generate titles. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectTitle = (selectedTitle: string) => {
    setSelectedTitle(selectedTitle);
    onTitleChange(selectedTitle);
  };


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Step 4: Title
        </h2>
        <p className="text-muted-foreground">
          Generate compelling titles that will attract viewers
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
      </div>

      <div className="space-y-4">
        {isGenerating ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Generating title suggestions...</p>
          </div>
        ) : titles.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Choose a Title:</h3>
            <RadioGroup
              value={selectedTitle}
              onValueChange={handleSelectTitle}
              className="space-y-3"
            >
              {titles.map((titleOption, index) => (
                <Card key={index} className="shadow-card hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <RadioGroupItem 
                        value={titleOption} 
                        id={`title-${index}`}
                        className="mt-1"
                      />
                      <Label 
                        htmlFor={`title-${index}`} 
                        className="flex-1 text-sm leading-relaxed cursor-pointer font-medium"
                      >
                        {titleOption}
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </RadioGroup>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No titles generated yet</p>
          </div>
        )}

        <Button
          onClick={generateTitlesFromAI}
          disabled={isGenerating || !topic || !angle || !hook}
          variant="outline"
          className="w-full"
        >
          {isGenerating ? "Generating..." : "Generate Titles"}
        </Button>

        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Custom Instructions (optional)
          </label>
          <Textarea
            value={titleSettings || ''}
            onChange={(e) => onTitleSettingsChange(e.target.value)}
            placeholder="e.g., Keep it under 60 characters, include numbers, use power words..."
            className="min-h-[80px] resize-y"
          />
        </div>
      </div>
    </div>
  );
};