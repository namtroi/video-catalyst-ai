import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, RefreshCw, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ScriptStepProps {
  title: string;
  hook: string;
  script?: string;
  onScriptChange: (script: string) => void;
  onComplete: () => void;
  isCompleted: boolean;
  customSettings?: string;
}

export const ScriptStep = ({ 
  title,
  hook,
  script, 
  onScriptChange, 
  onComplete, 
  isCompleted,
  customSettings 
}: ScriptStepProps) => {
  const [generatedScript, setGeneratedScript] = useState(script || '');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateScript = async () => {
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const fullScript = `# ${title}

## [00:00 - 00:30] INTRO / HOOK
${hook}

Welcome back to the channel! If you're new here, I'm [Your Name] and today we're diving deep into something that completely changed my perspective...

## [00:30 - 02:00] PROBLEM SETUP
Let me paint you a picture. How many times have you been told that [common belief]? Well, what if I told you that everything you think you know about this topic is completely wrong?

## [02:00 - 04:00] REVELATION #1
Here's what I discovered when I started digging deeper...
[Visual cue: Show relevant footage/graphics]

The first thing that shocked me was [key point]. This completely goes against conventional wisdom, but the evidence is overwhelming.

## [04:00 - 07:00] REVELATION #2  
But it gets even more interesting. The second thing I learned was [another key point].
[Visual cue: Transition to new scene/graphics]

This is where things really start to get mind-blowing...

## [07:00 - 10:00] REVELATION #3
And here's the biggest shocker of all [final major point].
[Visual cue: Build up tension with music and visuals]

When I realized this, everything clicked into place.

## [10:00 - 12:00] PRACTICAL APPLICATION
So what does this mean for you? Here are three actionable steps you can take right now:

1. [Practical tip #1]
2. [Practical tip #2]  
3. [Practical tip #3]

## [12:00 - 13:00] OUTRO & CTA
If this video opened your eyes like it did for me, smash that like button and subscribe for more content that challenges conventional thinking.

What's your biggest takeaway from today's video? Let me know in the comments below!

And if you want to dive even deeper into this topic, check out my previous video [link to related content].

Thanks for watching, and I'll see you in the next one!

---
**Total Word Count: ~1,800 words**
**Estimated Runtime: 12-13 minutes**`;
      
      setGeneratedScript(fullScript);
      
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
      generateScript();
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
          onClick={generateScript}
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