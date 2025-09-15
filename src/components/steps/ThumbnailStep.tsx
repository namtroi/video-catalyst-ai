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
import { ThumbnailOption } from '@/types';
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
  selectedModel
}: ThumbnailStepProps) => {
  const [selectedPrompt, setSelectedPrompt] = useState(thumbnailPrompt || '');
  const [prompts, setPrompts] = useState<ThumbnailOption[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageQuality, setImageQuality] = useState<'standard' | '4k'>('standard');
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [imageLoadingStates, setImageLoadingStates] = useState<Record<string, boolean>>({});

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
  };

  const generateImages = async () => {
    if (!prompts.length) {
      toast.error('Please generate thumbnail prompts first');
      return;
    }

    setIsGeneratingImages(true);
    const loadingStates: Record<string, boolean> = {};
    prompts.forEach(prompt => {
      loadingStates[prompt.id] = true;
    });
    setImageLoadingStates(loadingStates);

    try {
      const promptTexts = prompts.map(p => p.text);
      
      const { data, error } = await supabase.functions.invoke('generate-images', {
        body: { 
          prompts: promptTexts,
          quality: imageQuality
        }
      });

      if (error) throw error;

      if (data?.success && data?.images) {
        const updatedPrompts = prompts.map((prompt, index) => {
          const imageResult = data.images[index];
          return {
            ...prompt,
            imageUrl: imageResult?.imageUrl || undefined,
            imageQuality: imageQuality
          };
        });
        
        setPrompts(updatedPrompts);
        
        const successCount = data.images.filter((img: any) => img.imageUrl).length;
        toast.success(`Generated ${successCount}/${prompts.length} thumbnail images successfully!`);
      } else {
        throw new Error('No images generated');
      }
    } catch (error: any) {
      console.error('Error generating images:', error);
      toast.error(error.message || 'Failed to generate thumbnail images. Please try again.');
    } finally {
      setIsGeneratingImages(false);
      setImageLoadingStates({});
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
    window.open(imageUrl, '_blank');
  };

  const getQualityInfo = (quality: 'standard' | '4k') => {
    return quality === '4k' 
      ? { label: '4K High Quality', size: '4096×4096', cost: 'Higher cost' }
      : { label: 'Standard Quality', size: '1024×1024', cost: 'Lower cost' };
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
                        <Label 
                          htmlFor={`prompt-${promptOption.id}`} 
                          className="text-sm leading-relaxed cursor-pointer block mb-3"
                        >
                          {promptOption.text}
                        </Label>
                        
                        {/* Image Preview Section */}
                        <div className="mt-3">
                          {imageLoadingStates[promptOption.id] ? (
                            <div className="flex items-center justify-center h-32 bg-muted rounded-lg border-2 border-dashed">
                              <div className="text-center">
                                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                <div className="text-sm text-muted-foreground">Generating image...</div>
                              </div>
                            </div>
                          ) : promptOption.imageUrl ? (
                            <div className="relative group">
                              <img 
                                src={promptOption.imageUrl}
                                alt={promptOption.text}
                                className="w-full h-32 object-cover rounded-lg border"
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
                              {promptOption.imageQuality && (
                                <Badge 
                                  variant={promptOption.imageQuality === '4k' ? 'default' : 'secondary'}
                                  className="absolute top-2 right-2"
                                >
                                  {promptOption.imageQuality === '4k' ? '4K' : 'Standard'}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-32 bg-muted rounded-lg border-2 border-dashed">
                              <div className="text-center">
                                <Image className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                                <div className="text-sm text-muted-foreground">No image generated yet</div>
                              </div>
                            </div>
                          )}
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
          variant="default"
          className="w-full"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {isGenerating ? "Generating..." : "Generate Thumbnail Prompts"}
        </Button>

        {prompts.length > 0 && (
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">Generate Thumbnail Images</h3>
              
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
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <div className="font-medium">Standard Quality</div>
                          <div className="text-xs text-muted-foreground">1024×1024 • Lower cost • Faster</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="4k">
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <div className="font-medium">4K High Quality</div>
                          <div className="text-xs text-muted-foreground">4096×4096 • Higher cost • Best quality</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-sm text-muted-foreground">
                  {getQualityInfo(imageQuality).label} - {getQualityInfo(imageQuality).cost}
                </div>
              </div>
            </div>

            <Button
              onClick={generateImages}
              disabled={isGeneratingImages || prompts.length === 0}
              variant="secondary"
              className="w-full"
            >
              <Image className="w-4 h-4 mr-2" />
              {isGeneratingImages ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating {imageQuality.toUpperCase()} Images...
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