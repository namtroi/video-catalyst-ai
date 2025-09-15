import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Edit, Plus, Copy } from 'lucide-react';
import { Template } from '@/types';
import { TemplateService } from '@/services/templateService';
import { useToast } from '@/components/ui/use-toast';

interface TemplateManagerProps {
  onTemplateSelect: (template: Template) => void;
}

export const TemplateManager = ({ onTemplateSelect }: TemplateManagerProps) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    topic_settings: '',
    angle_settings: '',
    hook_settings: '',
    title_settings: '',
    thumbnail_settings: '',
    script_settings: '',
    production_settings: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const userTemplates = await TemplateService.getUserTemplates();
      setTemplates(userTemplates);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      topic_settings: '',
      angle_settings: '',
      hook_settings: '',
      title_settings: '',
      thumbnail_settings: '',
      script_settings: '',
      production_settings: '',
    });
    setEditingTemplate(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (template: Template) => {
    setFormData({
      name: template.name,
      topic_settings: template.topic_settings,
      angle_settings: template.angle_settings,
      hook_settings: template.hook_settings,
      title_settings: template.title_settings,
      thumbnail_settings: template.thumbnail_settings,
      script_settings: template.script_settings,
      production_settings: template.production_settings,
    });
    setEditingTemplate(template);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingTemplate) {
        await TemplateService.updateTemplate(editingTemplate.id, formData);
        toast({
          title: "Success",
          description: "Template updated successfully",
        });
      } else {
        await TemplateService.createTemplate(formData);
        toast({
          title: "Success",
          description: "Template created successfully",
        });
      }
      await loadTemplates();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (template: Template) => {
    if (!confirm(`Delete template "${template.name}"?`)) return;
    
    try {
      await TemplateService.deleteTemplate(template.id);
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
      await loadTemplates();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  const handleDuplicate = async (template: Template) => {
    const generateUniqueName = (baseName: string) => {
      const existingNames = templates.map(t => t.name);
      let newName = `${baseName} (Copy)`;
      let counter = 2;
      
      while (existingNames.includes(newName)) {
        newName = `${baseName} (Copy ${counter})`;
        counter++;
      }
      
      return newName;
    };

    try {
      const duplicateData = {
        name: generateUniqueName(template.name),
        topic_settings: template.topic_settings,
        angle_settings: template.angle_settings,
        hook_settings: template.hook_settings,
        title_settings: template.title_settings,
        thumbnail_settings: template.thumbnail_settings,
        script_settings: template.script_settings,
        production_settings: template.production_settings,
      };
      
      await TemplateService.createTemplate(duplicateData);
      toast({
        title: "Success",
        description: "Template duplicated successfully",
      });
      await loadTemplates();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate template",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading templates...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Templates</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Educational Tech Videos"
                />
              </div>
              
              <div className="space-y-4 text-sm text-muted-foreground mb-4 p-3 bg-muted/50 rounded-md">
                <p><strong>Variable Guide:</strong> Use these variables in your custom instructions:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><code>{"{topic}"}</code> - Available in Angle, Hook, Title steps</div>
                  <div><code>{"{angle}"}</code> - Available in Hook, Title steps</div>
                  <div><code>{"{hook}"}</code> - Available in Title, Thumbnail, Script steps</div>
                  <div><code>{"{title}"}</code> - Available in Thumbnail, Script steps</div>
                  <div><code>{"{script}"}</code> - Available in Scenes step</div>
                </div>
                <p><em>Leave empty to use default prompts. Custom instructions replace default prompts entirely.</em></p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="topic_settings">Topic Instructions</Label>
                  <Textarea
                    id="topic_settings"
                    value={formData.topic_settings}
                    onChange={(e) => setFormData({...formData, topic_settings: e.target.value})}
                    placeholder="e.g. Generate trending tech topics for educational content..."
                    className="min-h-[80px]"
                  />
                  <p className="text-xs text-muted-foreground mt-1">No variables available (first step)</p>
                </div>
                
                <div>
                  <Label htmlFor="angle_settings">Angle Instructions</Label>
                  <Textarea
                    id="angle_settings"
                    value={formData.angle_settings}
                    onChange={(e) => setFormData({...formData, angle_settings: e.target.value})}
                    placeholder="e.g. Create 3 unique angles for {topic} targeting beginners..."
                    className="min-h-[80px]"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Available: <code>{"{topic}"}</code></p>
                </div>
                
                <div>
                  <Label htmlFor="hook_settings">Hook Instructions</Label>
                  <Textarea
                    id="hook_settings"
                    value={formData.hook_settings}
                    onChange={(e) => setFormData({...formData, hook_settings: e.target.value})}
                    placeholder="e.g. Create engaging hooks for {topic} with {angle} approach..."
                    className="min-h-[80px]"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Available: <code>{"{topic}"}</code>, <code>{"{angle}"}</code></p>
                </div>
                
                <div>
                  <Label htmlFor="title_settings">Title Instructions</Label>
                  <Textarea
                    id="title_settings"
                    value={formData.title_settings}
                    onChange={(e) => setFormData({...formData, title_settings: e.target.value})}
                    placeholder="e.g. Generate SEO titles for {topic} using {angle} and {hook}..."
                    className="min-h-[80px]"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Available: <code>{"{topic}"}</code>, <code>{"{angle}"}</code>, <code>{"{hook}"}</code></p>
                </div>
                
                <div>
                  <Label htmlFor="thumbnail_settings">Thumbnail Instructions</Label>
                  <Textarea
                    id="thumbnail_settings"
                    value={formData.thumbnail_settings}
                    onChange={(e) => setFormData({...formData, thumbnail_settings: e.target.value})}
                    placeholder="e.g. Create thumbnail descriptions for {title} with {hook} style..."
                    className="min-h-[80px]"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Available: <code>{"{title}"}</code>, <code>{"{hook}"}</code></p>
                </div>
                
                <div>
                  <Label htmlFor="script_settings">Script Instructions</Label>
                  <Textarea
                    id="script_settings"
                    value={formData.script_settings}
                    onChange={(e) => setFormData({...formData, script_settings: e.target.value})}
                    placeholder="e.g. Write script for {title} starting with {hook}..."
                    className="min-h-[80px]"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Available: <code>{"{title}"}</code>, <code>{"{hook}"}</code></p>
                </div>
              </div>
              
              <div>
                <Label htmlFor="production_settings">Production Instructions</Label>
                <Textarea
                  id="production_settings"
                  value={formData.production_settings}
                  onChange={(e) => setFormData({...formData, production_settings: e.target.value})}
                  placeholder="e.g. Break down {script} into scenes with visual prompts..."
                  className="min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground mt-1">Available: <code>{"{script}"}</code></p>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={!formData.name.trim()}>
                  {editingTemplate ? 'Update' : 'Create'} Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid gap-3">
        {templates.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No templates yet. Create your first template to save time on future projects!
            </CardContent>
          </Card>
        ) : (
          templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Updated {template.updated_at.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onTemplateSelect(template)}
                    >
                      Use Template
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(template)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(template)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(template)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};