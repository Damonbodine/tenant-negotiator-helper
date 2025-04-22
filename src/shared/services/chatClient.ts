
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/shared/types';
import { promptService } from '@/shared/services/promptTemplates';

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
      
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: { 
          message, 
          history: formattedHistory,
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

      return data.text;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  }
};
