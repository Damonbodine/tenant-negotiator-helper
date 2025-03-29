
import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  id: string;
  type: 'user' | 'agent';
  text: string;
  timestamp: Date;
}

export const chatService = {
  async sendMessageToGemini(message: string, history: ChatMessage[]): Promise<string> {
    try {
      console.log("Sending message to Gemini:", message);
      console.log("With history:", history);
      
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: { message, history },
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
