import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { aiService, AIModel } from '@/services/aiService';
import { ScenesResponse } from '@/types';
import { Sparkles, AlertCircle, RefreshCw, Timer, X } from 'lucide-react';

interface ProductionStepProps {
  topic?: string;
  angle?: string;
  hook?: string;
  title?: string;
  thumbnailPrompt?: string;
  script?: string;
  imageVideoPrompts?: string;
  onImageVideoPromptsChange: (prompts: string) => void;
  productionSettings?: string;
  onProductionSettingsChange: (settings: string) => void;
  onShowSummary: () => void;
  selectedModel: AIModel;
}

export const ProductionStep = ({ 
  topic,
  angle,
  hook,
  title,
  thumbnailPrompt,
  script, 
  imageVideoPrompts, 
  onImageVideoPromptsChange, 
  productionSettings,
  onProductionSettingsChange,
  onShowSummary,
  selectedModel
}: ProductionStepProps) => {
  const [generatedPrompts, setGeneratedPrompts] = useState(imageVideoPrompts || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const timeIntervalRef = useRef<number | null>(null);

  const MAX_RETRIES = 3;
  const TIMEOUT_DURATION = 120000; // 2 minutes
  const MIN_SCRIPT_LENGTH = 100;

  const validateScript = (): string | null => {
    if (!script || script.trim().length === 0) {
      return 'Script is required to generate production prompts.';
    }
    if (script.trim().length < MIN_SCRIPT_LENGTH) {
      return `Script must be at least ${MIN_SCRIPT_LENGTH} characters long. Current length: ${script.trim().length}`;
    }
    return null;
  };

  const startProgressSimulation = () => {
    setProgress(0);
    setTimeElapsed(0);
    
    // Progress simulation
    progressIntervalRef.current = window.setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev; // Don't go to 100% until complete
        return prev + Math.random() * 5;
      });
    }, 2000);

    // Time counter
    timeIntervalRef.current = window.setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
  };

  const stopProgressSimulation = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
      timeIntervalRef.current = null;
    }
  };

  const generatePromptsFromAI = async (isRetry: boolean = false) => {
    const validationError = validateScript();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setIsGenerating(true);
    setError(null);
    if (!isRetry) {
      setRetryCount(0);
    }

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();
    
    startProgressSimulation();

    try {
      // Set up timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), TIMEOUT_DURATION)
      );

      const generationPromise = aiService.generateImageVideoPrompts(
        script!,
        selectedModel,
        productionSettings
      );

      const result = await Promise.race([generationPromise, timeoutPromise]) as ScenesResponse;
      
      const formattedResult = JSON.stringify(result, null, 2);
      setGeneratedPrompts(formattedResult);
      onImageVideoPromptsChange(formattedResult);
      
      setProgress(100);
      stopProgressSimulation();
      
      toast.success('Production prompts generated successfully!');
      
      // Reset retry count on success
      setRetryCount(0);
      
    } catch (error: any) {
      stopProgressSimulation();
      
      let errorMessage = 'Failed to generate production prompts.';
      
      if (error.message === 'Request timeout') {
        errorMessage = 'Request timed out. The generation is taking longer than expected.';
      } else if (error.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message?.includes('API key')) {
        errorMessage = 'API key issue. Please check your AI model settings.';
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      setError(errorMessage);
      console.error('Production generation error:', error);
      
      if (retryCount < MAX_RETRIES) {
        toast.error(`${errorMessage} Retry ${retryCount + 1}/${MAX_RETRIES} available.`);
      } else {
        toast.error(`${errorMessage} Max retries reached.`);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleRetry = () => {
    if (retryCount < MAX_RETRIES) {
      setRetryCount(prev => prev + 1);
      
      // Exponential backoff
      const delay = Math.pow(2, retryCount) * 1000;
      
      toast.info(`Retrying in ${delay / 1000} seconds...`);
      
      setTimeout(() => {
        generatePromptsFromAI(true);
      }, delay);
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      stopProgressSimulation();
      setIsGenerating(false);
      setProgress(0);
      setTimeElapsed(0);
      toast.info('Generation cancelled');
    }
  };

  const handleSelectPrompts = () => {
    if (generatedPrompts) {
      onImageVideoPromptsChange(generatedPrompts);
      onShowSummary();
    }
  };

  useEffect(() => {
    if (imageVideoPrompts) {
      setGeneratedPrompts(imageVideoPrompts);
    }
  }, [imageVideoPrompts]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      stopProgressSimulation();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Step 7: Production
        </h2>
        <p className="text-muted-foreground">
          Generate prompts for images and video clips based on your script
        </p>
      </div>

      <div className="space-y-3">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <h4 className="font-semibold text-foreground mb-2">Selected Topic:</h4>
            <p className="text-sm text-muted-foreground">{topic}</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <h4 className="font-semibold text-foreground mb-2">Selected Angle:</h4>
            <p className="text-sm text-muted-foreground">{angle}</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <h4 className="font-semibold text-foreground mb-2">Selected Hook:</h4>
            <p className="text-sm text-muted-foreground">{hook}</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <h4 className="font-semibold text-foreground mb-2">Selected Title:</h4>
            <p className="text-sm text-muted-foreground">{title}</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <h4 className="font-semibold text-foreground mb-2">Selected Thumbnail:</h4>
            <p className="text-sm text-muted-foreground">{thumbnailPrompt}</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <h4 className="font-semibold text-foreground mb-2">Script Preview:</h4>
            <div className="text-sm text-muted-foreground max-h-32 overflow-y-auto border rounded p-2 bg-muted/50">
              {script?.substring(0, 200)}...
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              {retryCount < MAX_RETRIES && !isGenerating && (
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  size="sm"
                  className="ml-2"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry ({retryCount + 1}/{MAX_RETRIES})
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Script Validation Warning */}
        {script && script.length < MIN_SCRIPT_LENGTH && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Script is too short ({script.length} characters). Minimum {MIN_SCRIPT_LENGTH} characters recommended for better results.
            </AlertDescription>
          </Alert>
        )}

        {/* Progress Indicator */}
        {isGenerating && (
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Generating production prompts...</span>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Timer className="w-3 h-3 mr-1" />
                    {timeElapsed}s
                  </div>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>This may take 1-2 minutes for complex scripts</span>
                  <Button
                    onClick={handleCancel}
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Generated Image & Video Prompts
          </label>
          <Textarea
            value={generatedPrompts}
            onChange={(e) => {
              setGeneratedPrompts(e.target.value);
              onImageVideoPromptsChange(e.target.value);
            }}
            placeholder={isGenerating ? "Generating prompts..." : "Your production prompts will appear here"}
            className="min-h-[300px] resize-y"
            readOnly={isGenerating}
          />
        </div>

        <Button
          onClick={() => generatePromptsFromAI(false)}
          disabled={isGenerating || !script}
          variant="default"
          className="w-full"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {isGenerating ? "Generating..." : "Generate Production Prompts"}
        </Button>

        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Custom Instructions (optional)
          </label>
          <Textarea
            value={productionSettings || ''}
            onChange={(e) => onProductionSettingsChange(e.target.value)}
            placeholder="e.g., Focus on high-quality visuals, include specific shot types, target specific mood..."
            className="min-h-[80px] resize-y"
          />
        </div>

        {/* Show Summary Button */}
        <Button
          onClick={handleSelectPrompts}
          disabled={!generatedPrompts}
          className="w-full bg-gradient-primary hover:opacity-90"
        >
          Show Project Summary
        </Button>
      </div>
    </div>
  );
};