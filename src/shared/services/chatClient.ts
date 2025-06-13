import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/shared/types';
import { promptService } from '@/shared/services/promptTemplates';
import { apiRateLimiter } from '@/shared/services/apiRateLimiter';

let activePromptTemplateId = 'default';

export const chatClient = {
  setActivePromptTemplate(templateId: string): void {
    activePromptTemplateId = templateId;
  },

  getActivePromptTemplateId(): string {
    return activePromptTemplateId;
  },

  async sendMessageToGemini(message: string, history: ChatMessage[], conversationId?: string): Promise<{ text: string, conversationId?: string }> {
    try {
      // 🛡️ RATE LIMITING: Check if call is allowed to prevent excessive charges
      if (!apiRateLimiter.canMakeCall('chat-ai-enhanced')) {
        const stats = apiRateLimiter.getUsageStats();
        const waitTime = stats.nextAllowedCall ? Math.ceil(stats.nextAllowedCall / 1000) : 'unknown';
        throw new Error(`Rate limited: Too many API calls. Please wait ${waitTime} seconds. Calls in last minute: ${stats.callsLastMinute}`);
      }

      // 🚀 PERFORMANCE TRACKING: Monitor client-side timing
      const clientStart = Date.now();
      console.log("🚀 USING ENHANCED CHAT CLIENT WITH AUTH DETECTION");
      console.log("🚀 CLIENT PERFORMANCE: Starting request at", new Date().toISOString());
      console.log("Sending message to AI model:", message);
      console.log("With history:", history);
      
      // Record the API call
      apiRateLimiter.recordCall('chat-ai-enhanced');
      
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
      
      const formattedHistory = history.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));

      // Get current user for memory context
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      // Intelligently detect chat type from message content
      const chatType = detectChatType(message, history);
      
      // Try to extract property context from the message and history
      const propertyContext = extractPropertyContext(message, history);
      
      // 🚀 PERFORMANCE: Track API call timing
      const apiCallStart = Date.now();
      console.log("🚀 API CALL: Starting edge function call...");
      
      let data, error;
      
      // Use enhanced chat for authenticated users, basic chat for unauthenticated
      if (userId) {
        console.log(`Calling chat-ai-enhanced function with rental memory (Type: ${chatType})`);
        
        const response = await supabase.functions.invoke('chat-ai-enhanced', {
          body: { 
            message, 
            history: formattedHistory,
            systemPrompt: enhancedSystemPrompt,
            context: {
              userId: userId,
              chatType: chatType,
              propertyContext: propertyContext,
              conversationId: conversationId
            }
          },
        });
        data = response.data;
        error = response.error;
      } else {
        console.log('Calling basic chat-ai function (unauthenticated user)');
        
        const response = await supabase.functions.invoke('chat-ai', {
          body: { 
            message, 
            history: formattedHistory,
            systemPrompt: enhancedSystemPrompt
          },
        });
        data = response.data;
        error = response.error;
      }

      const apiCallTime = Date.now() - apiCallStart;
      console.log(`🚀 API CALL COMPLETE: ${apiCallTime}ms`);
      console.log(`🎯 API Performance: ${apiCallTime < 2000 ? '✅ EXCELLENT' : apiCallTime < 5000 ? '⚠️ GOOD' : '❌ SLOW'}`);

      if (error) {
        console.error('Error calling AI API:', error);
        throw new Error('Failed to get response from AI service');
      }

      console.log("Response from AI model:", data);
      
      if (!data || !data.text) {
        console.error('Invalid response from AI API:', data);
        throw new Error('Received an invalid response from the AI service');
      }

      // Log model information for verification
      if (data.model) {
        console.log(`Model used for this response: ${data.model}`);
        console.log(`Memory storage: ${data.storedInMemory ? 'YES' : 'NO'}`);
        console.log(`Memory context: ${data.hasMemory ? 'YES' : 'NO'}`);
        console.log(`Chat type detected: ${chatType}`);
        console.log(`Property context: ${propertyContext ? 'YES' : 'NO'}`);
        
        // 🚀 PREMIUM INTELLIGENCE STATUS
        if (data.premiumIntelligence) {
          console.log(`🚀 PREMIUM INTELLIGENCE: ${data.premiumIntelligence.enabled ? 'ENABLED' : 'DISABLED'}`);
          console.log(`🚀 Server Response Time: ${data.premiumIntelligence.responseTime}ms`);
          console.log(`🚀 Performance Grade: ${data.premiumIntelligence.performanceGrade.toUpperCase()}`);
          console.log(`🚀 Parallel Operations: ${data.premiumIntelligence.parallelOperations}`);
        } else {
          console.warn('⚠️ Premium Intelligence not detected in response - using legacy system');
        }
      } else {
        console.warn('No model information returned from AI service');
      }

      const totalClientTime = Date.now() - clientStart;
      console.log(`🚀 TOTAL CLIENT TIME: ${totalClientTime}ms (includes network + processing)`);
      console.log(`🎯 Overall Performance: ${totalClientTime < 3000 ? '✅ EXCELLENT' : totalClientTime < 8000 ? '⚠️ GOOD' : '❌ SLOW'}`);

      return { 
        text: data.text, 
        conversationId: data.conversationId 
      };
    } catch (error) {
      console.error('Error in sendMessageToGemini:', error);
      throw error;
    }
  }
};

