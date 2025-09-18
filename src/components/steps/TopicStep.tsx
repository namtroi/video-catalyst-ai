import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { aiService, AIModel } from '@/services/aiService';
import { Template } from '@/types';
import { useTemplates } from '@/hooks/useTemplates';
import { TemplateManager } from '@/components/TemplateManager';
import { Sparkles, Settings, X } from 'lucide-react';

interface TopicStepProps {
  topic?: string;
  onTopicChange: (topic: string) => void;
  topicSettings?: string;
  onTopicSettingsChange: (settings: string) => void;
  selectedModel: AIModel;
  selectedTemplate?: Template | null;
  onTemplateSelect: (template: Template | null) => void;
  currentStep: number;
}

export const TopicStep = ({ 
  topic, 
  onTopicChange, 
  topicSettings,
  onTopicSettingsChange,
  selectedModel,
  selectedTemplate,
  onTemplateSelect,
  currentStep
}: TopicStepProps) => {
  const [inputTopic, setInputTopic] = useState(topic || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const { templates, isLoading: templatesLoading, refreshTemplates } = useTemplates();

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

  const handleTemplateSelect = (template: Template) => {
    onTemplateSelect(template);
    setIsTemplateDialogOpen(false);
    toast.success(`Template "${template.name}" applied successfully!`);
  };

  const clearTemplate = () => {
    onTemplateSelect(null);
    toast.success('Template cleared');
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

      {/* Template Selection - Only show on Step 1 */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Templates</CardTitle>
                <CardDescription>
                  Choose a template to pre-fill custom instructions for all steps
                </CardDescription>
              </div>
              <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Templates
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Template Manager</DialogTitle>
                  </DialogHeader>
                  <TemplateManager 
                    onTemplateSelect={handleTemplateSelect}
                    onTemplatesChanged={refreshTemplates}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {selectedTemplate ? (
              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                <div>
                  <span className="font-medium text-primary">
                    {selectedTemplate.name}
                  </span>
                  <p className="text-sm text-muted-foreground">
                    Template applied to all step instructions
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={clearTemplate}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {templatesLoading ? (
                  <p className="text-sm text-muted-foreground">Loading templates...</p>
                ) : templates.length > 0 ? (
                  <Select onValueChange={(templateId) => {
                    const template = templates.find(t => t.id === templateId);
                    if (template) handleTemplateSelect(template);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No templates found. Create one using "Manage Templates".
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Show selected template info on other steps */}
      {currentStep > 1 && selectedTemplate && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">
                Using template: <span className="text-primary">{selectedTemplate.name}</span>
              </span>
            </div>
          </CardContent>
        </Card>
      )}

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
          variant={isGenerating ? "secondary" : (inputTopic.trim() ? "outline" : "default")}
          className="w-full"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {isGenerating ? "Generating..." : (inputTopic.trim() ? "Regenerate Topic" : "Generate Topic")}
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