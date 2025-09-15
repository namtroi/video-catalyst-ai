import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, RefreshCw, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { generateScript } from '@/services/deepseekAI';

interface ScriptStepProps {
  title: string;
  hook: string;
  script?: string;
  onScriptChange: (script: string) => void;
  onComplete: () => void;
  isCompleted: boolean;
  scriptSettings?: string;
  onScriptSettingsChange: (settings: string) => void;
}

export const ScriptStep = ({ 
  title,
  hook,
  script, 
  onScriptChange, 
  onComplete, 
  isCompleted,
  scriptSettings,
  onScriptSettingsChange 
}: ScriptStepProps) => {
  const [generatedScript, setGeneratedScript] = useState(script || '');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateScriptFromAI = async () => {
    setIsGenerating(true);
    try {
      const script = await generateScript(title, hook, scriptSettings);
      setGeneratedScript(script);
      
      toast({
        title: "Script Generated!",
        description: "Your complete video script has been created with timestamps and structure.",
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

  const handleSelectScript = () => {
    if (generatedScript) {
      onScriptChange(generatedScript);
      onComplete();
    }
  };

  useEffect(() => {
    if (title && hook && !generatedScript) {
      generateScriptFromAI();
    }
  }, [title, hook]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Step 6: Script
        </h2>
        <p className="text-muted-foreground">
          Build the full video outline with timestamps and speaking notes
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
        {generatedScript ? (
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <FileText className="w-4 h-4 text-primary" />
                <span className="font-medium text-foreground">Generated Script</span>
              </div>
              <Textarea
                value={generatedScript}
                readOnly
                className="min-h-[400px] resize-y text-sm font-mono"
              />
            </CardContent>
          </Card>
        ) : (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-muted-foreground">Generating complete script...</span>
          </div>
        )}

        <Button
          onClick={generateScriptFromAI}
          disabled={isGenerating || isCompleted}
          variant="outline"
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Regenerating Script...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Re-generate Script
            </>
          )}
        </Button>

        <div className="flex items-center space-x-2 pt-4">
          <Checkbox
            id="select-script"
            checked={isCompleted}
            onCheckedChange={handleSelectScript}
            disabled={!generatedScript || isCompleted}
          />
          <label
            htmlFor="select-script"
            className={`text-sm font-medium cursor-pointer ${
              isCompleted ? 'text-success' : 'text-foreground'
            }`}
          >
            {isCompleted ? '✓ Script Selected' : 'Select Script'}
          </label>
        </div>
      </div>
    </div>
  );
};