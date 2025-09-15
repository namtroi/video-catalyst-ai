import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, Eye, Search, ArrowLeft, Calendar } from 'lucide-react';
import { SavedProjectsService, SavedProject } from '@/services/savedProjectsService';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SavedProjectsLibraryProps {
  onViewProject: (project: SavedProject) => void;
  onBackToDashboard: () => void;
}

export const SavedProjectsLibrary: React.FC<SavedProjectsLibraryProps> = ({
  onViewProject,
  onBackToDashboard,
}) => {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<SavedProject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      setFilteredProjects(
        projects.filter(project =>
          project.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.title?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredProjects(projects);
    }
  }, [searchTerm, projects]);

  const loadProjects = async () => {
    try {
      const savedProjects = await SavedProjectsService.getUserSavedProjects();
      setProjects(savedProjects);
      setFilteredProjects(savedProjects);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load saved projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await SavedProjectsService.deleteSavedProject(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading saved projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBackToDashboard} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">My Saved Projects</h1>
            <p className="text-muted-foreground">
              Manage your saved video projects ({projects.length} total)
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search projects by name, topic, or title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📁</div>
          <h3 className="text-xl font-semibold mb-2">
            {searchTerm ? 'No projects found' : 'No saved projects yet'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Complete your first project and save it to see it here'}
          </p>
          {searchTerm && (
            <Button variant="outline" onClick={() => setSearchTerm('')}>
              Clear Search
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{project.project_name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(project.created_at), 'MMM d, yyyy')}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {project.topic && (
                    <div>
                      <Badge variant="secondary" className="text-xs">Topic</Badge>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {project.topic}
                      </p>
                    </div>
                  )}
                  
                  {project.title && (
                    <div>
                      <Badge variant="secondary" className="text-xs">Title</Badge>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {project.title}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewProject(project)}
                      className="gap-2 flex-1 mr-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Project</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{project.project_name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteProject(project.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};