import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/shared/types';
import RentalMemoryService from '@/services/rentalMemoryService';

/**
 * Enhanced Memory Service
 * 
 * This service provides the EXACT SAME interface as the existing memoryService
 * but uses the new rental memory architecture under the hood for:
 * - Better performance (caching, indexing)
 * - Richer context (property relationships, user profiles)
 * - Improved AI responses (conversation continuity)
 * 
 * 100% BACKWARD COMPATIBLE - drop-in replacement
 */

// Maintain the same interface for backward compatibility
interface ChatMemory {
  id?: string;
  user_id: string;
  timestamp?: Date;
  summary: string;
  raw_chat_log: string;
  feature_type: string;
  is_active?: boolean;
}

class EnhancedMemoryService {
  private rentalMemoryService: RentalMemoryService;
  private conversationCache: Map<string, string> = new Map(); // userId-featureType -> conversationId

  constructor() {
    this.rentalMemoryService = new RentalMemoryService(supabase);
  }

  /**
   * EXACT SAME SIGNATURE as original saveChatMemory
   * Enhanced with new architecture under the hood
   */
  async saveChatMemory(
    userId: string,
    messages: ChatMessage[],
    featureType: string = 'market'
  ): Promise<boolean> {
    try {
      if (!userId || messages.length === 0) {
        console.error('Cannot save chat memory: missing userId or messages');
        return false;
      }

      // Get or create conversation for this user/featureType
      const conversationId = await this.getOrCreateConversation(userId, featureType);

      // Format the raw chat log (same as original)
      const rawChatLog = messages
        .map(msg => `${msg.type}: ${msg.text}`)
        .join('\n\n');
      
      // Generate a summary using the AI service (same as original)
      const summary = await this.generateChatSummary(rawChatLog);
      
      // Store in new rental architecture as a message
      await this.rentalMemoryService.addMessage({
        conversation_id: conversationId,
        role: 'assistant',
        content: summary,
        message_type: 'analysis',
        referenced_properties: [],
        // Store raw chat log in metadata for backward compatibility
        generated_insights: {
          raw_chat_log: rawChatLog,
          feature_type: featureType,
          legacy_summary: summary,
          message_count: messages.length
        }
      });

      // Also maintain backward compatibility by storing in old table (for gradual migration)
      await this.fallbackToOldSystem(userId, messages, featureType, summary, rawChatLog);

      console.log(`✅ Enhanced memory saved for user ${userId} (${featureType})`);
      return true;
    } catch (error) {
      console.error('Error in enhanced saveChatMemory:', error);
      // Fallback to old system on error
      return this.fallbackToOldSystem(userId, messages, featureType);
    }
  }

  /**
   * EXACT SAME SIGNATURE as original getRecentMemories
   * Enhanced with new architecture for better context
   */
  async getRecentMemories(
    userId: string,
    featureType: string = 'market', 
    limit: number = 3
  ): Promise<string[]> {
    try {
      if (!userId) {
        console.error('Cannot get recent memories: missing userId');
        return [];
      }

      // Try new system first
      const conversationId = await this.getConversationId(userId, featureType);
      if (conversationId) {
        const conversations = await this.rentalMemoryService.getUserRecentConversations(userId, limit);
        const conversation = conversations.find(c => c.id === conversationId);
        
        if (conversation && conversation.messages) {
          const summaries = conversation.messages
            .filter((msg: any) => msg.message_type === 'analysis' && msg.generated_insights?.legacy_summary)
            .map((msg: any) => msg.generated_insights.legacy_summary)
            .slice(0, limit);

          if (summaries.length > 0) {
            console.log(`✅ Retrieved ${summaries.length} enhanced memories`);
            return summaries;
          }
        }
      }

      // Fallback to old system
      return this.fallbackGetRecentMemories(userId, featureType, limit);
    } catch (error) {
      console.error('Error in enhanced getRecentMemories:', error);
      // Fallback to old system on error
      return this.fallbackGetRecentMemories(userId, featureType, limit);
    }
  }

