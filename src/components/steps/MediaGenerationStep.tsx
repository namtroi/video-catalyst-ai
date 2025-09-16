import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Download, 
  Copy, 
  ChevronDown, 
  ChevronUp,
  FileText,
  Palette,
  Target,
  Zap,
  Video,
  Image as ImageIcon,
  Moon,
  Sun,
  Save,
  BookMarked,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { VideoProject, Scene, ScenesResponse, ProductionImageOption, ImageModel } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { SavedProjectsService } from '@/services/savedProjectsService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import JSZip from 'jszip';
import jsPDF from 'jspdf';
import { ImageFallback } from '@/components/ImageFallback';

interface MediaGenerationStepProps {
  project: VideoProject;
  onNext?: () => void;
  onBackToSteps: () => void;
  onViewSavedProjects?: () => void;
  isReadOnly?: boolean;
  savedProjectName?: string;
  onGeneratedProductionImagesChange?: (images: ProductionImageOption[]) => void;
  onProjectUpdate?: (updates: Partial<VideoProject>) => void;
}

export const MediaGenerationStep = ({ 
  project, 
  onNext,
  onBackToSteps, 
  onViewSavedProjects,
  isReadOnly = false,
  savedProjectName,
  onGeneratedProductionImagesChange,
  onProjectUpdate
}: MediaGenerationStepProps) => {
  const [isScriptExpanded, setIsScriptExpanded] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState(savedProjectName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [isRegeneratingThumbnails, setIsRegeneratingThumbnails] = useState(false);
  const [selectedImageModel, setSelectedImageModel] = useState<ImageModel>('dreamshaper-lightning');
  const [selectedImageQuality, setSelectedImageQuality] = useState<'standard' | '4k'>('standard');

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
        className: "bg-success text-success-foreground",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please copy manually",
        variant: "destructive",
      });
    }
  };

  const generateZipDownload = async () => {
    const zip = new JSZip();
    
    // Add JSON with all data
    const projectData = {
      id: project.id,
      topic: project.topic,
      angle: project.angle,
      hook: project.hook,
      title: project.title,
      thumbnailPrompt: project.thumbnailPrompt,
      script: project.script,
      imageVideoPrompts: project.imageVideoPrompts,
      // Step-specific settings combined
      topicSettings: project.topicSettings,
      angleSettings: project.angleSettings,
      hookSettings: project.hookSettings,
      titleSettings: project.titleSettings,
      thumbnailSettings: project.thumbnailSettings,
      scriptSettings: project.scriptSettings,
      productionSettings: project.productionSettings,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    };
    
    zip.file("project-data.json", JSON.stringify(projectData, null, 2));
    
    // Add individual text files
    if (project.topic) zip.file("01-topic.txt", project.topic);
    if (project.angle) zip.file("02-angle.txt", project.angle);
    if (project.hook) zip.file("03-hook.txt", project.hook);
    if (project.title) zip.file("04-title.txt", project.title);
    if (project.thumbnailPrompt) zip.file("05-thumbnail-prompt.txt", project.thumbnailPrompt);
    if (project.script) zip.file("06-script.txt", project.script);
    if (project.imageVideoPrompts) zip.file("07-production-prompts.txt", project.imageVideoPrompts);
    
    // Add thumbnail images
    if (project.generatedThumbnails && project.generatedThumbnails.length > 0) {
      for (let i = 0; i < project.generatedThumbnails.length; i++) {
        const thumbnail = project.generatedThumbnails[i];
        if (thumbnail.imageUrl) {
          try {
            const response = await fetch(thumbnail.imageUrl);
            const blob = await response.blob();
            const fileName = project.selectedThumbnailId === thumbnail.id 
              ? "05-selected-thumbnail.jpg" 
              : `05-thumbnail-option-${i + 1}.jpg`;
            zip.file(fileName, blob);
          } catch (error) {
            console.error('Failed to add thumbnail image to zip:', error);
          }
        }
      }
    }

    // Add production images
    if (project.generatedProductionImages && project.generatedProductionImages.length > 0) {
      for (const productionImage of project.generatedProductionImages) {
        if (productionImage.imageUrl) {
          try {
            const response = await fetch(productionImage.imageUrl);
            const blob = await response.blob();
            const fileName = `08-production-scene-${productionImage.sceneNumber}.jpg`;
            zip.file(fileName, blob);
          } catch (error) {
            console.error('Failed to add production image to zip:', error);
          }
        }
      }
    }
    
    // Add settings files
    if (project.topicSettings) zip.file("settings/topic-settings.txt", project.topicSettings);
    if (project.angleSettings) zip.file("settings/angle-settings.txt", project.angleSettings);
    if (project.hookSettings) zip.file("settings/hook-settings.txt", project.hookSettings);
    if (project.titleSettings) zip.file("settings/title-settings.txt", project.titleSettings);
    if (project.thumbnailSettings) zip.file("settings/thumbnail-settings.txt", project.thumbnailSettings);
    if (project.scriptSettings) zip.file("settings/script-settings.txt", project.scriptSettings);
    if (project.productionSettings) zip.file("settings/production-settings.txt", project.productionSettings);
    
    // Generate and download
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `youtube-project-${project.id}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete!",
      description: "Your project files have been downloaded",
    });
  };

  const generatePDF = () => {
    const pdf = new jsPDF();
    let yPosition = 20;
    const lineHeight = 7;
    const pageHeight = pdf.internal.pageSize.height;
    
    // Title
    pdf.setFontSize(20);
    pdf.text("Your Complete YouTube Video Project", 20, yPosition);
    yPosition += lineHeight * 3;
    
    // Helper function to add text with automatic page breaks
    const addText = (title: string, content: string) => {
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.setFontSize(14);
      pdf.text(title, 20, yPosition);
      yPosition += lineHeight;
      
      pdf.setFontSize(10);
      const splitContent = pdf.splitTextToSize(content, 170);
      splitContent.forEach((line: string) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(line, 20, yPosition);
        yPosition += lineHeight;
      });
      yPosition += lineHeight;
    };
    
    // Add sections
    if (project.topic) addText("Topic:", project.topic);
    if (project.angle) addText("Angle:", project.angle);
    if (project.hook) addText("Hook:", project.hook);
    if (project.title) addText("Title:", project.title);
    if (project.thumbnailPrompt) addText("Thumbnail Prompt:", project.thumbnailPrompt);
    if (project.script) addText("Script:", project.script);
    if (project.imageVideoPrompts) addText("Production Prompts:", project.imageVideoPrompts);
    
    pdf.save(`youtube-project-${project.id}.pdf`);
    
    toast({
      title: "PDF Generated!",
      description: "Your project summary has been downloaded",
    });
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleSaveProject = async () => {
    if (!projectName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a project name",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await SavedProjectsService.saveProject(project, projectName.trim());
      toast({
        title: "Success",
        description: "Project saved successfully!",
      });
      setIsSaveDialogOpen(false);
      setProjectName('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Parse production prompts into scenes
  const parseScenes = (prompts: string): Scene[] => {
    try {
      const parsed: ScenesResponse = JSON.parse(prompts);
      return parsed.scenes || [];
    } catch (error) {
      // Fallback for old text format
      const scenes = prompts.split(/Scene \d+:/i).filter(scene => scene.trim());
      return scenes.map((scene, index) => {
        const [imagePrompt, videoPrompt] = scene.split(/Video Prompt:/i);
        return {
          scene_number: index + 1,
          image_prompt: imagePrompt?.replace(/Image Prompt:/i, '').trim() || '',
          video_prompt: videoPrompt?.trim() || ''
        };
      });
    }
  };

  const handleGenerateProductionImages = async () => {
    if (!project.imageVideoPrompts) return;
    
    const scenes = parseScenes(project.imageVideoPrompts);
    if (scenes.length === 0) {
      toast({
        title: "No image prompts found",
        description: "Please generate production prompts first.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingImages(true);
    try {
      const prompts = scenes.map(scene => scene.image_prompt).filter(prompt => prompt.trim());
      
      const { data, error } = await supabase.functions.invoke('generate-images', {
        body: {
          prompts,
          quality: selectedImageQuality,
          model: selectedImageModel
        }
      });

      if (error) throw error;

      if (data && data.images) {
        const newProductionImages: ProductionImageOption[] = data.images.map((img: any, index: number) => ({
          id: crypto.randomUUID(),
          sceneNumber: scenes[index]?.scene_number || index + 1,
          imagePrompt: prompts[index] || '',
          imageUrl: img.imageUrl,
          imageQuality: selectedImageQuality,
          imageModel: selectedImageModel
        }));

        const updatedImages = [...(project.generatedProductionImages || []), ...newProductionImages];
        onGeneratedProductionImagesChange?.(updatedImages);

        toast({
          title: "Images Generated!",
          description: `Successfully generated ${newProductionImages.length} production images`,
        });
      }
    } catch (error) {
      console.error('Failed to generate production images:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate production images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImages(false);
    }
  };

  const handleRegenerateThumbnails = async () => {
    if (!project.thumbnailPrompt) {
      toast({
        title: "No thumbnail prompt",
        description: "Please generate a thumbnail prompt first.",
        variant: "destructive",
      });
      return;
    }

    setIsRegeneratingThumbnails(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-images', {
        body: {
          prompts: [project.thumbnailPrompt, project.thumbnailPrompt, project.thumbnailPrompt],
          quality: selectedImageQuality,
          model: selectedImageModel
        }
      });

      if (error) throw error;

      if (data && data.images) {
        const newThumbnails = data.images.map((img: any, index: number) => ({
          id: crypto.randomUUID(),
          text: project.thumbnailPrompt || `Thumbnail ${index + 1}`,
          imageUrl: img.imageUrl,
          imageQuality: selectedImageQuality,
          imageModel: selectedImageModel
        }));

        onProjectUpdate?.({ generatedThumbnails: newThumbnails });

        toast({
          title: "Thumbnails Generated!",
          description: `Successfully generated ${newThumbnails.length} thumbnail options`,
        });
      }
    } catch (error) {
      console.error('Failed to regenerate thumbnails:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate thumbnails. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRegeneratingThumbnails(false);
    }
  };

  const scenes = project.imageVideoPrompts ? parseScenes(project.imageVideoPrompts) : [];

  return (
    <div className={`min-h-screen bg-background print:bg-white ${isDarkMode ? 'dark' : ''}`}>
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-card border-b border-border shadow-sm print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Button
                onClick={onBackToSteps}
                variant="outline"
                className="bg-primary text-primary-foreground hover:bg-primary-hover"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {isReadOnly ? 'Back to Library' : 'Back to Steps'}
              </Button>
              {isReadOnly && (
                <Badge variant="secondary" className="gap-1">
                  <BookMarked className="h-3 w-3" />
                  Saved Project
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {onViewSavedProjects && (
                <Button variant="ghost" onClick={onViewSavedProjects} className="gap-2">
                  <BookMarked className="h-4 w-4" />
                  My Projects
                </Button>
              )}
              <Button
                onClick={toggleDarkMode}
                variant="ghost"
                size="icon"
                className="ml-auto"
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6 sm:p-8 space-y-8 print:p-4 print:space-y-6" style={{ margin: '0 auto', padding: '2.5cm' }}>
        
        {/* Header Section */}
        <header className="text-center space-y-4 print:space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground print:text-black">
            {isReadOnly ? savedProjectName || 'Saved Project' : 'Step 8: Media Generation'}
          </h1>
          <p className="text-muted-foreground">
            {isReadOnly 
              ? 'View your saved project details and export your work.'
              : 'Generate production images and finalize your complete video project.'
            }
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={generateZipDownload}
              className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary-hover print:hidden"
              size="lg"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Full Project
            </Button>
            <Button
              onClick={generatePDF}
              variant="outline"
              className="w-full sm:w-auto print:hidden"
              size="lg"
            >
              <FileText className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            {!isReadOnly && (
              <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="secondary"
                    className="w-full sm:w-auto print:hidden"
                    size="lg"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save This Project
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save Project</DialogTitle>
                    <DialogDescription>
                      Give your project a name to save it to your library for future reference.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="projectName">Project Name</Label>
                      <Input
                        id="projectName"
                        placeholder="My Awesome Video Project"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)} disabled={isSaving}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveProject} disabled={isSaving || !projectName.trim()}>
                      {isSaving ? 'Saving...' : 'Save Project'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </header>

        <Separator className="print:border-gray-300" />

        {/* Core Headers - Four Cards */}
        <div className="grid gap-6 sm:gap-4">
          
          {/* Topic Card */}
          {project.topic && (
            <Card className="shadow-md print:shadow-none print:border print:border-gray-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="w-5 h-5 text-primary print:text-black" />
                    <CardTitle className="text-xl print:text-black">Topic</CardTitle>
                  </div>
                  <Button
                    onClick={() => copyToClipboard(project.topic!, 'Topic')}
                    variant="ghost"
                    size="sm"
                    className="print:hidden"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground print:text-black">{project.topic}</p>
              </CardContent>
            </Card>
          )}

          {/* Angle Card */}
          {project.angle && (
            <Card className="shadow-md print:shadow-none print:border print:border-gray-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Palette className="w-5 h-5 text-primary print:text-black" />
                    <CardTitle className="text-xl print:text-black">Angle</CardTitle>
                  </div>
                  <Button
                    onClick={() => copyToClipboard(project.angle!, 'Angle')}
                    variant="ghost"
                    size="sm"
                    className="print:hidden"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground print:text-black">{project.angle}</p>
              </CardContent>
            </Card>
          )}

          {/* Hook Card */}
          {project.hook && (
            <Card className="shadow-md print:shadow-none print:border print:border-gray-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-primary print:text-black" />
                    <CardTitle className="text-xl print:text-black">Hook</CardTitle>
                  </div>
                  <Button
                    onClick={() => copyToClipboard(project.hook!, 'Hook')}
                    variant="ghost"
                    size="sm"
                    className="print:hidden"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground print:text-black">{project.hook}</p>
              </CardContent>
            </Card>
          )}

          {/* Title Card */}
          {project.title && (
            <Card className="shadow-md print:shadow-none print:border print:border-gray-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-primary print:text-black" />
                    <CardTitle className="text-xl print:text-black">Title</CardTitle>
                  </div>
                  <Button
                    onClick={() => copyToClipboard(project.title!, 'Title')}
                    variant="ghost"
                    size="sm"
                    className="print:hidden"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground print:text-black">{project.title}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Thumbnail Section */}
        {project.thumbnailPrompt && (
          <Card className="shadow-md print:shadow-none print:border print:border-gray-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ImageIcon className="w-5 h-5 text-primary print:text-black" />
                  <CardTitle className="text-xl print:text-black">Thumbnail</CardTitle>
                </div>
                <Button
                  onClick={() => copyToClipboard(project.thumbnailPrompt!, 'Thumbnail prompt')}
                  variant="ghost"
                  size="sm"
                  className="print:hidden"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 print:text-black">Prompt:</h4>
                <p className="text-foreground print:text-black">{project.thumbnailPrompt}</p>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium print:text-black">Generated Options:</h4>
                  {!isReadOnly && (
                    <Button
                      onClick={handleRegenerateThumbnails}
                      disabled={isRegeneratingThumbnails}
                      variant={isRegeneratingThumbnails ? "secondary" : "outline"}
                      size="sm"
                      className="gap-2 print:hidden"
                    >
                      {isRegeneratingThumbnails ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      {isRegeneratingThumbnails ? 'Generating...' : 'Regenerate'}
                    </Button>
                  )}
                </div>
                
                {project.generatedThumbnails && project.generatedThumbnails.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {project.generatedThumbnails.map((thumbnail) => (
                      <div 
                        key={thumbnail.id} 
                        className={`relative border-2 rounded-lg overflow-hidden transition-all ${
                          project.selectedThumbnailId === thumbnail.id 
                            ? 'border-primary ring-2 ring-primary/20' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {thumbnail.imageUrl ? (
                          <>
                            <img 
                              src={thumbnail.imageUrl} 
                              alt={`Thumbnail option ${thumbnail.id}`}
                              className="w-full h-32 object-cover"
                            />
                            {project.selectedThumbnailId === thumbnail.id && (
                              <div className="absolute top-2 right-2">
                                <Badge className="bg-primary text-primary-foreground">Selected</Badge>
                              </div>
                            )}
                            <div className="absolute bottom-2 left-2 flex gap-1">
                              <Badge variant="secondary" className="text-xs">
                                {thumbnail.imageQuality === '4k' ? '4K' : 'HD'}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {thumbnail.imageModel?.includes('lightning') ? 
                                  thumbnail.imageModel.split('-')[0].charAt(0).toUpperCase() + thumbnail.imageModel.split('-')[0].slice(1) :
                                  thumbnail.imageModel === 'flux-1.1-pro-ultra' ? 'Flux' : 'Seedream'
                                }
                              </Badge>
                            </div>
                          </>
                        ) : (
                          <ImageFallback 
                            title="Thumbnail Image" 
                            onRegenerate={!isReadOnly ? handleRegenerateThumbnails : undefined}
                            isRegenerating={isRegeneratingThumbnails}
                            className="h-32"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <ImageFallback 
                    title="No Thumbnail Images Generated" 
                    onRegenerate={!isReadOnly ? handleRegenerateThumbnails : undefined}
                    isRegenerating={isRegeneratingThumbnails}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Script Section */}
        {project.script && (
          <Card className="shadow-md print:shadow-none print:border print:border-gray-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-primary print:text-black" />
                  <CardTitle className="text-xl print:text-black">Video Script</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => copyToClipboard(project.script!, 'Script')}
                    variant="ghost"
                    size="sm"
                    className="print:hidden"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Collapsible open={isScriptExpanded} onOpenChange={setIsScriptExpanded}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="print:hidden">
                        {isScriptExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </CollapsibleTrigger>
                  </Collapsible>
                </div>
              </div>
            </CardHeader>
            <Collapsible open={isScriptExpanded} onOpenChange={setIsScriptExpanded}>
              <CollapsibleContent>
                <CardContent>
                  <div className="whitespace-pre-wrap text-foreground print:text-black bg-muted p-4 rounded-lg">
                    {project.script}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )}

        {/* Image & Video Production Prompts Section with Image Generation */}
        {project.imageVideoPrompts && (
          <Card className="shadow-md print:shadow-none print:border print:border-gray-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Video className="w-5 h-5 text-primary print:text-black" />
                  <CardTitle className="text-xl print:text-black">Image & Video Production Prompts</CardTitle>
                </div>
                <Button
                  onClick={() => copyToClipboard(project.imageVideoPrompts!, 'Production prompts')}
                  variant="ghost"
                  size="sm"
                  className="print:hidden"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Image Generation Controls */}
              {!isReadOnly && (
                <div className="space-y-4 p-4 bg-muted rounded-lg print:hidden">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground">Generate Production Images</h4>
                    <Badge variant="secondary" className="text-xs">
                      {selectedImageModel?.includes('lightning') ? 'Budget-Friendly' : 'Premium Quality'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="image-model">Image Model</Label>
                      <Select value={selectedImageModel} onValueChange={(value: ImageModel) => setSelectedImageModel(value)}>
                        <SelectTrigger id="image-model">
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dreamshaper-lightning">
                            <div className="flex items-center gap-2">
                              <span>DreamShaper Lightning</span>
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Budget</Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="juggernaut-lightning">
                            <div className="flex items-center gap-2">
                              <span>Juggernaut Lightning</span>
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Budget</Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="realdream-lightning">
                            <div className="flex items-center gap-2">
                              <span>RealDream Lightning</span>
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Budget</Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="realvis-lightning">
                            <div className="flex items-center gap-2">
                              <span>RealVis Lightning</span>
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Budget</Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="seedream-4">
                            <div className="flex items-center gap-2">
                              <span>Seedream 4</span>
                              <Badge variant="outline" className="text-xs">Premium</Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="flux-1.1-pro-ultra">
                            <div className="flex items-center gap-2">
                              <span>Flux Pro Ultra</span>
                              <Badge variant="outline" className="text-xs">Premium</Badge>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="image-quality">Quality</Label>
                      <Select value={selectedImageQuality} onValueChange={(value: 'standard' | '4k') => setSelectedImageQuality(value)}>
                        <SelectTrigger id="image-quality">
                          <SelectValue placeholder="Select quality" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">HD (1920×1080)</SelectItem>
                          <SelectItem value="4k">4K (3840×2160)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button 
                    onClick={handleGenerateProductionImages}
                    disabled={isGeneratingImages || scenes.length === 0}
                    variant={isGeneratingImages ? "secondary" : "default"}
                    className="w-full"
                  >
                    {isGeneratingImages ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Images...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Generate Images for {scenes.length} Scene{scenes.length !== 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Generated Production Images */}
              {project.generatedProductionImages && project.generatedProductionImages.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground print:text-black">Generated Production Images</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {project.generatedProductionImages.map((image) => (
                      <div key={image.id} className="border rounded-lg overflow-hidden">
                        {image.imageUrl && (
                          <>
                            <img 
                              src={image.imageUrl} 
                              alt={`Scene ${image.sceneNumber} production image`}
                              className="w-full h-32 object-cover"
                            />
                            <div className="p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <Badge variant="outline">Scene {image.sceneNumber}</Badge>
                                <div className="flex gap-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {image.imageQuality === '4k' ? '4K' : 'HD'}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {image.imageModel?.includes('lightning') ? 
                                      image.imageModel.split('-')[0].charAt(0).toUpperCase() + image.imageModel.split('-')[0].slice(1) :
                                      image.imageModel === 'flux-1.1-pro-ultra' ? 'Flux' : 'Seedream'
                                    }
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {image.imagePrompt}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Scene Prompts */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground print:text-black">Scene Breakdown</h4>
                {scenes.length > 0 ? (
                  <div className="space-y-4">
                    {scenes.map((scene, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <h5 className="font-medium text-foreground print:text-black flex items-center gap-2">
                          <Badge variant="outline">Scene {scene.scene_number}</Badge>
                        </h5>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h6 className="text-sm font-medium text-muted-foreground">Image Prompt:</h6>
                            <Button
                              onClick={() => copyToClipboard(scene.image_prompt, `Scene ${scene.scene_number} image prompt`)}
                              variant="ghost"
                              size="sm"
                              className="print:hidden"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                          <p className="text-sm text-foreground print:text-black bg-background p-2 rounded border">
                            {scene.image_prompt}
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h6 className="text-sm font-medium text-muted-foreground">Video Prompt:</h6>
                            <Button
                              onClick={() => copyToClipboard(scene.video_prompt, `Scene ${scene.scene_number} video prompt`)}
                              variant="ghost"
                              size="sm"
                              className="print:hidden"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                          <p className="text-sm text-foreground print:text-black bg-background p-2 rounded border">
                            {scene.video_prompt}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Production prompts will appear here once generated.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}


        {/* Footer with PDF button (hidden in print mode) */}
        <footer className="text-center pt-8 print:hidden">
          <Button
            onClick={generatePDF}
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
          >
            <FileText className="w-4 h-4 mr-2" />
            Download PDF Summary
          </Button>
        </footer>
      </div>
    </div>
  );
};