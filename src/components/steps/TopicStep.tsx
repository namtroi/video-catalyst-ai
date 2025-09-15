import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { aiService, AIModel } from '@/services/aiService';
import { Sparkles } from 'lucide-react';

interface TopicStepProps {
  topic?: string;
  onTopicChange: (topic: string) => void;
  topicSettings?: string;
  onTopicSettingsChange: (settings: string) => void;
  selectedModel: AIModel;
}

export const TopicStep = ({ 
  topic, 
  onTopicChange, 
  topicSettings,
  onTopicSettingsChange,
  selectedModel
}: TopicStepProps) => {
  const [inputTopic, setInputTopic] = useState(topic || '');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (topic) {
      setInputTopic(topic);
    }
  }, [topic]);

  const generateRandomTopic = async () => {
    setIsGenerating(true);
    try {
      const result = await aiService.generateTopic(selectedModel, topicSettings);
      handleTopicChange(result);
      toast.success('Topic generated successfully!');
    } catch (error) {
      toast.error('Failed to generate topic. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTopicChange = (value: string) => {
    setInputTopic(value);
    onTopicChange(value);
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
            onChange={(e) => handleTopicChange(e.target.value)}
            placeholder="Enter your video topic idea, or leave blank to generate randomly"
            className="min-h-[100px] resize-y"
          />
        </div>

        <Button
          onClick={generateRandomTopic}
          disabled={isGenerating}
          variant="default"
          className="w-full"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {isGenerating ? "Generating..." : "Generate Random Topic"}
        </Button>


        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Custom Instructions (optional)
          </label>
          <Textarea
            value={topicSettings || ''}
            onChange={(e) => onTopicSettingsChange(e.target.value)}
            placeholder="e.g., Focus on trending topics in technology, make it beginner-friendly..."
            className="min-h-[80px] resize-y"
          />
        </div>
      </div>
    </div>
  );
};