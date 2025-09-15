import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  BookMarked
} from 'lucide-react';
import { VideoProject, Scene, ScenesResponse } from '@/types';
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

interface ProjectSummaryProps {
  project: VideoProject;
  onBackToSteps: () => void;
  onViewSavedProjects?: () => void;
  isReadOnly?: boolean;
  savedProjectName?: string;
}

export const ProjectSummary = ({ 
  project, 
  onBackToSteps, 
  onViewSavedProjects,
  isReadOnly = false,
  savedProjectName
}: ProjectSummaryProps) => {
  const [isScriptExpanded, setIsScriptExpanded] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState(savedProjectName || '');
  const [isSaving, setIsSaving] = useState(false);

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
            {isReadOnly ? savedProjectName || 'Saved Project' : 'Your Complete YouTube Video Project'}
          </h1>
          <p className="text-muted-foreground">
            {isReadOnly 
              ? 'View your saved project details and export your work.'
              : 'Your complete video project is ready! Review all components and export your work.'
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
                <p className="text-foreground print:text-black font-medium">{project.title}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Thumbnails Section */}
        {(project.thumbnailPrompt || (project.generatedThumbnails && project.generatedThumbnails.length > 0)) && (
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground print:text-black flex items-center">
              <ImageIcon className="w-6 h-6 mr-2 text-primary print:text-black" />
              Thumbnail Options
            </h2>
            
            {project.generatedThumbnails && project.generatedThumbnails.length > 0 ? (
              <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4">
                {project.generatedThumbnails.map((thumbnail) => (
                  <Card 
                    key={thumbnail.id} 
                    className={`shadow-md print:shadow-none print:border print:border-gray-300 ${
                      project.selectedThumbnailId === thumbnail.id ? 'border-2 border-success ring-2 ring-success/20' : 'border-2 border-muted'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        {thumbnail.imageUrl ? (
                          <div className="w-full relative group">
                            <img 
                              src={thumbnail.imageUrl}
                              alt={thumbnail.text}
                              className="w-full aspect-video object-cover rounded-lg border"
                              loading="lazy"
                            />
                            {project.selectedThumbnailId === thumbnail.id && (
                              <div className="absolute top-2 left-2">
                                <Badge className="bg-success text-success-foreground">
                                  Selected
                                </Badge>
                              </div>
                            )}
                            <div className="absolute top-2 right-2 flex gap-1">
                              {thumbnail.imageQuality && (
                                <Badge 
                                  variant={thumbnail.imageQuality === '4k' ? 'default' : 'secondary'}
                                >
                                  {thumbnail.imageQuality === '4k' ? '4K' : 'YouTube'}
                                </Badge>
                              )}
                              {thumbnail.imageModel && (
                                <Badge 
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {thumbnail.imageModel === 'flux-1.1-pro-ultra' ? 'Flux' : 'Seedream'}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-32 bg-muted rounded flex items-center justify-center print:bg-gray-100">
                            <ImageIcon className="w-8 h-8 text-muted-foreground print:text-gray-400" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-foreground mb-3 print:text-black">{thumbnail.text}</p>
                      <Button
                        onClick={() => copyToClipboard(thumbnail.text, 'Thumbnail Prompt')}
                        variant="outline"
                        size="sm"
                        className="w-full print:hidden"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Prompt
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : project.thumbnailPrompt && (
              <div className="grid sm:grid-cols-1 gap-4">
                <Card className="shadow-md print:shadow-none print:border print:border-gray-300 border-2 border-muted">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-full h-32 bg-muted rounded flex items-center justify-center print:bg-gray-100">
                        <ImageIcon className="w-8 h-8 text-muted-foreground print:text-gray-400" />
                      </div>
                    </div>
                    <p className="text-sm text-foreground mb-3 print:text-black">{project.thumbnailPrompt}</p>
                    <Button
                      onClick={() => copyToClipboard(project.thumbnailPrompt!, 'Thumbnail Prompt')}
                      variant="outline"
                      size="sm"
                      className="w-full print:hidden"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Prompt
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </section>
        )}

        {/* Script Section */}
        {project.script && (
          <section className="space-y-4">
            <Collapsible open={isScriptExpanded} onOpenChange={setIsScriptExpanded}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-0 h-auto text-left print:hidden"
                >
                  <h2 className="text-2xl font-bold text-foreground flex items-center">
                    <Video className="w-6 h-6 mr-2 text-primary" />
                    Full Video Script
                  </h2>
                  {isScriptExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <div className="print:block">
                <h2 className="text-2xl font-bold text-foreground print:text-black flex items-center print:block hidden">
                  <Video className="w-6 h-6 mr-2 text-primary print:text-black" />
                  Full Video Script
                </h2>
              </div>
              
              <CollapsibleContent className="space-y-4 print:block">
                <div className="flex justify-end print:hidden">
                  <Button
                    onClick={() => copyToClipboard(project.script!, 'Script')}
                    variant="outline"
                    size="sm"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Script
                  </Button>
                </div>
                
                <Card className="shadow-md print:shadow-none print:border print:border-gray-300">
                  <CardContent className="p-4">
                    <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground print:text-black overflow-auto max-h-96 print:max-h-none">
                      {project.script}
                    </pre>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          </section>
        )}

        {/* Production Prompts Section */}
        {project.imageVideoPrompts && (
          <section className="space-y-4 print:break-before-page">
            <h2 className="text-2xl font-bold text-foreground print:text-black flex items-center">
              <Video className="w-6 h-6 mr-2 text-primary print:text-black" />
              Image & Video Production Prompts
            </h2>
            
             {scenes.length > 0 ? (
              <ol className="space-y-6">
                {scenes.map((scene) => (
                  <li key={scene.scene_number} className="space-y-3">
                    <h3 className="text-lg font-semibold text-foreground print:text-black">
                      Scene {scene.scene_number}
                    </h3>
                    
                    {scene.image_prompt && (
                      <Card className="shadow-sm print:shadow-none print:border print:border-gray-200">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium text-foreground print:text-black flex items-center">
                              <ImageIcon className="w-4 h-4 mr-2 text-primary print:text-black" />
                              Image Prompt
                            </h4>
                            <Button
                              onClick={() => copyToClipboard(scene.image_prompt, `Scene ${scene.scene_number} Image Prompt`)}
                              variant="ghost"
                              size="sm"
                              className="print:hidden"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm text-foreground print:text-black">{scene.image_prompt}</p>
                        </CardContent>
                      </Card>
                    )}
                    
                    {scene.video_prompt && (
                      <Card className="shadow-sm print:shadow-none print:border print:border-gray-200">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium text-foreground print:text-black flex items-center">
                              <Video className="w-4 h-4 mr-2 text-primary print:text-black" />
                              Video Prompt
                            </h4>
                            <Button
                              onClick={() => copyToClipboard(scene.video_prompt, `Scene ${scene.scene_number} Video Prompt`)}
                              variant="ghost"
                              size="sm"
                              className="print:hidden"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm text-foreground print:text-black">{scene.video_prompt}</p>
                        </CardContent>
                      </Card>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <Card className="shadow-md print:shadow-none print:border print:border-gray-300">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium text-foreground print:text-black">Production Prompts</h4>
                    <Button
                      onClick={() => copyToClipboard(project.imageVideoPrompts!, 'Production Prompts')}
                      variant="ghost"
                      size="sm"
                      className="print:hidden"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <pre className="whitespace-pre-wrap text-sm text-foreground print:text-black">
                    {project.imageVideoPrompts}
                  </pre>
                </CardContent>
              </Card>
            )}
          </section>
        )}

        {/* Footer */}
        <footer className="text-center pt-8 print:hidden">
          <Button
            onClick={generatePDF}
            variant="outline"
            className="bg-success text-success-foreground hover:bg-success/90"
            size="lg"
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </footer>
      </div>
    </div>
  );
};