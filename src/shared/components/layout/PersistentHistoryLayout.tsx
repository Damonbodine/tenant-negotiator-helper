import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { EnhancedConversationSidebar } from '@/components/chat/EnhancedConversationSidebar';
import { cn } from '@/lib/utils';

interface PersistentHistoryLayoutProps {
  children: React.ReactNode;
}

export function PersistentHistoryLayout({ children }: PersistentHistoryLayoutProps) {
  const { user } = useAuth();
  const [currentConversationId, setCurrentConversationId] = useState<string>();

  // Only show history sidebar for authenticated users
  if (!user) {
    return <>{children}</>;
  }

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    // TODO: Navigate to conversation or open conversation details
    console.log('Selected conversation:', conversationId);
  };

  const handleNewConversation = () => {
    // TODO: Create new conversation flow
    console.log('Creating new conversation...');
  };

  return (
    <div className="flex h-full">
      {/* Persistent Conversation History Sidebar - Hidden on mobile, visible on lg+ screens */}
      <div className="hidden lg:flex flex-shrink-0">
        <EnhancedConversationSidebar
          currentConversationId={currentConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          className="h-full border-r-2 border-slate-200 dark:border-slate-700"
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}