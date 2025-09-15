import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { generateAngles } from '@/services/deepseekAI';

interface AngleStepProps {
  topic: string;
  angle?: string;
  onAngleChange: (angle: string) => void;
  onComplete: () => void;
  isCompleted: boolean;
  customSettings?: string;
}

export const AngleStep = ({ 
  topic, 
  angle, 
  onAngleChange, 
  onComplete, 
  isCompleted,
  customSettings 
}: AngleStepProps) => {
  const [selectedAngle, setSelectedAngle] = useState(angle || '');
  const [angles, setAngles] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateAnglesFromAI = async () => {
    setIsGenerating(true);
    try {
      const generatedAngles = await generateAngles(topic, customSettings);
      setAngles(generatedAngles);
      
      toast({
        title: "Angles Generated!",
        description: "Three unique perspectives have been created for your topic.",
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

  const handleSelectAngle = () => {
    if (selectedAngle) {
      onAngleChange(selectedAngle);
      onComplete();
    }
  };

  useEffect(() => {
    if (topic && angles.length === 0) {
      generateAnglesFromAI();
    }
  }, [topic]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Step 2: Angle
        </h2>
        <p className="text-muted-foreground">
          Choose a perspective for your topic that will make it unique
        </p>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-4">
          <h4 className="font-semibold text-foreground mb-2">Selected Topic:</h4>
          <p className="text-sm text-muted-foreground">{topic}</p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {angles.length > 0 ? (
          <RadioGroup
            value={selectedAngle}
            onValueChange={setSelectedAngle}
            disabled={isCompleted}
            className="space-y-3"
          >
            {angles.map((angleOption, index) => (
              <Card key={index} className={`cursor-pointer transition-colors hover:shadow-card ${
                selectedAngle === angleOption ? 'border-primary shadow-card' : ''
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value={angleOption} id={`angle-${index}`} className="mt-1" />
                    <Label htmlFor={`angle-${index}`} className="cursor-pointer flex-1">
                      <div className="font-medium text-foreground mb-1">
                        Angle {index + 1}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {angleOption}
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
            <span className="text-muted-foreground">Generating angles...</span>
          </div>
        )}

        <Button
          onClick={generateAnglesFromAI}
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
              Re-generate Angles
            </>
          )}
        </Button>

        <div className="flex items-center space-x-2 pt-4">
          <Checkbox
            id="select-angle"
            checked={isCompleted}
            onCheckedChange={handleSelectAngle}
            disabled={!selectedAngle || isCompleted}
          />
          <label
            htmlFor="select-angle"
            className={`text-sm font-medium cursor-pointer ${
              isCompleted ? 'text-success' : 'text-foreground'
            }`}
          >
            {isCompleted ? '✓ Angle Selected' : 'Select Angle'}
          </label>
        </div>
      </div>
    </div>
  );
};