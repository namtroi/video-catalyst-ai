import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { generateTopic } from '@/services/deepseekAI';

interface TopicStepProps {
  topic?: string;
  onTopicChange: (topic: string) => void;
  onComplete: () => void;
  isCompleted: boolean;
  customSettings?: string;
}

export const TopicStep = ({ 
  topic, 
  onTopicChange, 
  onComplete, 
  isCompleted,
  customSettings 
}: TopicStepProps) => {
  const [inputTopic, setInputTopic] = useState(topic || '');
  const [generatedTopic, setGeneratedTopic] = useState(topic || '');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateRandomTopic = async () => {
    setIsGenerating(true);
    try {
      const generatedTopicText = await generateTopic(customSettings);
      setGeneratedTopic(generatedTopicText);
      setInputTopic(generatedTopicText);
      
      toast({
        title: "Topic Generated!",
        description: "Your video topic has been generated successfully.",
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

  const handleSelectTopic = () => {
    if (inputTopic.trim()) {
      onTopicChange(inputTopic.trim());
      onComplete();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Step 1: Topic
        </h2>
        <p className="text-muted-foreground">
          Enter or generate a video idea that will engage your audience
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Video Topic Idea
          </label>
          <Textarea
            value={inputTopic}
            onChange={(e) => setInputTopic(e.target.value)}
            placeholder="Enter your video topic idea, or leave blank to generate randomly"
            className="min-h-[100px] resize-y"
            disabled={isCompleted}
          />
        </div>

        <Button
          onClick={generateRandomTopic}
          disabled={isGenerating || isCompleted}
          className="w-full bg-gradient-primary hover:opacity-90"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Topic...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Random Topic
            </>
          )}
        </Button>

        {generatedTopic && (
          <Card className="shadow-card">
            <CardContent className="p-4">
              <h4 className="font-semibold text-foreground mb-2">Generated Topic:</h4>
              <p className="text-sm text-muted-foreground">{generatedTopic}</p>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center space-x-2 pt-4">
          <Checkbox
            id="select-topic"
            checked={isCompleted}
            onCheckedChange={handleSelectTopic}
            disabled={!inputTopic.trim() || isCompleted}
          />
          <label
            htmlFor="select-topic"
            className={`text-sm font-medium cursor-pointer ${
              isCompleted ? 'text-success' : 'text-foreground'
            }`}
          >
            {isCompleted ? '✓ Topic Selected' : 'Select Topic'}
          </label>
        </div>
      </div>
    </div>
  );
};