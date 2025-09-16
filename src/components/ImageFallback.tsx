import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ImageIcon, RefreshCw, AlertCircle } from 'lucide-react';

interface ImageFallbackProps {
  title: string;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  className?: string;
}

export const ImageFallback = ({ 
  title, 
  onRegenerate, 
  isRegenerating = false, 
  className = "" 
}: ImageFallbackProps) => {
  return (
    <Card className={`bg-muted/50 border-dashed ${className}`}>
      <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-muted-foreground" />
        </div>
        
        <div className="space-y-2">
          <h3 className="font-medium text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">
            Image not available for this project
          </p>
        </div>

        {onRegenerate && (
          <Button
            onClick={onRegenerate}
            disabled={isRegenerating}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {isRegenerating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {isRegenerating ? 'Generating...' : 'Generate Image'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};