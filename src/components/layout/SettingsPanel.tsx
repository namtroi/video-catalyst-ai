import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface SettingsPanelProps {
  customSettings: string;
  onSettingsChange: (settings: string) => void;
}

export const SettingsPanel = ({ customSettings, onSettingsChange }: SettingsPanelProps) => {
  return (
    <div className="w-80 bg-card border-l border-border h-full p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Customization Settings
          </h3>
          <p className="text-xs text-muted-foreground">
            Add extra instructions to customize AI generation
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="custom-settings" className="text-sm text-muted-foreground">
            Additional Instructions
          </Label>
          <Textarea
            id="custom-settings"
            value={customSettings}
            onChange={(e) => onSettingsChange(e.target.value)}
            placeholder="Add extra instructions for AI generation (e.g., 'Focus on educational tone', 'Target young adults', 'Include humor')"
            className="min-h-[200px] resize-y text-sm"
          />
        </div>

        <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg">
          <p className="font-medium mb-1">💡 Pro Tip:</p>
          <p>These settings will be applied to all AI generations. Be specific about tone, audience, style, or content preferences.</p>
        </div>
      </div>
    </div>
  );
};