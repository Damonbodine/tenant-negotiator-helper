import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/shared/types';
import { promptService } from '@/shared/services/promptTemplates';
import RentalMemoryService from '@/services/rentalMemoryService';

/**
 * Enhanced Chat Client
 * 
 * Provides the EXACT SAME interface as chatClient but with enhanced context:
 * - Automatically includes relevant property context
 * - Better conversation continuity
 * - Improved memory integration
 * 
 * 100% BACKWARD COMPATIBLE - drop-in replacement
 */

let activePromptTemplateId = 'rental-agent';

class EnhancedChatClient {
  private rentalMemoryService: RentalMemoryService;
  private contextCache: Map<string, any> = new Map();

  constructor() {
    this.rentalMemoryService = new RentalMemoryService(supabase);
  }

  /**
   * EXACT SAME SIGNATURE as original setActivePromptTemplate
   */
  setActivePromptTemplate(templateId: string): void {
    activePromptTemplateId = templateId;
  }

  /**
   * EXACT SAME SIGNATURE as original getActivePromptTemplateId
   */
  getActivePromptTemplateId(): string {
    return activePromptTemplateId;
  }

  /**
   * EXACT SAME SIGNATURE as original sendMessageToGemini
   * Enhanced with better context awareness
   */
  async sendMessageToGemini(message: string, history: ChatMessage[]): Promise<string> {
    try {
      console.log("Enhanced chat: Sending message to AI model:", message);
      console.log("Enhanced chat: With history:", history);
      
      const templates = promptService.getPromptTemplates() || [];
      const activeTemplate = templates.find(t => t.id === activePromptTemplateId) || {
        id: 'default',
        name: 'Default Template',
        systemPrompt: 'You are a helpful rental assistant.'
      };
      
      const subPrompts = activeTemplate.subPrompts || [];
      const activatedSubPrompts = subPrompts.filter(
        sp => message.toLowerCase().includes(sp.trigger.toLowerCase())
      );
      
      let enhancedSystemPrompt = activeTemplate.systemPrompt;
      if (activatedSubPrompts.length > 0) {
        enhancedSystemPrompt += "\n\n## ACTIVATED CONTEXT MODULES:\n" + 
          activatedSubPrompts.map(sp => sp.content).join("\n\n");
      }

      // ENHANCEMENT: Add user context if available
      const userContext = await this.getUserContext();
      if (userContext) {
        enhancedSystemPrompt += "\n\n## USER CONTEXT:\n" + userContext;
      }

      // ENHANCEMENT: Add property context if relevant
      const propertyContext = await this.getRelevantPropertyContext(message, history);
      if (propertyContext) {
        enhancedSystemPrompt += "\n\n## RELEVANT PROPERTIES:\n" + propertyContext;
      }
      
      const formattedHistory = history.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));
      
