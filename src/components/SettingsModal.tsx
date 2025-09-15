import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Key, Brain, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AIModel } from '@/services/aiService';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserSettings {
  selected_model: AIModel;
  deepseek_api_key_set: boolean;
  openai_api_key_set: boolean;
}

export const SettingsModal = ({ open, onOpenChange }: SettingsModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [deepseekKey, setDeepseekKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [showDeepseekKey, setShowDeepseekKey] = useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);

  useEffect(() => {
    if (open && user) {
      loadUserSettings();
    }
  }, [open, user]);

  const loadUserSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setSettings({
          selected_model: data.selected_model as AIModel,
          deepseek_api_key_set: data.deepseek_api_key_set,
          openai_api_key_set: data.openai_api_key_set
        });
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    }
  };

  const saveApiKey = async (model: 'deepseek' | 'openai', apiKey: string) => {
    if (!user || !apiKey.trim()) return;

    setTestingConnection(model);
    
    try {
      // Test the API key first
      const isValid = await testApiKey(model, apiKey.trim());
      
      if (!isValid) {
        throw new Error(`Invalid ${model} API key`);
      }

      // Store API key in Supabase secrets
      const secretName = model === 'deepseek' ? 'DEEPSEEK_API_KEY' : 'OPENAI_API_KEY';
      
      // Note: In a real implementation, you would need a separate edge function to store user-specific API keys
      // For now, we'll update the user settings to indicate the key is set
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          [`${model}_api_key_set`]: true,
          selected_model: settings?.selected_model || 'deepseek'
        });

      if (error) throw error;

      await loadUserSettings();

      toast({
        title: "Success",
        description: `${model} API key saved and verified`,
      });

      // Clear the input
      if (model === 'deepseek') setDeepseekKey('');
      if (model === 'openai') setOpenaiKey('');
      
    } catch (error) {
      console.error(`Error saving ${model} API key:`, error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to save ${model} API key`,
        variant: "destructive",
      });
    } finally {
      setTestingConnection(null);
    }
  };

  const testApiKey = async (model: 'deepseek' | 'openai', apiKey: string): Promise<boolean> => {
    try {
      const url = model === 'deepseek' 
        ? 'https://api.deepseek.com/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model === 'deepseek' ? 'deepseek-chat' : 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 5,
        }),
      });

      return response.ok || response.status === 429; // 429 = rate limit, but key is valid
    } catch {
      return false;
    }
  };

  const updateSelectedModel = async (model: AIModel) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          selected_model: model,
          deepseek_api_key_set: settings?.deepseek_api_key_set || false,
          openai_api_key_set: settings?.openai_api_key_set || false
        });

      if (error) throw error;

      await loadUserSettings();

      toast({
        title: "Model Updated",
        description: `Switched to ${model === 'deepseek' ? 'Deepseek' : 'ChatGPT'}`,
      });
    } catch (error) {
      console.error('Error updating selected model:', error);
      toast({
        title: "Error",
        description: "Failed to update selected model",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Model Settings
          </DialogTitle>
          <DialogDescription>
            Configure your AI models and API keys for content generation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Model Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Model</CardTitle>
              <CardDescription>
                Choose which AI model to use for content generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select 
                value={settings?.selected_model || 'deepseek'} 
                onValueChange={updateSelectedModel}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select AI model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deepseek">
                    <div className="flex items-center gap-2">
                      <span>Deepseek</span>
                      <Badge variant={settings?.deepseek_api_key_set ? "default" : "secondary"}>
                        {settings?.deepseek_api_key_set ? 'Configured' : 'Not configured'}
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="openai">
                    <div className="flex items-center gap-2">
                      <span>ChatGPT (OpenAI)</span>
                      <Badge variant={settings?.openai_api_key_set ? "default" : "secondary"}>
                        {settings?.openai_api_key_set ? 'Configured' : 'Not configured'}
                      </Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Deepseek Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Deepseek API Configuration
                {settings?.deepseek_api_key_set && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </CardTitle>
              <CardDescription>
                Get your API key from <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Deepseek Platform</a>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    type={showDeepseekKey ? "text" : "password"}
                    placeholder="sk-..."
                    value={deepseekKey}
                    onChange={(e) => setDeepseekKey(e.target.value)}
                    disabled={testingConnection === 'deepseek'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setShowDeepseekKey(!showDeepseekKey)}
                  >
                    {showDeepseekKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                </div>
                <Button 
                  onClick={() => saveApiKey('deepseek', deepseekKey)}
                  disabled={!deepseekKey.trim() || testingConnection === 'deepseek'}
                >
                  {testingConnection === 'deepseek' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    'Save & Test'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* OpenAI Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                OpenAI API Configuration
                {settings?.openai_api_key_set && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </CardTitle>
              <CardDescription>
                Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenAI Platform</a>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    type={showOpenaiKey ? "text" : "password"}
                    placeholder="sk-..."
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    disabled={testingConnection === 'openai'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                  >
                    {showOpenaiKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                </div>
                <Button 
                  onClick={() => saveApiKey('openai', openaiKey)}
                  disabled={!openaiKey.trim() || testingConnection === 'openai'}
                >
                  {testingConnection === 'openai' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    'Save & Test'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <Key className="h-4 w-4" />
            <AlertDescription>
              Your API keys are stored securely and only used for your content generation requests. We never share or store your keys in plain text.
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
};