import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { aiService, AIModel } from '@/services/aiService';
import { ScenesResponse, ProductionImageOption, ImageModel, ImageGenerationRequest } from '@/types';
import { Sparkles, Download, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
  generatedProductionImages?: ProductionImageOption[];
  onProductionImagesChange: (images: ProductionImageOption[]) => void;
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
  selectedModel,
  generatedProductionImages,
  onProductionImagesChange
}: ProductionStepProps) => {
  const [generatedPrompts, setGeneratedPrompts] = useState(imageVideoPrompts || '');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Image generation states
  const [imageModel, setImageModel] = useState<ImageModel>('seedream-4');
  const [imageQuality, setImageQuality] = useState<'standard' | '4k'>('standard');
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [imageLoadingStates, setImageLoadingStates] = useState<{[key: string]: boolean}>({});

  const generatePromptsFromAI = async () => {
    if (!script) return;
    
    setIsGenerating(true);
    try {
      const result = await aiService.generateImageVideoPrompts(script, selectedModel, productionSettings);
      const formattedResult = JSON.stringify(result, null, 2);
      setGeneratedPrompts(formattedResult);
      onImageVideoPromptsChange(formattedResult);
      toast.success('Production prompts generated successfully!');
    } catch (error) {
      toast.error('Failed to generate production prompts. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectPrompts = () => {
    if (generatedPrompts) {
      onImageVideoPromptsChange(generatedPrompts);
      onShowSummary();
    }
  };

  // Parse prompts from generated text
  const parseImagePrompts = (promptsText: string): string[] => {
    if (!promptsText) return [];
    
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(promptsText);
      if (parsed.scenes && Array.isArray(parsed.scenes)) {
        return parsed.scenes.map((scene: any) => scene.image_prompt || scene.imagePrompt || '').filter(Boolean);
      }
    } catch {
      // If not JSON, try to extract from text
      const lines = promptsText.split('\n').filter(line => line.trim());
      const prompts: string[] = [];
      
      for (const line of lines) {
        // Look for patterns like "Image prompt:" or numbered items
        if (line.toLowerCase().includes('image') && line.includes(':')) {
          const prompt = line.split(':').slice(1).join(':').trim();
          if (prompt) prompts.push(prompt);
        } else if (/^\d+\./.test(line.trim())) {
          // Handle numbered lists
          const prompt = line.replace(/^\d+\.\s*/, '').trim();
          if (prompt && prompt.toLowerCase().includes('image')) {
            prompts.push(prompt);
          }
        }
      }
      
      return prompts.length > 0 ? prompts : [promptsText.substring(0, 200)]; // Fallback
    }
    
    return [];
  };

  const generateImages = async () => {
    const prompts = parseImagePrompts(generatedPrompts);
    if (prompts.length === 0) {
      toast.error('No image prompts found. Please generate production prompts first.');
      return;
    }

    setIsGeneratingImages(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-images', {
        body: { 
          prompts: prompts.slice(0, 5), // Limit to 5 images for performance
          quality: imageQuality,
          model: imageModel
        }
      });

      if (error) throw error;

      if (data?.images && Array.isArray(data.images)) {
        const newImages: ProductionImageOption[] = data.images.map((img: any, index: number) => ({
          id: crypto.randomUUID(),
          text: prompts[index] || `Production Image ${index + 1}`,
          imageUrl: img.imageUrl,
          imageQuality,
          imageModel
        }));

        onProductionImagesChange(newImages);
        toast.success(`Generated ${newImages.length} production images successfully!`);
      }
    } catch (error) {
      console.error('Error generating images:', error);
      toast.error('Failed to generate images. Please try again.');
    } finally {
      setIsGeneratingImages(false);
    }
  };

  const downloadImage = async (imageUrl: string, promptText: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `production-image-${promptText.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '-')}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Image downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download image');
    }
  };

  const viewImageFullSize = (imageUrl: string) => {
    window.open(imageUrl, '_blank');
  };

  useEffect(() => {
    if (imageVideoPrompts) {
      setGeneratedPrompts(imageVideoPrompts);
    }
  }, [imageVideoPrompts]);

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
          onClick={generatePromptsFromAI}
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

        {/* Image Generation Section */}
        {generatedPrompts && (
          <div className="space-y-4 pt-6 border-t border-border">
            <div className="flex items-center space-x-2 mb-4">
              <ImageIcon className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Generate Production Images</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Image Model
                </label>
                <Select value={imageModel} onValueChange={(value: ImageModel) => setImageModel(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seedream-4">
                      <div className="flex flex-col">
                        <span>Seedream 4</span>
                        <span className="text-xs text-muted-foreground">Fast generation, good for testing</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="flux-1.1-pro-ultra">
                      <div className="flex flex-col">
                        <span>Flux Pro Ultra</span>
                        <span className="text-xs text-muted-foreground">Professional quality, optimized for visuals</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Quality
                </label>
                <Select value={imageQuality} onValueChange={(value: 'standard' | '4k') => setImageQuality(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">
                      <div className="flex flex-col">
                        <span>Standard</span>
                        <span className="text-xs text-muted-foreground">Lower cost, faster generation</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="4k">
                      <div className="flex flex-col">
                        <span>4K High Quality</span>
                        <span className="text-xs text-muted-foreground">Higher cost, best quality</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={generateImages}
              disabled={isGeneratingImages || !generatedPrompts}
              variant="default"
              className="w-full"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              {isGeneratingImages ? "Generating Images..." : "Generate Production Images"}
            </Button>

            {/* Display Generated Images */}
            {generatedProductionImages && generatedProductionImages.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Generated Images</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {generatedProductionImages.map((image) => (
                    <Card key={image.id} className="shadow-card">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {image.text}
                          </p>
                          
                          {image.imageUrl && (
                            <div className="relative group">
                              <img
                                src={image.imageUrl}
                                alt={image.text}
                                className="w-full h-32 object-cover rounded border cursor-pointer transition-transform group-hover:scale-105"
                                onClick={() => viewImageFullSize(image.imageUrl!)}
                              />
                              
                              <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    viewImageFullSize(image.imageUrl!);
                                  }}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadImage(image.imageUrl!, image.text);
                                  }}
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          <div className="text-xs text-muted-foreground">
                            Model: {image.imageModel === 'seedream-4' ? 'Seedream 4' : 'Flux Pro Ultra'} • 
                            Quality: {image.imageQuality === 'standard' ? 'Standard' : '4K'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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