      console.log('Enhanced chat: Calling chat-ai function with OpenAI GPT-4.1');
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: { 
          message, 
          history: formattedHistory,
          systemPrompt: enhancedSystemPrompt
        },
      });

      if (error) {
        console.error('Enhanced chat: Error calling AI API:', error);
        throw new Error('Failed to get response from AI service');
      }

      console.log("Enhanced chat: Response from AI model:", data);
      
      if (!data || !data.text) {
        console.error('Enhanced chat: Invalid response from AI API:', data);
        throw new Error('Received an invalid response from the AI service');
      }

      // Log model information for verification
      if (data.model) {
        console.log(`Enhanced chat: Model used for this response: ${data.model}`);
      } else {
        console.warn('Enhanced chat: No model information returned from AI service');
      }

      return data.text;
    } catch (error) {
      console.error('Enhanced chat: Error in sendMessage:', error);
      throw error;
    }
  }

  // PRIVATE ENHANCEMENT METHODS

  private async getUserContext(): Promise<string | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return null;

      const cacheKey = `user-context-${session.user.id}`;
      
      // Check cache first (valid for 5 minutes)
      if (this.contextCache.has(cacheKey)) {
        const cached = this.contextCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
          return cached.context;
        }
      }

      // Get fresh user context using real rental memory service
      const userContext = await this.rentalMemoryService.buildAIContext(session.user.id);
      
      if (!userContext || Object.keys(userContext).length === 0) {
        return null;
      }

      const contextString = this.formatUserContext(userContext);
      
      // Cache the result
      this.contextCache.set(cacheKey, {
        context: contextString,
        timestamp: Date.now()
      });

      return contextString;
    } catch (error) {
      console.error('Enhanced chat: Error getting user context:', error);
      return null;
    }
  }

  private async getRelevantPropertyContext(message: string, history: ChatMessage[]): Promise<string | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return null;

      // Look for property-related keywords in the message and recent history
      const propertyKeywords = [
        'property', 'apartment', 'house', 'rent', 'lease', 'address', 
        'landlord', 'unit', 'bedroom', 'bathroom', 'sqft', 'square feet'
      ];

      const recentText = [message, ...history.slice(-3).map(h => h.text)].join(' ').toLowerCase();
      
      if (!propertyKeywords.some(keyword => recentText.includes(keyword))) {
        return null;
      }

      // Get user's recent properties using real rental memory service
      const userContext = await this.rentalMemoryService.buildAIContext(session.user.id);
      
      if (!userContext?.user_context?.target_properties || userContext.user_context.target_properties.length === 0) {
        return null;
      }

      // Format property context
      const properties = userContext.user_context.target_properties.slice(0, 3); // Limit to 3 most relevant
      return properties.map((prop: any, index: number) => 
        `Property ${index + 1}: ${prop.address || 'No address'} - $${prop.rent_amount ? (prop.rent_amount / 100).toFixed(0) : 'Unknown'}/month${prop.bedrooms ? ` (${prop.bedrooms}br)` : ''}`
      ).join('\n');

    } catch (error) {
      console.error('Enhanced chat: Error getting property context:', error);
      return null;
    }
  }

  private formatUserContext(userContext: any): string {
    const parts: string[] = [];

    // Handle the structure returned by buildAIContext / get_user_property_context
    const profile = userContext?.user_context?.user_profile;
    
    if (profile?.location) {
      parts.push(`User location: ${profile.location}`);
    }

    if (profile?.budget_range_min && profile?.budget_range_max) {
      // Convert from cents to dollars if needed
      const minBudget = typeof profile.budget_range_min === 'number' && profile.budget_range_min > 10000 
        ? (profile.budget_range_min / 100).toFixed(0)
        : profile.budget_range_min;
      const maxBudget = typeof profile.budget_range_max === 'number' && profile.budget_range_max > 10000
        ? (profile.budget_range_max / 100).toFixed(0) 
        : profile.budget_range_max;
      parts.push(`Budget range: $${minBudget} - $${maxBudget}`);
    }

    if (profile?.current_situation) {
      parts.push(`Current situation: ${profile.current_situation}`);
    }

    if (profile?.negotiation_experience_level) {
      parts.push(`Negotiation experience: ${profile.negotiation_experience_level}`);
    }

    if (userContext?.user_context?.target_properties?.length > 0) {
      parts.push(`Properties tracked: ${userContext.user_context.target_properties.length} target properties`);
    }

    if (userContext?.user_context?.analysis_history?.length > 0) {
      parts.push(`Analysis history: ${userContext.user_context.analysis_history.length} previous analyses`);
    }

    return parts.length > 0 ? parts.join('\n') : '';
  }
}

// Create singleton instance
const enhancedChatClient = new EnhancedChatClient();

// Export with the same interface for drop-in replacement
export const chatClient = {
  setActivePromptTemplate(templateId: string): void {
    enhancedChatClient.setActivePromptTemplate(templateId);
  },

  getActivePromptTemplateId(): string {
    return enhancedChatClient.getActivePromptTemplateId();
  },

  async sendMessageToGemini(message: string, history: ChatMessage[]): Promise<string> {
    return enhancedChatClient.sendMessageToGemini(message, history);
  }
};

// Export the enhanced client instance for advanced usage
export { enhancedChatClient }; 