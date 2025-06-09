import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/shared/types';
import { promptService } from '@/shared/services/promptTemplates';
import RentalMemoryService from '@/services/rentalMemoryService';
import { parallelIntelligence } from '@/shared/services/parallelIntelligenceService';
import { intelligentContext } from '@/shared/services/intelligentContextService';

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
  private usePremiumIntelligence: boolean = true;
  private cacheEnabled: boolean = false; // DISABLED FOR DEBUGGING

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
   * Now powered by PREMIUM INTELLIGENCE for sub-2 second responses
   */
  async sendMessageToGemini(message: string, history: ChatMessage[]): Promise<string> {
    const startTime = Date.now();
    
    try {
      console.log("🚀 USING ENHANCED CHAT CLIENT (CACHING DISABLED)");
      console.log("🚀 Premium Enhanced Chat: Processing with parallel intelligence...");
      
      // Get user session for personalization
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      // PREMIUM INTELLIGENCE: Use parallel processing for lightning-fast responses
      if (this.usePremiumIntelligence && userId) {
        console.log("⚡ Using Premium Parallel Intelligence");
        
        // Initialize intelligent context for user
        await intelligentContext.buildUserContext(userId);
        
        // Build comprehensive intelligence request
        const intelligenceRequest = {
          userQuery: message,
          context: {
            location: await this.extractLocationFromContext(message, history),
            propertyDetails: await this.extractPropertyDetailsFromContext(message, history),
            userHistory: history.slice(-5), // Last 5 messages for context
            negotiationGoals: this.extractNegotiationGoals(message)
          },
          priorityLevel: 'comprehensive' as const
        };

        // Execute parallel intelligence analysis
        const intelligenceResponse = await parallelIntelligence.getComprehensiveIntelligence(intelligenceRequest);
        
        const responseTime = Date.now() - startTime;
        console.log(`✨ Premium Intelligence completed in ${responseTime}ms`);

        // Format premium response
        let premiumResponse = `${intelligenceResponse.primaryInsight.content}`;
        
        if (intelligenceResponse.actionableSteps.length > 0) {
          premiumResponse += `\n\n**Next Steps:**\n`;
          intelligenceResponse.actionableSteps.forEach((step, index) => {
            premiumResponse += `${index + 1}. ${step}\n`;
          });
        }

        if (intelligenceResponse.riskAssessment.level !== 'low') {
          premiumResponse += `\n\n**Risk Assessment:** ${intelligenceResponse.riskAssessment.level} risk - ${intelligenceResponse.riskAssessment.factors.join(', ')}`;
        }

        if (intelligenceResponse.nextRecommendations.length > 0) {
          premiumResponse += `\n\n**Recommendations:**\n`;
          intelligenceResponse.nextRecommendations.slice(0, 3).forEach((rec, index) => {
            premiumResponse += `• ${rec}\n`;
          });
        }

        premiumResponse += `\n\n*Analysis completed in ${responseTime}ms with ${intelligenceResponse.primaryInsight.confidence}% confidence*`;

        // Learn from this interaction for future improvements
        if (userId) {
          intelligentContext.learnFromInteraction(userId, {
            type: 'strategy_followed',
            details: { 
              query: message, 
              responseTime, 
              confidence: intelligenceResponse.primaryInsight.confidence 
            },
            outcome: 'neutral',
            timestamp: new Date()
          });
        }

        return premiumResponse;
      }

      // FALLBACK: Use enhanced chat for non-premium users or when premium fails
      console.log("📱 Using Enhanced Chat (fallback mode)");
      return await this.sendEnhancedMessage(message, history);
      
    } catch (error) {
      console.error('❌ Premium chat error, falling back to enhanced chat:', error);
      // Graceful degradation to enhanced chat
      return await this.sendEnhancedMessage(message, history);
    }
  }

  /**
   * Enhanced chat fallback method (original functionality preserved)
   */
  private async sendEnhancedMessage(message: string, history: ChatMessage[]): Promise<string> {
    try {
      console.log("Enhanced chat: Sending message to AI model:", message);
      
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

      // Add user context if available
      const userContext = await this.getUserContext();
      if (userContext) {
        enhancedSystemPrompt += "\n\n## USER CONTEXT:\n" + userContext;
      }

      // Add property context if relevant
      const propertyContext = await this.getRelevantPropertyContext(message, history);
      if (propertyContext) {
        enhancedSystemPrompt += "\n\n## RELEVANT PROPERTIES:\n" + propertyContext;
      }
      
      const formattedHistory = history.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));
      
      console.log('Enhanced chat: Calling chat-ai-enhanced function');
      const { data, error } = await supabase.functions.invoke('chat-ai-enhanced', {
        body: { 
          message, 
          history: formattedHistory,
          systemPrompt: enhancedSystemPrompt,
          context: {
            userId: (await supabase.auth.getSession()).data.session?.user?.id,
            chatType: 'general'
          }
        },
      });

      if (error) {
        console.error('Enhanced chat: Error calling AI API:', error);
        throw new Error('Failed to get response from AI service');
      }

      if (!data || !data.text) {
        console.error('Enhanced chat: Invalid response from AI API:', data);
        throw new Error('Received an invalid response from the AI service');
      }

      return data.text;
    } catch (error) {
      console.error('Enhanced chat: Error in sendMessage:', error);
      throw error;
    }
  }

  // PREMIUM INTELLIGENCE HELPER METHODS

  private async extractLocationFromContext(message: string, history: ChatMessage[]): Promise<string | undefined> {
    // Extract location from current message or recent history
    const allText = [message, ...history.slice(-3).map(h => h.text)].join(' ');
    
    const locationPatterns = [
      /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),\s*([A-Z]{2})\b/, // City, State
      /\b([A-Z][a-z]+)\s*,?\s*([A-Z]{2})\b/, // City State
      /\b(austin|dallas|houston|san antonio|chicago|new york|los angeles|miami|atlanta|denver|seattle|boston|philadelphia|phoenix|detroit|buffalo|rochester|syracuse|albany|orlando|tampa|nashville|charlotte|richmond)\b/gi
    ];
    
    for (const pattern of locationPatterns) {
      const match = allText.match(pattern);
      if (match) {
        return match[0];
      }
    }
    
    return undefined;
  }

  private async extractPropertyDetailsFromContext(message: string, history: ChatMessage[]): Promise<any | undefined> {
    const allText = [message, ...history.slice(-3).map(h => h.text)].join(' ');
    
    const rentMatch = allText.match(/\$[\\d,]+(?:\\.\\d{2})?/);
    const bedroomMatch = allText.match(/(\\d+)\\s*(?:bed|br|bedroom)/i);
    const bathroomMatch = allText.match(/(\\d+(?:\\.\\d)?)\\s*(?:bath|ba|bathroom)/i);
    const addressMatch = allText.match(/\\d+\\s+[A-Za-z\\s]+(?:st|street|ave|avenue|dr|drive|rd|road|blvd|boulevard|way|lane|ln|ct|court|pl|place)\\b/i);
    const sqftMatch = allText.match(/(\\d+)\\s*(?:sq\\.?\\s?ft|sqft|square\\s+feet)/i);
    
    if (rentMatch || bedroomMatch || bathroomMatch || addressMatch || sqftMatch) {
      return {
        rent: rentMatch ? parseInt(rentMatch[0].replace(/[^0-9]/g, '')) : undefined,
        bedrooms: bedroomMatch ? parseInt(bedroomMatch[1]) : undefined,
        bathrooms: bathroomMatch ? parseFloat(bathroomMatch[1]) : undefined,
        address: addressMatch ? addressMatch[0] : undefined,
        sqft: sqftMatch ? parseInt(sqftMatch[1]) : undefined
      };
    }
    
    return undefined;
  }

  private extractNegotiationGoals(message: string): string[] {
    const goals: string[] = [];
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('reduce') || lowerMessage.includes('lower') || lowerMessage.includes('down')) {
      goals.push('rent_reduction');
    }
    if (lowerMessage.includes('lease') || lowerMessage.includes('renew')) {
      goals.push('lease_negotiation');
    }
    if (lowerMessage.includes('deposit') || lowerMessage.includes('fee')) {
      goals.push('fee_reduction');
    }
    if (lowerMessage.includes('amenities') || lowerMessage.includes('included')) {
      goals.push('amenity_inclusion');
    }
    
    return goals;
  }

  // PRIVATE ENHANCEMENT METHODS (original functionality)

  private async getUserContext(): Promise<string | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return null;

      const cacheKey = `user-context-${session.user.id}`;
      
      // Check cache first (valid for 5 minutes) - DISABLED FOR DEBUGGING
      if (this.cacheEnabled && this.contextCache.has(cacheKey)) {
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
      
      // Cache the result - DISABLED FOR DEBUGGING
      if (this.cacheEnabled) {
        this.contextCache.set(cacheKey, {
          context: contextString,
          timestamp: Date.now()
        });
      }

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