import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, RefreshCw, Video, Image as ImageIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ProductionStepProps {
  script: string;
  imageVideoPrompts?: string;
  onImageVideoPromptsChange: (prompts: string) => void;
  onComplete: () => void;
  isCompleted: boolean;
  customSettings?: string;
}

export const ProductionStep = ({ 
  script,
  imageVideoPrompts, 
  onImageVideoPromptsChange, 
  onComplete, 
  isCompleted,
  customSettings 
}: ProductionStepProps) => {
  const [generatedPrompts, setGeneratedPrompts] = useState(imageVideoPrompts || '');
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePrompts = async () => {
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const productionPrompts = `# Image & Video Generation Prompts

## Scene 1: Opening Hook (0:00-0:30)
**Image Prompt:** Close-up of a person with a shocked expression, dramatic lighting, question marks floating around their head, modern minimalist background
**Video Prompt:** Smooth zoom into the person's face with subtle head movement, question marks appearing and disappearing with a pulsing effect, 8-second duration

## Scene 2: Problem Setup (0:30-2:00)
**Image Prompt:** Split screen showing "common belief" vs "reality", contrasting visual elements, bold text overlays, vibrant colors
**Video Prompt:** Dynamic split-screen reveal animation, text appearing with typewriter effect, smooth transitions between before/after states, 10-second duration

## Scene 3: Revelation #1 (2:00-4:00)
**Image Prompt:** Abstract representation of discovery, lightbulb moment, golden rays of light, modern flat design style
**Video Prompt:** Animated lightbulb flickering on with expanding golden light rays, particles floating upward, smooth rotation, 8-second duration

## Scene 4: Evidence Building (4:00-7:00)
**Image Prompt:** Infographic-style visualization, charts and data points, clean modern design, blue and green color scheme
**Video Prompt:** Animated chart bars growing upward, data points connecting with lines, smooth transitions between different graphs, 12-second duration

## Scene 5: Mind-Blowing Revelation (7:00-10:00)
**Image Prompt:** Explosive visual metaphor, mind-blown expression, colorful explosion of geometric shapes, high energy composition
**Video Prompt:** Explosive animation with geometric shapes bursting outward, person's reaction with exaggerated expression, 10-second duration

## Scene 6: Practical Tips (10:00-12:00)
**Image Prompt:** Clean numbered list layout, modern icons for each tip, professional color scheme, easy to read typography
**Video Prompt:** Sequential reveal of numbered points with smooth slide-in animations, icons bouncing into place, 8-second duration per tip

## Scene 7: Call to Action (12:00-13:00)
**Image Prompt:** Engaging subscribe button animation, like and bell icons, YouTube-style interface elements, bright engaging colors
**Video Prompt:** Bouncing subscribe button with glowing effect, like button animation with heart particles, bell icon ringing, 6-second duration

## Scene 8: Channel Branding (13:00-End)
**Image Prompt:** Clean channel logo/branding, next video thumbnail preview, consistent color scheme matching channel identity
**Video Prompt:** Logo appearing with subtle glow effect, thumbnail sliding in from the side, smooth fade transitions, 5-second duration

---
**Total Scenes:** 8
**Estimated Total Production Time:** 65-70 seconds of generated content
**Style Consistency:** Modern, clean, high-energy with smooth animations
**Color Palette:** Blue (#007BFF), Green (#28A745), Gold (#FFC107), White/Gray backgrounds`;
      
      setGeneratedPrompts(productionPrompts);
      
      toast({
        title: "Production Prompts Generated!",
        description: "Complete image and video prompts for your production pipeline have been created.",
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

  const handleSelectPrompts = () => {
    if (generatedPrompts) {
      onImageVideoPromptsChange(generatedPrompts);
      onComplete();
    }
  };

  useEffect(() => {
    if (script && !generatedPrompts) {
      generatePrompts();
    }
  }, [script]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Step 7: Production
        </h2>
        <p className="text-muted-foreground">
          Create image and video generation prompts for final production
        </p>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-4">
          <h4 className="font-semibold text-foreground mb-2">Script Overview:</h4>
          <p className="text-sm text-muted-foreground">
            {script.split('\n').slice(0, 3).join(' ').substring(0, 200)}...
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {generatedPrompts ? (
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <div className="flex items-center space-x-1">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  <Video className="w-4 h-4 text-primary" />
                </div>
                <span className="font-medium text-foreground">Production Prompts</span>
              </div>
              <Textarea
                value={generatedPrompts}
                readOnly
                className="min-h-[500px] resize-y text-sm font-mono"
              />
            </CardContent>
          </Card>
        ) : (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-muted-foreground">Generating production prompts...</span>
          </div>
        )}

        <Button
          onClick={generatePrompts}
          disabled={isGenerating || isCompleted}
          variant="outline"
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Regenerating Prompts...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Re-generate Prompts
            </>
          )}
        </Button>

        <div className="flex items-center space-x-2 pt-4">
          <Checkbox
            id="select-prompts"
            checked={isCompleted}
            onCheckedChange={handleSelectPrompts}
            disabled={!generatedPrompts || isCompleted}
          />
          <label
            htmlFor="select-prompts"
            className={`text-sm font-medium cursor-pointer ${
              isCompleted ? 'text-success' : 'text-foreground'
            }`}
          >
            {isCompleted ? '✓ Production Prompts Selected' : 'Select Production Prompts'}
          </label>
        </div>
      </div>
    </div>
  );
};