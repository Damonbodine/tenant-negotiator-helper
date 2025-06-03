import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/shared/types';
import { promptService } from '@/shared/services/promptTemplates';

let activePromptTemplateId = 'default';

export const chatClient = {
  setActivePromptTemplate(templateId: string): void {
    activePromptTemplateId = templateId;
  },

  getActivePromptTemplateId(): string {
    return activePromptTemplateId;
  },

  async sendMessageToGemini(message: string, history: ChatMessage[]): Promise<string> {
    try {
      console.log("Sending message to AI model:", message);
      console.log("With history:", history);
      
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
      
      console.log(`Calling chat-ai-enhanced function with rental memory (Type: ${chatType})`);
      
      // Use enhanced chat function with memory capabilities
      const { data, error } = await supabase.functions.invoke('chat-ai-enhanced', {
        body: { 
          message, 
          history: formattedHistory,
          systemPrompt: enhancedSystemPrompt,
          context: {
            userId: userId,
            chatType: chatType,
            propertyContext: propertyContext
          }
        },
      });

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
      } else {
        console.warn('No model information returned from AI service');
      }

      return data.text;
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
