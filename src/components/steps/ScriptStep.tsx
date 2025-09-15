import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { aiService, AIModel } from '@/services/aiService';
import { Sparkles } from 'lucide-react';

interface ScriptStepProps {
  title?: string;
  hook?: string;
  script?: string;
  onScriptChange: (script: string) => void;
  scriptSettings?: string;
  onScriptSettingsChange: (settings: string) => void;
  selectedModel: AIModel;
}

export const ScriptStep = ({ 
  title, 
  hook, 
  script, 
  onScriptChange, 
  scriptSettings,
  onScriptSettingsChange,
  selectedModel
}: ScriptStepProps) => {
  const [generatedScript, setGeneratedScript] = useState(script || '');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateScriptFromAI = async () => {
    if (!title || !hook) return;
    
    setIsGenerating(true);
    try {
      const result = await aiService.generateScript(title, hook, selectedModel, scriptSettings);
      setGeneratedScript(result);
      onScriptChange(result);
      toast.success('Script generated successfully!');
    } catch (error) {
      toast.error('Failed to generate script. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (script) {
      setGeneratedScript(script);
    }
  }, [script]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Step 6: Script
        </h2>
        <p className="text-muted-foreground">
          Generate a complete video script based on your title and hook
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
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Generated Script
          </label>
          <Textarea
            value={generatedScript}
            onChange={(e) => {
              setGeneratedScript(e.target.value);
              onScriptChange(e.target.value);
            }}
            placeholder={isGenerating ? "Generating script..." : "Your script will appear here"}
            className="min-h-[300px] resize-y"
            readOnly={isGenerating}
          />
        </div>

        <Button
          onClick={generateScriptFromAI}
          disabled={isGenerating || !title || !hook}
          variant="default"
          className="w-full"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {isGenerating ? "Generating..." : "Generate Script"}
        </Button>

        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Custom Instructions (optional)
          </label>
          <Textarea
            value={scriptSettings || ''}
            onChange={(e) => onScriptSettingsChange(e.target.value)}
            placeholder="e.g., Keep it under 5 minutes, include call-to-action, add humor..."
            className="min-h-[80px] resize-y"
          />
        </div>
      </div>
    </div>
  );
};