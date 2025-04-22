
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
      
      console.log('Calling chat-ai function with OpenAI GPT-4.1');
      // Call the OpenAI API through our edge function
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: { 
          message, 
          history,
          systemPrompt: enhancedSystemPrompt
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
