
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
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: { message, history },
      });

      if (error) {
        console.error('Error calling Gemini API:', error);
        throw new Error('Failed to get response from AI service');
      }

      return data.text || 'Sorry, I couldn\'t generate a response at this time.';
    } catch (error) {
      console.error('Error in sendMessageToGemini:', error);
      throw error;
    }
  }
};
