import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { generateScript } from '@/services/deepseekAI';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface ScriptStepProps {
  title?: string;
  hook?: string;
  script?: string;
  onScriptChange: (script: string) => void;
  scriptSettings?: string;
  onScriptSettingsChange: (settings: string) => void;
}

export const ScriptStep = ({ 
  title, 
  hook, 
  script, 
  onScriptChange, 
  scriptSettings,
  onScriptSettingsChange 
}: ScriptStepProps) => {
  const [generatedScript, setGeneratedScript] = useState(script || '');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateScriptFromAI = async () => {
    if (!title || !hook) return;
    
    setIsGenerating(true);
    try {
      const result = await generateScript(title, hook, scriptSettings);
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
    if (title && hook && !script) {
      generateScriptFromAI();
    } else if (script) {
      setGeneratedScript(script);
    }
  }, [title, hook, script]);

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
          variant="outline"
          className="w-full"
        >
          {isGenerating ? "Regenerating..." : "Re-generate Script"}
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
                value={scriptSettings || ''}
                onChange={(e) => onScriptSettingsChange(e.target.value)}
                placeholder="e.g., Keep it under 5 minutes, include call-to-action, add humor..."
                className="min-h-[80px] resize-y"
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};