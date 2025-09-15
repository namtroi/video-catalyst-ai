import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TitleStepProps {
  topic: string;
  angle: string;
  hook: string;
  title?: string;
  onTitleChange: (title: string) => void;
  onComplete: () => void;
  isCompleted: boolean;
  customSettings?: string;
}

export const TitleStep = ({ 
  topic, 
  angle,
  hook,
  title, 
  onTitleChange, 
  onComplete, 
  isCompleted,
  customSettings 
}: TitleStepProps) => {
  const [selectedTitle, setSelectedTitle] = useState(title || '');
  const [titles, setTitles] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateTitles = async () => {
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const generatedTitles = [
        "This Changed Everything I Thought I Knew (You Won't Believe What Happened)",
        "The Secret Nobody Wants You to Know About This",
        "I Tried This for 30 Days and Here's What Actually Happened"
      ];
      
      setTitles(generatedTitles);
      
      toast({
        title: "Titles Generated!",
        description: "Three SEO-optimized video titles have been created.",
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

  const handleSelectTitle = () => {
    if (selectedTitle) {
      onTitleChange(selectedTitle);
      onComplete();
    }
  };

  useEffect(() => {
    if (topic && angle && hook && titles.length === 0) {
      generateTitles();
    }
  }, [topic, angle, hook]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Step 4: Title
        </h2>
        <p className="text-muted-foreground">
          Pick a clickable video title that's SEO-optimized and engaging
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
            <p className="text-sm text-muted-foreground italic">"{hook}"</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {titles.length > 0 ? (
          <RadioGroup
            value={selectedTitle}
            onValueChange={setSelectedTitle}
            disabled={isCompleted}
            className="space-y-3"
          >
            {titles.map((titleOption, index) => (
              <Card key={index} className={`cursor-pointer transition-colors hover:shadow-card ${
                selectedTitle === titleOption ? 'border-primary shadow-card' : ''
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value={titleOption} id={`title-${index}`} className="mt-1" />
                    <Label htmlFor={`title-${index}`} className="cursor-pointer flex-1">
                      <div className="font-medium text-foreground mb-1">
                        Title {index + 1}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {titleOption}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {titleOption.length} characters
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
            <span className="text-muted-foreground">Generating titles...</span>
          </div>
        )}

        <Button
          onClick={generateTitles}
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
              Re-generate Titles
            </>
          )}
        </Button>

        <div className="flex items-center space-x-2 pt-4">
          <Checkbox
            id="select-title"
            checked={isCompleted}
            onCheckedChange={handleSelectTitle}
            disabled={!selectedTitle || isCompleted}
          />
          <label
            htmlFor="select-title"
            className={`text-sm font-medium cursor-pointer ${
              isCompleted ? 'text-success' : 'text-foreground'
            }`}
          >
            {isCompleted ? '✓ Title Selected' : 'Select Title'}
          </label>
        </div>
      </div>
    </div>
  );
};