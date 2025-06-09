import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from './types';
import { promptService } from './promptTemplates';

let activePromptTemplateId = 'rental-agent';

export const chatClient = {
  setActivePromptTemplate(templateId: string): void {
    activePromptTemplateId = templateId;
  },

  getActivePromptTemplateId(): string {
    return activePromptTemplateId;
  },

  async sendMessageToGemini(message: string, history: ChatMessage[]): Promise<string> {
    try {
      console.log("🚨 WRONG CLIENT: Using OLD utils/chatClient.ts - should be shared/services/chatClient.ts!");
      console.log("Sending message to AI model:", message);
      console.log("With history:", history);
      
      const templates = promptService.getPromptTemplates();
      const activeTemplate = templates.find(t => t.id === activePromptTemplateId) || templates[0];
      
      // Check if any subPrompts are triggered by the current message
      const activatedSubPrompts = activeTemplate.subPrompts?.filter(
        sp => message.toLowerCase().includes(sp.trigger.toLowerCase())
      ) || [];
      
      // Build the enhanced system prompt with any triggered sub-prompts
      let enhancedSystemPrompt = activeTemplate.systemPrompt;
      if (activatedSubPrompts.length > 0) {
        enhancedSystemPrompt += "\n\n## ACTIVATED CONTEXT MODULES:\n" + 
          activatedSubPrompts.map(sp => sp.content).join("\n\n");
      }

      // Get current user for memory context
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      
      console.log('Calling chat-ai-enhanced function with rental memory');
      
      // Convert history to expected format
      const formattedHistory = history.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));

      // Call the enhanced AI function through our edge function
      const { data, error } = await supabase.functions.invoke('chat-ai-enhanced', {
        body: { 
          message, 
          history: formattedHistory,
          systemPrompt: enhancedSystemPrompt,
          context: {
            userId: userId,
            chatType: 'general_advice',
            propertyContext: null
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
