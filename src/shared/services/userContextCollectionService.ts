import { supabase } from '@/integrations/supabase/client';

/**
 * Service to collect and persist user context for better negotiations
 */
export class UserContextCollectionService {
  
  /**
   * Check if we need additional context from the user
   */
  needsAdditionalContext(extractedContext: any): {
    needed: boolean;
    missingFields: string[];
    promptQuestions: string[];
  } {
    const missingFields: string[] = [];
    const promptQuestions: string[] = [];
    
    // Check for current rent
    if (!extractedContext.currentRent) {
      missingFields.push('currentRent');
      promptQuestions.push('What is your current monthly rent amount?');
    }
    
    // Check for location if not provided
    if (!extractedContext.location) {
      missingFields.push('location');
      promptQuestions.push('What city/area is your rental property in?');
    }
    
    // Check for target rent or reduction amount
    if (!extractedContext.targetRent && !extractedContext.reduction) {
      missingFields.push('targetAmount');
      promptQuestions.push('How much would you like to reduce your rent by, or what target rent amount are you hoping for?');
    }
    
    return {
      needed: missingFields.length > 0,
      missingFields,
      promptQuestions
    };
  }
  
  /**
   * Generate a follow-up message to collect missing context
   */
  generateContextCollectionMessage(missingFields: string[], promptQuestions: string[]): string {
    const intro = "I'd be happy to help you negotiate your rent! To give you the most personalized strategy, I need a few details:";
    
    const questions = promptQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n');
    
    const outro = "\nOnce I have this information, I can create a detailed negotiation roadmap with real market data and personalized strategies for your specific situation.";
    
    return `${intro}\n\n${questions}${outro}`;
  }
  
  /**
   * Save user context to persistent storage for future use
   */
  async saveUserContext(userId: string, context: {
    currentRent?: number;
    targetRent?: number;
    location?: string;
    propertyType?: string;
    squareFootage?: number;
    landlordType?: string;
    tenantHistory?: string;
    budgetFlexibility?: string;
  }): Promise<void> {
    try {
      // Check if we already have context for this user and location
      const { data: existing } = await supabase
        .from('user_market_signals')
        .select('*')
        .eq('user_id', userId)
        .eq('location', context.location || 'unknown')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (existing && existing.length > 0) {
        // Update existing record
        await supabase
          .from('user_market_signals')
          .update({
            reported_rent: context.currentRent,
            property_type: context.propertyType || 'apartment',
            square_footage: context.squareFootage,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing[0].id);
        
        console.log('✅ Updated existing user context');
      } else {
        // Create new record
        await supabase
          .from('user_market_signals')
          .insert({
            user_id: userId,
            location: context.location || 'unknown',
            reported_rent: context.currentRent,
            property_type: context.propertyType || 'apartment',
            square_footage: context.squareFootage,
            reported_at: new Date().toISOString()
          });
        
        console.log('✅ Saved new user context');
      }
    } catch (error) {
      console.error('❌ Failed to save user context:', error);
      // Don't throw - this shouldn't break the flow
    }
  }
  
  /**
   * Retrieve saved context for a user
   */
  async getUserContext(userId: string, location?: string): Promise<{
    currentRent?: number;
    location?: string;
    propertyType?: string;
    squareFootage?: number;
    landlordFlexibilityScore?: number;
    previousNegotiations?: any[];
  } | null> {
    try {
      let query = supabase
        .from('user_market_signals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (location) {
        query = query.ilike('location', `%${location}%`);
      }
      
      const { data } = await query.limit(1);
      
      if (data && data.length > 0) {
        const record = data[0];
        return {
          currentRent: record.reported_rent,
          location: record.location,
          propertyType: record.property_type,
          squareFootage: record.square_footage,
          landlordFlexibilityScore: record.landlord_flexibility_score,
          previousNegotiations: [] // TODO: Add negotiation history
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Failed to retrieve user context:', error);
      return null;
    }
  }
  
  /**
   * Record negotiation outcome for future insights
   */
  async recordNegotiationOutcome(userId: string, outcome: {
    location: string;
    originalRent: number;
    finalRent?: number;
    successful: boolean;
    strategy: string;
    landlordType?: string;
    timeToResolution?: number;
  }): Promise<void> {
    try {
      // Find the user's context record
      const { data: existing } = await supabase
        .from('user_market_signals')
        .select('*')
        .eq('user_id', userId)
        .eq('location', outcome.location)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (existing && existing.length > 0) {
        // Update with negotiation outcome
        await supabase
          .from('user_market_signals')
          .update({
            negotiation_attempted: true,
            negotiation_successful: outcome.successful,
            original_asking_rent: outcome.originalRent,
            final_agreed_rent: outcome.finalRent,
            savings_achieved: outcome.finalRent ? outcome.originalRent - outcome.finalRent : 0,
            negotiation_strategy: outcome.strategy,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing[0].id);
        
        console.log('✅ Recorded negotiation outcome');
      } else {
        console.warn('⚠️ No existing context found to update with negotiation outcome');
      }
    } catch (error) {
      console.error('❌ Failed to record negotiation outcome:', error);
    }
  }
  
  /**
   * Enhanced context extraction that uses saved data
   */
  async enhanceContextWithUserData(extractedContext: any, userId?: string): Promise<any> {
    if (!userId) return extractedContext;
    
    try {
      const savedContext = await this.getUserContext(userId, extractedContext.location);
      
      if (savedContext) {
        console.log('📊 Found saved user context, enhancing...');
        
        return {
          ...extractedContext,
          // Use saved values as fallbacks
          currentRent: extractedContext.currentRent || savedContext.currentRent,
          location: extractedContext.location || savedContext.location,
          propertyType: savedContext.propertyType,
          squareFootage: savedContext.squareFootage,
          landlordFlexibilityScore: savedContext.landlordFlexibilityScore,
          // Add user-specific context
          hasNegotiationHistory: savedContext.previousNegotiations && savedContext.previousNegotiations.length > 0
        };
      }
      
      return extractedContext;
    } catch (error) {
      console.error('❌ Failed to enhance context with user data:', error);
      return extractedContext;
    }
  }
}

export const userContextCollection = new UserContextCollectionService();