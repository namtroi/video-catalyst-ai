import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { aiService, AIModel } from '@/services/aiService';
import { ThumbnailOption, ImageModel } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Image, Loader2, Download, Eye } from 'lucide-react';

interface ThumbnailStepProps {
  topic?: string;
  angle?: string;
  hook?: string;
  title?: string;
  thumbnailPrompt?: string;
  onThumbnailPromptChange: (prompt: string) => void;
  thumbnailSettings?: string;
  onThumbnailSettingsChange: (settings: string) => void;
  selectedModel: AIModel;
  generatedThumbnails?: ThumbnailOption[];
  selectedThumbnailId?: string;
  onGeneratedThumbnailsChange?: (thumbnails: ThumbnailOption[]) => void;
  onSelectedThumbnailChange?: (thumbnailId: string | null) => void;
}

export const ThumbnailStep = ({ 
  topic,
  angle,
  hook,
  title, 
  thumbnailPrompt,
  onThumbnailPromptChange,
  thumbnailSettings,
  onThumbnailSettingsChange,
  selectedModel,
  generatedThumbnails,
  selectedThumbnailId,
  onGeneratedThumbnailsChange,
  onSelectedThumbnailChange
}: ThumbnailStepProps) => {
  const [selectedPrompt, setSelectedPrompt] = useState(thumbnailPrompt || '');
  const [prompts, setPrompts] = useState<ThumbnailOption[]>(generatedThumbnails || []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageQuality, setImageQuality] = useState<'standard' | '4k'>('standard');
  const [imageModel, setImageModel] = useState<ImageModel>('seedream-4');
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [imageLoadingStates, setImageLoadingStates] = useState<Record<string, boolean>>({});
  const [currentGeneratingIndex, setCurrentGeneratingIndex] = useState<number>(-1);

  // Restore generated images from project data when component mounts
  useEffect(() => {
    if (generatedThumbnails && generatedThumbnails.length > 0) {
      setPrompts(generatedThumbnails);
    }
  }, [generatedThumbnails]);

  const generatePromptsFromAI = async () => {
    if (!title || !hook) return;
    
    setIsGenerating(true);
    try {
      const result = await aiService.generateThumbnailPrompts(title, hook, selectedModel, thumbnailSettings);
      setPrompts(result);
      toast.success('Thumbnail prompts generated successfully!');
    } catch (error) {
      toast.error('Failed to generate thumbnail prompts. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectPrompt = (selectedPrompt: string) => {
    setSelectedPrompt(selectedPrompt);
    onThumbnailPromptChange(selectedPrompt);
    
    // Find the selected thumbnail and save its ID
    const selectedOption = prompts.find(p => p.text === selectedPrompt);
    if (selectedOption && onSelectedThumbnailChange) {
      onSelectedThumbnailChange(selectedOption.id);
    }
  };

  const generateImages = async () => {
    if (!prompts.length) {
      toast.error('Please generate thumbnail prompts first');
      return;
    }

    setIsGeneratingImages(true);
    
    // Initialize loading states for all prompts
    const initialLoadingStates: Record<string, boolean> = {};
    prompts.forEach(prompt => {
      initialLoadingStates[prompt.id] = true;
    });
    setImageLoadingStates(initialLoadingStates);

    let successCount = 0;
    const updatedPrompts = [...prompts];

    try {
      // Generate images one by one with real-time updates
      for (let i = 0; i < prompts.length; i++) {
        const prompt = prompts[i];
        setCurrentGeneratingIndex(i);
        
        try {
          console.log(`Generating image ${i + 1}/${prompts.length}: ${prompt.text.substring(0, 50)}...`);
          
          const { data, error } = await supabase.functions.invoke('generate-single-image', {
            body: { 
              prompt: prompt.text,
              quality: imageQuality,
              model: imageModel,
              promptId: prompt.id
            }
          });

          if (error) throw error;

          if (data?.success && data?.image) {
            // Update the specific prompt with the generated image
            updatedPrompts[i] = {
              ...updatedPrompts[i],
              imageUrl: data.image.imageUrl,
              imageQuality: imageQuality,
              imageModel: imageModel
            };
            
            // Update state immediately to show the image
            setPrompts([...updatedPrompts]);
            
            // Save to project data immediately
            if (onGeneratedThumbnailsChange) {
              onGeneratedThumbnailsChange([...updatedPrompts]);
            }
            
            successCount++;
            console.log(`Successfully generated image ${i + 1}/${prompts.length}`);
          } else {
            console.error(`Failed to generate image for prompt ${i + 1}`);
          }
        } catch (error: any) {
          console.error(`Error generating image ${i + 1}:`, error);
        }
        
        // Remove loading state for this specific prompt
        setImageLoadingStates(prev => {
          const newStates = { ...prev };
          delete newStates[prompt.id];
          return newStates;
        });
        
        // Small delay between images to be API-friendly
        if (i < prompts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      toast.success(`Generated ${successCount}/${prompts.length} thumbnail images successfully!`);
    } catch (error: any) {
      console.error('Error in image generation process:', error);
      toast.error('Some images failed to generate. Please try again for failed images.');
    } finally {
      setIsGeneratingImages(false);
      setImageLoadingStates({});
      setCurrentGeneratingIndex(-1);
    }
  };

  const downloadImage = async (imageUrl: string, promptText: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `thumbnail-${promptText.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
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
    // Convert data URL to blob for better browser handling
    fetch(imageUrl)
      .then(res => res.blob())
      .then(blob => {
        const objectUrl = URL.createObjectURL(blob);
        const newWindow = window.open(objectUrl, '_blank');
        // Clean up the object URL after a delay
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      })
      .catch(error => {
        console.error('Failed to open image:', error);
        // Fallback: try direct data URL
        window.open(imageUrl, '_blank');
      });
  };

  const getQualityInfo = (quality: 'standard' | '4k') => {
    return quality === '4k' 
      ? { label: '4K Ultra HD', size: '3840×2160', cost: 'Higher cost' }
      : { label: 'HD Quality', size: '1920×1080', cost: 'Lower cost' };
  };

  const getModelInfo = (model: ImageModel) => {
    return model === 'flux-1.1-pro-ultra'
      ? { label: 'Flux Pro Ultra', description: 'Good for testing' }
      : { label: 'Seedream 4', description: 'Professional quality' };
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Step 5: Thumbnail
        </h2>
        <p className="text-muted-foreground">
          Generate image prompts for visually striking YouTube thumbnails
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
      </div>

      <div className="space-y-4">
        {isGenerating ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Generating thumbnail prompts...</p>
          </div>
        ) : prompts.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Choose a Thumbnail Prompt:</h3>
            <RadioGroup
              value={selectedPrompt}
              onValueChange={handleSelectPrompt}
              className="space-y-3"
            >
              {prompts.map((promptOption) => (
                <Card key={promptOption.id} className="shadow-card hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <RadioGroupItem 
                        value={promptOption.text} 
                        id={`prompt-${promptOption.id}`}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        {/* Side-by-side layout for prompt and image */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Prompt Text */}
                          <div className="space-y-2">
                            <Label 
                              htmlFor={`prompt-${promptOption.id}`} 
                              className="text-sm leading-relaxed cursor-pointer block"
                            >
                              {promptOption.text}
                            </Label>
                          </div>
                          
                          {/* Image Preview */}
                          <div className="aspect-video">
                            {imageLoadingStates[promptOption.id] ? (
                              <div className="flex items-center justify-center h-full bg-muted rounded-lg border-2 border-dashed">
                                <div className="text-center">
                                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                  <div className="text-sm text-muted-foreground">Generating...</div>
                                </div>
                              </div>
                            ) : promptOption.imageUrl ? (
                              <div className="relative group h-full">
                                <img 
                                  src={promptOption.imageUrl}
                                  alt={promptOption.text}
                                  className="w-full h-full object-cover rounded-lg border"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        viewImageFullSize(promptOption.imageUrl!);
                                      }}
                                    >
                                      <Eye className="w-3 h-3 mr-1" />
                                      View
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        downloadImage(promptOption.imageUrl!, promptOption.text);
                                      }}
                                    >
                                      <Download className="w-3 h-3 mr-1" />
                                      Download
                                    </Button>
                                  </div>
                                </div>
                                 <div className="absolute top-2 right-2 flex gap-1">
                                   {promptOption.imageQuality && (
                                     <Badge 
                                       variant={promptOption.imageQuality === '4k' ? 'default' : 'secondary'}
                                     >
                                       {promptOption.imageQuality === '4k' ? '4K' : 'HD'}
                                     </Badge>
                                   )}
                                   {promptOption.imageModel && (
                                     <Badge 
                                       variant="outline"
                                       className="text-xs"
                                     >
                                       {promptOption.imageModel === 'flux-1.1-pro-ultra' ? 'Flux' : 'Seedream'}
                                     </Badge>
                                   )}
                                 </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center h-full bg-muted rounded-lg border-2 border-dashed">
                                <div className="text-center">
                                  <Image className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                                  <div className="text-sm text-muted-foreground">No image yet</div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </RadioGroup>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No thumbnail prompts generated yet</p>
          </div>
        )}

        <Button
          onClick={generatePromptsFromAI}
          disabled={isGenerating || !title || !hook}
          variant={isGenerating ? "secondary" : "default"}
          className="w-full"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {isGenerating ? "Generating..." : "Generate Thumbnail Prompts"}
        </Button>

        {prompts.length > 0 && (
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">Generate Thumbnail Images</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">
                    Image Model
                  </Label>
                  <Select value={imageModel} onValueChange={(value: ImageModel) => setImageModel(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seedream-4">
                        <div>
                          <div className="font-medium">Seedream 4</div>
                          <div className="text-xs text-muted-foreground">Professional quality</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="flux-1.1-pro-ultra">
                        <div>
                          <div className="font-medium">Flux Pro Ultra</div>
                          <div className="text-xs text-muted-foreground">Good for testing</div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-sm text-muted-foreground">
                    {getModelInfo(imageModel).description}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">
                    Image Quality
                  </Label>
                  <Select value={imageQuality} onValueChange={(value: 'standard' | '4k') => setImageQuality(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select quality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">
                        <div>
                          <div className="font-medium">HD (1920×1080)</div>
                          <div className="text-xs text-muted-foreground">Lower cost • Faster generation</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="4k">
                        <div>
                          <div className="font-medium">4K (3840×2160)</div>
                          <div className="text-xs text-muted-foreground">Higher cost • Best quality</div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-sm text-muted-foreground">
                    {getQualityInfo(imageQuality).cost}
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={generateImages}
              disabled={isGeneratingImages || prompts.length === 0}
              variant={isGeneratingImages ? "secondary" : "default"}
              className="w-full"
            >
              <Image className="w-4 h-4 mr-2" />
              {isGeneratingImages ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating image {currentGeneratingIndex + 1} of {prompts.length}...
                </>
              ) : (
                `Generate ${imageQuality.toUpperCase()} Images (${prompts.length})`
              )}
            </Button>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Custom Instructions (optional)
          </label>
          <Textarea
            value={thumbnailSettings || ''}
            onChange={(e) => onThumbnailSettingsChange?.(e.target.value)}
            placeholder="e.g., Use bright colors, include faces, add text overlay..."
            className="min-h-[80px] resize-y"
          />
        </div>
      </div>
    </div>
  );
};