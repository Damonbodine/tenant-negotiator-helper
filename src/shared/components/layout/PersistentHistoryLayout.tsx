import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ConversationProvider, useConversationContext } from '@/contexts/ConversationContext';
import { EnhancedConversationSidebar } from '@/components/chat/EnhancedConversationSidebar';
import { useNavigate, useLocation } from 'react-router-dom';

interface PersistentHistoryLayoutProps {
  children: React.ReactNode;
}

function PersistentHistoryLayoutInner({ children }: PersistentHistoryLayoutProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const { currentConversation, selectConversation, createNewConversation } = useConversationContext();

  // Only show history sidebar for authenticated users
  if (!user) {
    return <>{children}</>;
  }

  const handleSelectConversation = async (conversationId: string) => {
    try {
      console.log('🔄 Selecting conversation:', conversationId);
      await selectConversation(conversationId);
      
      // Route to the appropriate page based on conversation type
      // For now, all conversations go to /negotiation as it's the main chat interface
      // but this could be expanded to route to different pages based on conversation type
      console.log('🔄 Navigating to /negotiation for conversation:', conversationId);
      navigate('/negotiation');
      
    } catch (error) {
      console.error('❌ Error selecting conversation:', error);
    }
  };

  const handleNewConversation = async () => {
    // Prevent multiple rapid clicks
    if (isCreatingConversation) {
      console.log('⏳ Already creating conversation, ignoring click');
      return;
    }

    try {
      setIsCreatingConversation(true);
      console.log('🚀 Creating new conversation...', { currentPath: location.pathname });
      
      const conversationId = await createNewConversation('negotiation_help');
      console.log('✅ Conversation created:', conversationId);
      
      if (conversationId) {
        console.log('🔄 Navigating to /negotiation...', { from: location.pathname });
        
        // Force navigation even if we're already on the negotiation page
        if (location.pathname === '/negotiation') {
          // If already on negotiation page, force a refresh by going to a different route first
          navigate('/', { replace: true });
          setTimeout(() => {
            navigate('/negotiation', { replace: true });
          }, 100);
        } else {
          navigate('/negotiation');
        }
        
        console.log('✅ Navigation initiated');
      } else {
        console.error('❌ Failed to create conversation - no ID returned');
      }
    } catch (error) {
      console.error('❌ Error in handleNewConversation:', error);
    } finally {
      setIsCreatingConversation(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* Persistent Conversation History Sidebar - Hidden on mobile, visible on lg+ screens */}
      <div className="hidden lg:flex flex-shrink-0">
        <EnhancedConversationSidebar
          currentConversationId={currentConversation?.conversationId}
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

export function PersistentHistoryLayout({ children }: PersistentHistoryLayoutProps) {
  return (
    <ConversationProvider>
      <PersistentHistoryLayoutInner>{children}</PersistentHistoryLayoutInner>
    </ConversationProvider>
  );
}