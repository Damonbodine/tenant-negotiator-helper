import React, { ReactNode, memo } from 'react';
import { ArtifactPanel } from '@/shared/components/artifacts/ArtifactPanel';
import { usePanelVisible, usePanelWidth, useLayoutMode } from '@/shared/stores/artifactStore';
import { cn } from '@/lib/utils';

interface ChatWithArtifactsProps {
  children: ReactNode;
  className?: string;
}

export const ChatWithArtifacts: React.FC<ChatWithArtifactsProps> = memo(({ 
  children, 
  className 
}) => {
  // Use hooks normally - React will handle any initialization issues
  const visible = usePanelVisible();
  const width = usePanelWidth();
  const layoutMode = useLayoutMode();
  
  const showPanel = visible && layoutMode !== 'collapsed';
  
  return (
    <div className={cn("flex h-full relative", className)}>
      {/* Chat Area */}
      <div 
        className={cn(
          "flex-1 min-w-0 transition-all duration-200",
          showPanel && layoutMode === 'split' && "mr-1"
        )}
        style={{
          marginRight: showPanel && layoutMode === 'split' ? width : 0
        }}
      >
        {children}
      </div>
      
      {/* Artifact Panel */}
      {showPanel && (
        <React.Suspense fallback={<div className="w-96 bg-background border-l">Loading...</div>}>
          <ArtifactPanel 
            className={cn(
              "transition-all duration-200",
              layoutMode === 'split' && "fixed right-0 top-0 h-full z-40"
            )}
          />
        </React.Suspense>
      )}
      
      {/* Overlay backdrop for overlay mode */}
      {visible && layoutMode === 'overlay' && (
        <div 
          className="fixed inset-0 bg-black/20 z-30"
          onClick={() => {
            // Could add close on backdrop click
          }}
        />
      )}
    </div>
  );
});