  /**
   * EXACT SAME SIGNATURE as original deleteUserMemories
   */
  async deleteUserMemories(userId: string): Promise<boolean> {
    try {
      if (!userId) {
        console.error('Cannot delete memories: missing userId');
        return false;
      }

      // Note: Real RentalMemoryService doesn't have deleteUserData method
      // For now, we'll just use the old system cleanup and log this limitation
      console.log('⚠️ Enhanced memory: Bulk user data deletion not implemented in rental memory service yet');

      // Delete from old system for complete cleanup
      const { error } = await supabase
        .from('chat_memories')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting chat memories:', error);
        return false;
      }

      // Clear cache
      for (const [key] of this.conversationCache) {
        if (key.startsWith(userId)) {
          this.conversationCache.delete(key);
        }
      }

      console.log(`✅ Enhanced memory deletion completed for user ${userId} (old system only)`);
      return true;
    } catch (error) {
      console.error('Error in enhanced deleteUserMemories:', error);
      return false;
    }
  }

  /**
   * EXACT SAME SIGNATURE as original formatMemoriesForContext
   */
  formatMemoriesForContext(memories: string[]): string {
    if (memories.length === 0) return '';

    return `
## Previous Conversation Context
The user has interacted with you before. Here are summaries of your past conversations to help you provide more relevant and personalized responses:

${memories.map((memory, index) => `Memory ${index + 1}: ${memory}`).join('\n\n')}

Please use this context to provide more personalized responses, but do not explicitly mention these previous conversations unless the user brings them up first.
`;
  }

  // PRIVATE HELPER METHODS

  private async getOrCreateConversation(userId: string, featureType: string): Promise<string> {
    const cacheKey = `${userId}-${featureType}`;
    
    // Check cache first
    if (this.conversationCache.has(cacheKey)) {
      return this.conversationCache.get(cacheKey)!;
    }

    try {
      // Try to find existing conversation for this user/featureType
      const existingConversations = await this.rentalMemoryService.getUserRecentConversations(userId, 5);
      const existingConversation = existingConversations.find(
        (conv: any) => conv.conversation_intent?.feature_type === featureType
      );

      if (existingConversation) {
        this.conversationCache.set(cacheKey, existingConversation.id);
        return existingConversation.id;
      }

      // Create new conversation
      const conversationTypeMap: Record<string, string> = {
        'market': 'general_advice',
        'negotiation': 'negotiation_help', 
        'analysis': 'listing_analyzer',
        'comparison': 'comparables',
        'script': 'email_script_builder'
      };

      const conversationType = conversationTypeMap[featureType] || 'general_advice';

      const newConversation = await this.rentalMemoryService.createConversation({
        user_id: userId,
        conversation_type: conversationType as any,
        title: `${featureType} conversation`,
        status: 'active',
        conversation_intent: { feature_type: featureType },
        context_properties: [],
        key_insights: [],
        action_items: [],
        follow_up_needed: false
      });

      this.conversationCache.set(cacheKey, newConversation.id);
      return newConversation.id;

    } catch (error) {
      console.error('Error getting/creating conversation:', error);
      // Generate a deterministic UUID based on userId and featureType for fallback
      return this.generateUUIDFromString(`${userId}-${featureType}`);
    }
  }

  private async getConversationId(userId: string, featureType: string): Promise<string | null> {
    const cacheKey = `${userId}-${featureType}`;
    
    // Check cache first
    if (this.conversationCache.has(cacheKey)) {
      return this.conversationCache.get(cacheKey)!;
    }

    try {
      // Try to find existing conversation for this user/featureType
      const conversations = await this.rentalMemoryService.getUserRecentConversations(userId, 10);
      const conversation = conversations.find(
        (conv: any) => conv.conversation_intent?.feature_type === featureType
      );

      if (conversation) {
        this.conversationCache.set(cacheKey, conversation.id);
        return conversation.id;
      }

      return null;
    } catch (error) {
      console.error('Error getting conversation ID:', error);
      return null;
    }
  }

  private async generateChatSummary(rawChatLog: string): Promise<string> {
    try {
      if (rawChatLog.length < 50) {
        return `Brief chat session: ${rawChatLog.substring(0, 100)}`;
      }

      // Use the existing chat-ai function to generate a summary
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          message: `Please summarize this rental negotiation conversation in 2-3 sentences, focusing on key insights, property details, and any negotiation strategies discussed:\n\n${rawChatLog}`,
          history: [],
          systemPrompt: 'You are a helpful assistant that creates concise summaries of rental negotiation conversations. Focus on actionable insights and key details.'
        }
      });

      if (error || !data?.text) {
        throw new Error('Failed to generate AI summary');
      }

      return data.text;
    } catch (error) {
      console.error('Error generating chat summary:', error);
      // Fallback to simple truncation
      return `Chat session summary: ${rawChatLog.substring(0, 200)}...`;
    }
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  private generateUUIDFromString(input: string): string {
    // Create a deterministic UUID v4-like string from input
    // This is a simple hash-based approach for fallback scenarios
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `${hex.slice(0,8)}-${hex.slice(0,4)}-4${hex.slice(1,4)}-8${hex.slice(0,3)}-${hex.slice(0,12).padEnd(12, '0')}`;
  }

  private async fallbackToOldSystem(
    userId: string, 
    messages: ChatMessage[], 
    featureType: string, 
    summary?: string, 
    rawChatLog?: string
  ): Promise<boolean> {
    try {
      // If summary and rawChatLog aren't provided, generate them
      if (!rawChatLog) {
        rawChatLog = messages.map(msg => `${msg.type}: ${msg.text}`).join('\n\n');
      }
      
      if (!summary) {
        summary = await this.generateChatSummary(rawChatLog);
      }

      const { error } = await supabase
        .from('chat_memories')
        .insert({
          user_id: userId,
          timestamp: new Date(),
          summary,
          raw_chat_log: rawChatLog,
          feature_type: featureType,
          is_active: true,
        });

      if (error) {
        console.error('Error saving to old system:', error);
        return false;
      }

      console.log(`💾 Fallback: Saved to old memory system for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error in fallback to old system:', error);
      return false;
    }
  }

  private async fallbackGetRecentMemories(
    userId: string,
    featureType: string,
    limit: number
  ): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('chat_memories')
        .select('summary')
        .eq('user_id', userId)
        .eq('feature_type', featureType)
        .eq('is_active', true)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting memories from old system:', error);
        return [];
      }

      const memories = data?.map(row => row.summary).filter(summary => summary) || [];
      console.log(`💾 Fallback: Retrieved ${memories.length} memories from old system`);
      return memories;
    } catch (error) {
      console.error('Error in fallback getRecentMemories:', error);
      return [];
    }
  }
}

// Create singleton instance
const enhancedMemoryService = new EnhancedMemoryService();

// Export functions with the same signatures for backward compatibility
export async function saveChatMemory(
  userId: string,
  messages: ChatMessage[],
  featureType: string = 'market'
): Promise<boolean> {
  return enhancedMemoryService.saveChatMemory(userId, messages, featureType);
}

export async function getRecentMemories(
  userId: string,
  featureType: string = 'market', 
  limit: number = 3
): Promise<string[]> {
  return enhancedMemoryService.getRecentMemories(userId, featureType, limit);
}

export async function deleteUserMemories(userId: string): Promise<boolean> {
  return enhancedMemoryService.deleteUserMemories(userId);
}

export function formatMemoriesForContext(memories: string[]): string {
  return enhancedMemoryService.formatMemoriesForContext(memories);
}

export { enhancedMemoryService }; 