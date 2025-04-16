
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
      console.log("Sending message to Gemini:", message);
      console.log("With history:", history);
      
      const templates = promptService.getPromptTemplates();
      const activeTemplate = templates.find(t => t.id === activePromptTemplateId) || templates[0];
      
      const activatedSubPrompts = activeTemplate.subPrompts?.filter(
        sp => message.toLowerCase().includes(sp.trigger.toLowerCase())
      ) || [];
      
      let enhancedSystemPrompt = activeTemplate.systemPrompt;
      if (activatedSubPrompts.length > 0) {
        enhancedSystemPrompt += "\n\nAdditional context: " + 
          activatedSubPrompts.map(sp => sp.content).join("\n\n");
      }
      
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: { 
          message, 
          history,
          systemPrompt: enhancedSystemPrompt
        },
      });

      if (error) {
        console.error('Error calling Gemini API:', error);
        throw new Error('Failed to get response from AI service');
      }

      console.log("Response from Gemini:", data);
      
      if (!data || !data.text) {
        console.error('Invalid response from Gemini API:', data);
        throw new Error('Received an invalid response from the AI service');
      }

      return data.text;
    } catch (error) {
      console.error('Error in sendMessageToGemini:', error);
      throw error;
    }
  }
};
