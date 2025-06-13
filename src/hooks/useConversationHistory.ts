import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import RentalMemoryService from '@/services/rentalMemoryService';
import { ChatMessage } from '@/shared/types';

export interface ConversationSummary {
  conversation_id: string;
  conversation_type: string;
  title: string | null;
  created_at: string;
  message_count: number;
  primary_property_address: string | null;
  context_summary: string | null;
}

export interface ConversationHistory {
  conversationId: string;
  messages: ChatMessage[];
  metadata: {
    title?: string;
    type: string;
    propertyContext?: string;
    createdAt: string;
  };
}

export function useConversationHistory() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ConversationHistory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rentalMemoryService = new RentalMemoryService(supabase);

  // Load user's recent conversations
  const loadRecentConversations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        setConversations([]);
        return;
      }

      const recentConversations = await rentalMemoryService.getUserRecentConversations(
        session.user.id, 
        20 // Load last 20 conversations
      );

      console.log('🔍 Raw RPC data:', recentConversations);

      // Transform the data to match our interface
      const formattedConversations: ConversationSummary[] = recentConversations.map(conv => {
        console.log('🔍 Processing conversation:', conv);
        return {
          conversation_id: conv.conversation_id,
          conversation_type: conv.conversation_type,
          title: conv.title || generateConversationTitle(conv.conversation_type),
          created_at: conv.created_at || new Date().toISOString(), // Fallback to current date
          message_count: conv.message_count || 0,
          primary_property_address: conv.primary_property_address,
          context_summary: conv.context_summary
        };
      });

      setConversations(formattedConversations);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Failed to load conversation history');
    } finally {
      setIsLoading(false);
    }
  };

  // Load a specific conversation with all messages
  const loadConversation = async (conversationId: string): Promise<ConversationHistory | null> => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔍 loadConversation called for:', conversationId);

      // Get conversation info directly from table
      const { data: conversationData, error: convError } = await supabase
        .from('rental_conversations')
        .select('id, conversation_type, title, created_at')
        .eq('id', conversationId)
        .single();

      if (convError || !conversationData) {
        console.error('❌ Failed to get conversation:', convError);
        throw new Error('Conversation not found');
      }

      // Get messages directly from table
      const { data: messagesData, error: msgError } = await supabase
        .from('rental_messages')
        .select('id, role, content, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (msgError) {
        console.error('❌ Failed to get messages:', msgError);
        throw new Error('Failed to load messages');
      }

      console.log('🔍 Raw conversation data:', conversationData);
      console.log('🔍 Raw messages data:', messagesData);

      // Transform messages to ChatMessage format
      const messages: ChatMessage[] = (messagesData || []).map(msg => ({
        id: msg.id,
        type: msg.role === 'user' ? 'user' : 'agent',
        text: msg.content,
        timestamp: new Date(msg.created_at)
      }));
      console.log('🔍 Transformed messages:', messages);

      const conversationHistory: ConversationHistory = {
        conversationId: conversationData.id,
        messages,
        metadata: {
          title: conversationData.title || 
                 generateConversationTitle(conversationData.conversation_type),
          type: conversationData.conversation_type,
          createdAt: conversationData.created_at || new Date().toISOString()
        }
      };

      setCurrentConversation(conversationHistory);
      return conversationHistory;

    } catch (err) {
      console.error('Error loading conversation:', err);
      setError('Failed to load conversation');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new conversation
  const startNewConversation = async (type: string = 'general_advice'): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        throw new Error('User not authenticated');
      }

      const newConversation = await rentalMemoryService.createConversation({
        user_id: session.user.id,
        conversation_type: type as any,
        title: null, // Will be generated from first message
        status: 'active',
        context_properties: [],
        key_insights: [],
        action_items: [],
        follow_up_needed: false
      });

      // Refresh conversations list
      await loadRecentConversations();
      
      return newConversation.id;
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError('Failed to create new conversation');
      return null;
    }
  };

  // Save message to current conversation
  const addMessageToConversation = async (
    conversationId: string, 
    message: string, 
    role: 'user' | 'assistant'
  ): Promise<void> => {
    try {
      await rentalMemoryService.addMessage({
        conversation_id: conversationId,
        role,
        content: message,
        message_type: 'text',
        referenced_properties: []
      });

      // Update current conversation if it's the one being modified
      if (currentConversation?.conversationId === conversationId) {
        const newMessage: ChatMessage = {
          id: crypto.randomUUID(),
          type: role === 'user' ? 'user' : 'agent',
          text: message,
          timestamp: new Date()
        };

        setCurrentConversation(prev => prev ? {
          ...prev,
          messages: [...prev.messages, newMessage]
        } : null);
      }

      // Refresh conversations list to update message count
      await loadRecentConversations();
    } catch (err) {
      console.error('Error saving message:', err);
      setError('Failed to save message');
    }
  };

  // Clear current conversation (start fresh)
  const clearCurrentConversation = () => {
    setCurrentConversation(null);
  };

  // Generate conversation title based on type
  const generateConversationTitle = (type: string): string => {
    const titles: Record<string, string> = {
      'listing_analyzer': 'Listing Analysis',
      'comparables': 'Property Comparison',
      'negotiation_help': 'Negotiation Help',
      'voice_chat': 'Voice Chat',
      'email_script_builder': 'Script Builder',
      'price_analysis': 'Price Analysis',
      'general_advice': 'General Advice'
    };
    
    return titles[type] || 'Conversation';
  };

  // Load conversations on mount
  useEffect(() => {
    loadRecentConversations();
  }, []);

  return {
    conversations,
    currentConversation,
    isLoading,
    error,
    loadRecentConversations,
    loadConversation,
    startNewConversation,
    addMessageToConversation,
    clearCurrentConversation,
    generateConversationTitle
  };
}