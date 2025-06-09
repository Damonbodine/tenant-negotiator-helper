import { negotiationRoadmapClient } from './negotiationRoadmapClient';
import { userContextCollection } from './userContextCollectionService';
import { supabase } from '@/integrations/supabase/client';

/**
 * Service to detect when to trigger negotiation roadmap from conversation
 */
export class NegotiationTriggerService {
  
  /**
   * Analyze a user message to determine if it should trigger a negotiation roadmap
   */
  shouldTriggerRoadmap(userMessage: string): boolean {
    const lowerMessage = userMessage.toLowerCase();
    
    // Primary triggers - direct negotiation requests
    const negotiationKeywords = [
      'negotiate rent',
      'negotiation strategy',
      'how to negotiate',
      'help me negotiate',
      'lower my rent',
      'rent reduction',
      'negotiate with landlord',
      'ask for lower rent',
      'reduce rent',
      'rent negotiation',
      'negotiation help',
      'negotiate lease',
      'rental negotiation',
      'negotiate my rent'
    ];
    
    // Check for primary triggers
    const hasPrimaryTrigger = negotiationKeywords.some(keyword => 
      lowerMessage.includes(keyword)
    );
    
    // Enhanced pattern matching: "negotiate" + mention of rent/amount + action
    const hasNegotiatePattern = lowerMessage.includes('negotiate') && 
      (lowerMessage.includes('rent') || /\$\d+/.test(lowerMessage)) &&
      (lowerMessage.includes('down') || lowerMessage.includes('lower') || lowerMessage.includes('reduce'));
    
    // Context-rich rent adjustment patterns - NEW ADDITION
    const hasRentAdjustmentPattern = /\$\d+/.test(lowerMessage) && 
      (lowerMessage.includes('rent') || lowerMessage.includes('current') || lowerMessage.includes('paying')) &&
      (lowerMessage.includes('down to') || lowerMessage.includes('get it down') || 
       lowerMessage.includes('reduce to') || lowerMessage.includes('lower to') ||
       lowerMessage.includes('bring it down') || lowerMessage.includes('decrease to') ||
       lowerMessage.includes('want it at') || lowerMessage.includes('like to get') ||
       lowerMessage.includes('and i\'d like') || lowerMessage.includes('hoping for') ||
       lowerMessage.includes('reduce it to') || lowerMessage.includes('want to reduce'));
    
    // Secondary triggers (need additional context)
    const secondaryKeywords = [
      'too expensive',
      'overpriced',
      'can\'t afford',
      'budget tight',
      'rent too high',
      'above market',
      'similar properties cheaper'
    ];
    
    // Check for secondary triggers with rent context
    const hasSecondaryTrigger = secondaryKeywords.some(keyword => 
      lowerMessage.includes(keyword)
    ) && (
      lowerMessage.includes('rent') || 
      lowerMessage.includes('apartment') || 
      lowerMessage.includes('lease')
    );
    
    console.log('🎯 Trigger analysis:', {
      hasPrimaryTrigger,
      hasNegotiatePattern,
      hasRentAdjustmentPattern,
      hasSecondaryTrigger,
      message: userMessage.substring(0, 50) + '...'
    });
    
    return hasPrimaryTrigger || hasNegotiatePattern || hasRentAdjustmentPattern || hasSecondaryTrigger;
  }
  
  /**
   * Extract context from user message for roadmap generation
   */
  extractNegotiationContext(userMessage: string): {
    currentRent?: number;
    targetRent?: number;
    location?: string;
    landlordType?: string;
    userTone?: string;
  } {
    const context: any = {};
    
    // Extract current rent
    const rentMatches = userMessage.match(/\$?(\d{1,4}(?:,\d{3})*)\s*(?:\/month|per month|rent|monthly)/gi);
    if (rentMatches && rentMatches.length > 0) {
      const rentValue = parseInt(rentMatches[0].replace(/[^\d]/g, ''));
      context.currentRent = rentValue;
    }
    
    // Extract target rent or reduction
    const reductionMatches = userMessage.match(/reduce.*by.*\$?(\d+)|lower.*by.*\$?(\d+)|down by.*\$?(\d+)|\$?(\d+).*less/gi);
    if (reductionMatches && context.currentRent) {
      const reduction = parseInt(reductionMatches[0].replace(/[^\d]/g, ''));
      context.targetRent = context.currentRent - reduction;
      console.log(`🎯 Extracted reduction: $${reduction}, Target rent: $${context.targetRent}`);
    }
    
    // Extract location
    const locationPatterns = [
      /(?:in|at|near)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:,\s*[A-Z]{2})?)/g,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})/g
    ];
    
    for (const pattern of locationPatterns) {
      const matches = userMessage.match(pattern);
      if (matches) {
        context.location = matches[0].replace(/^(?:in|at|near)\s+/i, '');
        break;
      }
    }
    
    // Extract landlord type
    if (userMessage.toLowerCase().includes('property management') || 
        userMessage.toLowerCase().includes('management company')) {
      context.landlordType = 'property-manager';
    } else if (userMessage.toLowerCase().includes('corporate') || 
               userMessage.toLowerCase().includes('big company')) {
      context.landlordType = 'corporate';
    } else if (userMessage.toLowerCase().includes('individual') || 
               userMessage.toLowerCase().includes('owner')) {
      context.landlordType = 'individual';
    }
    
    // Extract tone preferences
    if (userMessage.toLowerCase().includes('polite') || 
        userMessage.toLowerCase().includes('diplomatic')) {
      context.userTone = 'diplomatic';
    } else if (userMessage.toLowerCase().includes('direct') || 
               userMessage.toLowerCase().includes('straightforward')) {
      context.userTone = 'direct';
    } else if (userMessage.toLowerCase().includes('assertive') || 
               userMessage.toLowerCase().includes('firm')) {
      context.userTone = 'assertive';
    }
    
    return context;
  }
  
  /**
   * Trigger roadmap generation if conditions are met
   */
  async processPotentialTrigger(userMessage: string): Promise<{
    triggered: boolean;
    needsMoreInfo?: boolean;
    followUpMessage?: string;
  }> {
    if (!this.shouldTriggerRoadmap(userMessage)) {
      return { triggered: false };
    }
    
    console.log('🎯 Negotiation roadmap trigger detected in message:', userMessage);
    
    try {
      let context = this.extractNegotiationContext(userMessage);
      console.log('📊 Initial extracted context:', context);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Enhance context with saved user data
      if (user) {
        context = await userContextCollection.enhanceContextWithUserData(context, user.id);
        console.log('📊 Enhanced context with user data:', context);
      }
      
      // Check if we need more information
      const contextCheck = userContextCollection.needsAdditionalContext(context);
      
      if (contextCheck.needed) {
        console.log('❓ Missing context fields:', contextCheck.missingFields);
        const followUpMessage = userContextCollection.generateContextCollectionMessage(
          contextCheck.missingFields, 
          contextCheck.promptQuestions
        );
        
        return {
          triggered: false,
          needsMoreInfo: true,
          followUpMessage
        };
      }
      
      // Save the context for future use
      if (user && (context.currentRent || context.location)) {
        await userContextCollection.saveUserContext(user.id, context);
      }
      
      // Generate roadmap with complete context
      await negotiationRoadmapClient.generateBasicRoadmap(context);
      
      console.log('✅ Negotiation roadmap triggered successfully');
      return { triggered: true };
      
    } catch (error) {
      console.error('❌ Failed to trigger negotiation roadmap:', error);
      return { triggered: false };
    }
  }
}

export const negotiationTrigger = new NegotiationTriggerService();