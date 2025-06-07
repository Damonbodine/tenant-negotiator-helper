import React, { Suspense } from 'react';
import { useArtifactStore, useCurrentArtifact, usePanelVisible, usePanelWidth, useLayoutMode } from '@/shared/stores/artifactStore';
import { Card } from '@/shared/ui/card';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Button } from '@/shared/ui/button';
import { X, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import { ArtifactRenderer } from './ArtifactRenderer';
import { ArtifactHistory } from './ArtifactHistory';
import { cn } from '@/lib/utils';

interface ArtifactPanelProps {
  className?: string;
}

export const ArtifactPanel: React.FC<ArtifactPanelProps> = ({ className }) => {
  const visible = usePanelVisible();
  const width = usePanelWidth(); 
  const layoutMode = useLayoutMode();
  const currentArtifact = useCurrentArtifact();
  const { 
    artifacts, 
    togglePanel, 
    setPanelVisible, 
    setCurrentArtifact,
    setLayoutMode,
    setPanelWidth 
  } = useArtifactStore();

  if (!visible || artifacts.length === 0) {
    return null;
  }

  const handleClose = () => {
    setPanelVisible(false);
  };

  const handlePrevious = () => {
    if (!currentArtifact) return;
    const currentIndex = artifacts.findIndex(a => a.id === currentArtifact.id);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : artifacts.length - 1;
    setCurrentArtifact(artifacts[prevIndex].id);
  };

  const handleNext = () => {
    if (!currentArtifact) return;
    const currentIndex = artifacts.findIndex(a => a.id === currentArtifact.id);
    const nextIndex = currentIndex < artifacts.length - 1 ? currentIndex + 1 : 0;
    setCurrentArtifact(artifacts[nextIndex].id);
  };

  const toggleExpanded = () => {
    setLayoutMode(layoutMode === 'split' ? 'overlay' : 'split');
  };

  const currentIndex = currentArtifact ? artifacts.findIndex(a => a.id === currentArtifact.id) + 1 : 0;

  return (
    <div 
      className={cn(
        "flex flex-col bg-background border-l border-border",
        layoutMode === 'overlay' && "fixed top-0 right-0 h-full z-50 shadow-xl",
        className
      )}
      style={{ 
        width: layoutMode === 'overlay' ? '80vw' : width,
        maxWidth: layoutMode === 'overlay' ? '1200px' : 'none'
      }}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">
            {currentArtifact?.title || 'Artifacts'}
          </h3>
          {artifacts.length > 1 && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              {currentIndex} of {artifacts.length}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {artifacts.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevious}
                disabled={artifacts.length <= 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNext}
                disabled={artifacts.length <= 1}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleExpanded}
            className="h-8 w-8 p-0"
          >
            {layoutMode === 'overlay' ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Panel Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {currentArtifact ? (
          <>
            {/* Current Artifact */}
            <ScrollArea className="flex-1">
              <div className="p-4">
                <Suspense fallback={<ArtifactSkeleton />}>
                  <ArtifactRenderer artifact={currentArtifact} />
                </Suspense>
              </div>
            </ScrollArea>
            
            {/* Artifact Description */}
            {currentArtifact.description && (
              <div className="p-4 border-t border-border bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  {currentArtifact.description}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center text-muted-foreground">
              <p className="text-sm">No artifact selected</p>
              <p className="text-xs mt-1">Choose an artifact from the history below</p>
            </div>
          </div>
        )}

        {/* Artifact History */}
        {artifacts.length > 1 && (
          <div className="border-t border-border bg-card">
            <ArtifactHistory />
          </div>
        )}
      </div>
    </div>
  );
};

const ArtifactSkeleton: React.FC = () => (
  <Card className="p-6">
    <div className="space-y-4">
      <div className="h-4 bg-muted rounded animate-pulse" />
      <div className="h-32 bg-muted rounded animate-pulse" />
      <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
    </div>
  </Card>
);