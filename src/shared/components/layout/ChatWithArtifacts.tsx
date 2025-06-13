import React, { ReactNode, memo, useState } from 'react';
import { ArtifactPanel } from '@/shared/components/artifacts/ArtifactPanel';
import { usePanelVisible, usePanelWidth, useLayoutMode } from '@/shared/stores/artifactStore';
import { ConversationSidebar } from '@/components/chat/ConversationSidebar';
import { cn } from '@/lib/utils';

interface ChatWithArtifactsProps {
  children: ReactNode;
  className?: string;
  showConversationHistory?: boolean;
  currentConversationId?: string;
  onSelectConversation?: (conversationId: string) => void;
  onNewConversation?: () => void;
}

export const ChatWithArtifacts: React.FC<ChatWithArtifactsProps> = memo(({ 
  children, 
  className,
  showConversationHistory = false,
  currentConversationId,
  onSelectConversation,
  onNewConversation
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Use hooks normally - React will handle any initialization issues
  const visible = usePanelVisible();
  const width = usePanelWidth();
  const layoutMode = useLayoutMode();
  
  const showPanel = visible && layoutMode !== 'collapsed';
  
  // DEBUG: Force split mode for now to avoid overlay issues
  const debugLayoutMode = 'split';

  const handleSelectConversation = (conversationId: string) => {
    onSelectConversation?.(conversationId);
    // Close sidebar on mobile after selection
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleNewConversation = () => {
    onNewConversation?.();
    // Close sidebar on mobile after creating new conversation
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };
  
  return (
    <div className={cn("flex h-full relative", className)}>
      {/* Conversation Sidebar */}
      {showConversationHistory && (
        <ConversationSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          currentConversationId={currentConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          className={cn(
            "transition-all duration-200 z-50",
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-12"
          )}
        />
      )}

      {/* Chat Area */}
      <div 
        className={cn(
          "flex-1 min-w-0 transition-all duration-200",
          showPanel && debugLayoutMode === 'split' && "mr-1",
          showConversationHistory && sidebarOpen && "lg:ml-0",
          showConversationHistory && !sidebarOpen && "lg:ml-12"
        )}
        style={{
          marginRight: showPanel && debugLayoutMode === 'split' ? width : 0
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
              debugLayoutMode === 'split' && "fixed right-0 top-0 h-full z-40"
            )}
          />
        </React.Suspense>
      )}

      {/* Mobile sidebar overlay */}
      {showConversationHistory && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Overlay backdrop for overlay mode - DISABLED FOR DEBUG */}
      {visible && debugLayoutMode === 'overlay' && (
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