// Helper function to detect chat type from message content
function detectChatType(message: string, history: ChatMessage[]): string {
  const lowerMessage = message.toLowerCase();
  const conversationText = [message, ...history.map(h => h.text)].join(' ').toLowerCase();
  
  // Negotiation keywords
  if (lowerMessage.includes('negotiate') || lowerMessage.includes('negotiation') ||
      lowerMessage.includes('reduce rent') || lowerMessage.includes('lower rent') ||
      lowerMessage.includes('rent reduction') || lowerMessage.includes('bargain') ||
      conversationText.includes('negotiate')) {
    return 'negotiation_help';
  }
  
  // Market analysis keywords
  if (lowerMessage.includes('market') || lowerMessage.includes('price') ||
      lowerMessage.includes('average rent') || lowerMessage.includes('comparable') ||
      lowerMessage.includes('pricing') || lowerMessage.includes('market data')) {
    return 'market_analysis';
  }
  
  // Lease review keywords
  if (lowerMessage.includes('lease') || lowerMessage.includes('contract') ||
      lowerMessage.includes('terms') || lowerMessage.includes('clause')) {
    return 'lease_review';
  }
  
  // Default to general advice
  return 'general_advice';
}

// Helper function to extract property context from message and history
function extractPropertyContext(message: string, history: ChatMessage[]): any {
  const fullText = [message, ...history.map(h => h.text)].join(' ');
  const context: any = {};
  
  // Extract rent amounts (both current and target)
  const rentMatches = fullText.match(/\$?(\d{1,2}),?(\d{3})/g);
  if (rentMatches && rentMatches.length >= 1) {
    // Remove $ and commas, convert to cents
    const amounts = rentMatches.map(match => parseInt(match.replace(/[$,]/g, '')) * 100);
    context.rent = Math.max(...amounts); // Assume highest is current rent
    if (amounts.length > 1) {
      context.targetRent = Math.min(...amounts); // Assume lowest is target
    }
  }
  
  // Extract bedroom count
  const bedroomMatch = fullText.match(/(\d+)\s*(?:br|bedroom|bed)/i);
  if (bedroomMatch) {
    context.bedrooms = parseInt(bedroomMatch[1]);
  }
  
  // Extract address/location with multiple patterns
  const locationPatterns = [
    /(?:at|on|in)\s+([^\,\.\?\!]+(?:st|street|ave|avenue|rd|road|blvd|boulevard|way|ln|lane))/i,
    /(\d+\s+[^,\.\?\!]+(?:st|street|ave|avenue|rd|road|blvd|boulevard|way|ln|lane))/i,
    /(?:in|at)\s+(san francisco|sf|oakland|berkeley|[a-z\s]+)/i
  ];
  
  for (const pattern of locationPatterns) {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      context.address = match[1].trim();
      break;
    }
  }
  
  // Only return context if we found something meaningful
  return Object.keys(context).length > 0 ? context : null;
}

/**
 * Affordability Trigger Detection
 * 
 * Analyzes conversation content to automatically trigger the affordability calculator
 * when users discuss budget, income, or rent affordability topics.
 * 
 * Trigger Categories:
 * - Budget keywords: "afford", "budget", "expensive", "cost"
 * - Income references: "income", "salary", "make", "earn" 
 * - Financial ratios: "30%", "debt-to-income"
 * - Financial stress: "tight budget", "struggling", "can't afford"
 */
export function detectAffordabilityTrigger(message: string, history: ChatMessage[]): boolean {
  const fullText = [message, ...history.map(h => h.text)].join(' ').toLowerCase();
  
  const AFFORDABILITY_TRIGGERS = [
    // Budget and affordability keywords
    /\bafford\b|\bbudget\b|\bexpensive\b|\bcost\b|\btoo much\b|\boverpriced\b/i,
    // Income and salary keywords  
    /\bincome\b|\bsalary\b|\bmake\b|\bearn\b|\bpaycheck\b|\bfinancial situation\b/i,
    // 30% rule and debt-to-income keywords
    /30%|thirty percent|debt.to.income|housing costs|rent burden/i,
    // Financial stress keywords
    /tight budget|money problems|struggling|broke|can't afford|financial strain/i,
    // Specific affordability phrases
    /what can i afford|is this affordable|within my budget|can i afford/i
  ];
  
  return AFFORDABILITY_TRIGGERS.some(pattern => pattern.test(fullText));
}

// Helper function to extract financial data for affordability calculator
export function extractFinancialData(message: string, history: ChatMessage[]): { income?: number; rent?: number } {
  const fullText = [message, ...history.map(h => h.text)].join(' ');
  const result: { income?: number; rent?: number } = {};
  
  // Extract income amounts (look for income/salary mentions)
  const incomePatterns = [
    /(?:income|salary|make|earn)\s*(?:is|of)?\s*\$?(\d{1,3}),?(\d{3})/gi,
    /\$?(\d{1,3}),?(\d{3})\s*(?:income|salary|per year|annually)/gi,
    /(\d{1,3})k?\s*(?:income|salary|per year|annually)/gi
  ];
  
  for (const pattern of incomePatterns) {
    const matches = [...fullText.matchAll(pattern)];
    if (matches.length > 0) {
      const match = matches[0];
      if (match[2]) {
        // Format: $50,000 or 50,000
        result.income = parseInt(match[1] + match[2]);
      } else if (match[1]) {
        // Format: 50k or 50
        const num = parseInt(match[1]);
        result.income = num > 1000 ? num : num * 1000; // Assume 50k if < 1000
      }
      break;
    }
  }
  
  // Extract rent amounts
  const rentPatterns = [
    /(?:rent|paying)\s*(?:is)?\s*\$?(\d{1,2}),?(\d{3})/gi,
    /\$?(\d{1,2}),?(\d{3})\s*(?:rent|per month|monthly)/gi
  ];
  
  for (const pattern of rentPatterns) {
    const matches = [...fullText.matchAll(pattern)];
    if (matches.length > 0) {
      const match = matches[0];
      if (match[2]) {
        result.rent = parseInt(match[1] + match[2]);
      }
      break;
    }
  }
  
  return result;
}
