import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { generateAngles } from '@/services/deepseekAI';
import { Sparkles } from 'lucide-react';

interface AngleOption {
  id: number;
  description: string;
}

interface AngleStepProps {
  topic?: string;
  angle?: string;
  onAngleChange: (angle: string) => void;
  angleSettings?: string;
  onAngleSettingsChange: (settings: string) => void;
}

export const AngleStep = ({ 
  topic, 
  angle, 
  onAngleChange, 
  angleSettings,
  onAngleSettingsChange 
}: AngleStepProps) => {
  const [selectedAngle, setSelectedAngle] = useState(angle || '');
  const [angles, setAngles] = useState<AngleOption[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateAnglesFromAI = async () => {
    if (!topic) return;
    
    setIsGenerating(true);
    try {
      const result = await generateAngles(topic, angleSettings);
      setAngles(result);
      toast.success('Angles generated successfully!');
    } catch (error) {
      toast.error('Failed to generate angles. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectAngle = (selectedAngle: string) => {
    setSelectedAngle(selectedAngle);
    onAngleChange(selectedAngle);
  };


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
        {isGenerating ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Generating angle suggestions...</p>
          </div>
        ) : angles.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Choose an Angle:</h3>
            <RadioGroup
              value={selectedAngle}
              onValueChange={handleSelectAngle}
              className="space-y-3"
            >
              {angles.map((angleOption) => (
                <Card key={angleOption.id} className="shadow-card hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <RadioGroupItem 
                        value={angleOption.description} 
                        id={`angle-${angleOption.id}`}
                        className="mt-1"
                      />
                      <Label 
                        htmlFor={`angle-${angleOption.id}`} 
                        className="flex-1 text-sm leading-relaxed cursor-pointer"
                      >
                        {angleOption.description}
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </RadioGroup>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No angles generated yet</p>
          </div>
        )}

        <Button
          onClick={generateAnglesFromAI}
          disabled={isGenerating || !topic}
          variant="default"
          className="w-full"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {isGenerating ? "Generating..." : "Generate Angles"}
        </Button>

        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Custom Instructions (optional)
          </label>
          <Textarea
            value={angleSettings || ''}
            onChange={(e) => onAngleSettingsChange(e.target.value)}
            placeholder="e.g., Focus on controversial takes, make it educational, target beginners..."
            className="min-h-[80px] resize-y"
          />
        </div>
      </div>
    </div>
  );
};