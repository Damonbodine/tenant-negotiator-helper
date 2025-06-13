import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ConversationHistory, useConversationHistory } from '@/hooks/useConversationHistory';
import { ChatMessage } from '@/shared/types';
import { conversationSummaryService } from '@/services/conversationSummaryService';

interface ConversationContextType {
  // Current conversation state
  currentConversation: ConversationHistory | null;
  isLoadingConversation: boolean;
  
  // Conversation management
  selectConversation: (conversationId: string) => Promise<void>;
  createNewConversation: (type?: string) => Promise<string | null>;
  clearConversation: () => void;
  
  // Message management
  addMessage: (message: ChatMessage) => void;
  updateMessages: (messages: ChatMessage[]) => void;
}

const ConversationContext = createContext<ConversationContextType | null>(null);

interface ConversationProviderProps {
  children: ReactNode;
}

export function ConversationProvider({ children }: ConversationProviderProps) {
  const [currentConversation, setCurrentConversation] = useState<ConversationHistory | null>(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);

  const {
    loadConversation,
    startNewConversation,
    clearCurrentConversation
  } = useConversationHistory();

  const selectConversation = useCallback(async (conversationId: string) => {
    try {
      setIsLoadingConversation(true);
      console.log('🔄 Loading conversation:', conversationId);
      
      const conversation = await loadConversation(conversationId);
      if (conversation) {
        setCurrentConversation(conversation);
        console.log('✅ Conversation loaded:', {
          id: conversation.conversationId,
          messageCount: conversation.messages.length,
          messages: conversation.messages.map(m => ({
            id: m.id,
            type: m.type,
            text: m.text.substring(0, 50) + '...'
          }))
        });
      } else {
        console.error('❌ Failed to load conversation - loadConversation returned null');
      }
    } catch (error) {
      console.error('❌ Error loading conversation:', error);
    } finally {
      setIsLoadingConversation(false);
    }
  }, [loadConversation]);

  const createNewConversation = useCallback(async (type: string = 'negotiation_help') => {
    try {
      setIsLoadingConversation(true);
      const conversationId = await startNewConversation(type);
      
      if (conversationId) {
        // Clear current conversation and set up new empty one
        setCurrentConversation({
          conversationId,
          messages: [],
          metadata: {
            type,
            createdAt: new Date().toISOString()
          }
        });
        console.log('✅ New conversation created:', conversationId);
      }
      
      return conversationId;
    } catch (error) {
      console.error('❌ Error creating conversation:', error);
      return null;
    } finally {
      setIsLoadingConversation(false);
    }
  }, [startNewConversation]);

  const clearConversation = useCallback(() => {
    setCurrentConversation(null);
    clearCurrentConversation();
  }, [clearCurrentConversation]);

  const addMessage = useCallback((message: ChatMessage) => {
    setCurrentConversation(prev => {
      if (!prev) return null;
      const newMessages = [...prev.messages, message];
      
      // Auto-generate summary after a few messages (async, don't block UI)
      if (newMessages.length >= 3 && newMessages.length % 3 === 0) {
        conversationSummaryService.generateAndSaveSummary({
          conversationId: prev.conversationId,
          messages: newMessages,
          conversationType: prev.metadata.type
        }).catch(err => console.warn('Failed to generate summary:', err));
      }
      
      return {
        ...prev,
        messages: newMessages
      };
    });
  }, []);

  const updateMessages = useCallback((messages: ChatMessage[]) => {
    setCurrentConversation(prev => {
      if (!prev) return null;
      return {
        ...prev,
        messages
      };
    });
  }, []);

  return (
    <ConversationContext.Provider
      value={{
        currentConversation,
        isLoadingConversation,
        selectConversation,
        createNewConversation,
        clearConversation,
        addMessage,
        updateMessages
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversationContext() {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversationContext must be used within a ConversationProvider');
  }
  return context;
}