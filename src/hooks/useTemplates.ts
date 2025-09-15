import { useState, useEffect } from 'react';
import { Template } from '@/types';
import { TemplateService } from '@/services/templateService';
import { useToast } from '@/components/ui/use-toast';

export const useTemplates = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
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

  useEffect(() => {
    loadTemplates();
  }, []);

  return {
    templates,
    isLoading,
    refreshTemplates: loadTemplates,
  };
};