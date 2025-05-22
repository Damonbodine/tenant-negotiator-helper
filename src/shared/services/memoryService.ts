
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/shared/types';

interface ChatMemory {
  id?: string;
  user_id: string;
  timestamp?: Date;
  summary: string;
  raw_chat_log: string;
  feature_type: string;
  is_active?: boolean;
}

/**
 * Saves the chat history and generates a summary for memory
 */
export async function saveChatMemory(
  userId: string,
  messages: ChatMessage[],
  featureType: string = 'market'
): Promise<boolean> {
  try {
    if (!userId || messages.length === 0) {
      console.error('Cannot save chat memory: missing userId or messages');
      return false;
    }

    // Format the raw chat log
    const rawChatLog = messages
      .map(msg => `${msg.type}: ${msg.text}`)
      .join('\n\n');
    
    // Generate a summary using the AI service
    const summary = await generateChatSummary(rawChatLog);
    
    // Store in Supabase
    const { error } = await supabase.from('chat_memories').insert({
      user_id: userId,
      summary,
      raw_chat_log: rawChatLog,
      feature_type: featureType,
      is_active: true,
    });

    if (error) {
      console.error('Error saving chat memory:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in saveChatMemory:', error);
    return false;
  }
}

/**
 * Retrieves the most recent memories for a user
 */
export async function getRecentMemories(
  userId: string,
  featureType: string = 'market', 
  limit: number = 3
): Promise<string[]> {
  try {
    if (!userId) {
      console.error('Cannot get recent memories: missing userId');
      return [];
    }

    const { data, error } = await supabase
      .from('chat_memories')
      .select('summary')
      .eq('user_id', userId)
      .eq('feature_type', featureType)
      .eq('is_active', true)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error retrieving chat memories:', error);
      return [];
    }

    return data.map(item => item.summary);
  } catch (error) {
    console.error('Error in getRecentMemories:', error);
    return [];
  }
}

/**
 * Deletes all memories for a user
 */
export async function deleteUserMemories(userId: string): Promise<boolean> {
  try {
    if (!userId) {
      console.error('Cannot delete memories: missing userId');
      return false;
    }

    // Instead of physically deleting, we mark them as inactive
    const { error } = await supabase
      .from('chat_memories')
      .update({ is_active: false })
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting chat memories:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteUserMemories:', error);
    return false;
  }
}

/**
 * Uses the AI to generate a concise summary of the chat
 */
async function generateChatSummary(rawChatLog: string): Promise<string> {
  try {
    // Call the AI service to generate a summary
    const { data, error } = await supabase.functions.invoke('chat-ai', {
      body: { 
        message: "Please create a concise summary (max 300 tokens) of this conversation that captures key insights and user intentions. Focus on information that would be helpful for future conversations.", 
        history: [{ role: 'user', content: rawChatLog }],
        systemPrompt: "You are a summarization assistant. Create very concise summaries (max 300 tokens) that capture key insights and user intentions from conversations. These summaries will be used as context for future conversations." 
      }
    });

    if (error) {
      console.error('Error generating chat summary:', error);
      return "Conversation about property pricing and market insights.";
    }

    return data.text || "Conversation about property pricing and market insights.";
  } catch (error) {
    console.error('Error in generateChatSummary:', error);
    return "Conversation about property pricing and market insights.";
  }
}

/**
 * Formats previous memories into a context string for the LLM
 */
export function formatMemoriesForContext(memories: string[]): string {
  if (memories.length === 0) return '';

  return `
## Previous Conversation Context
The user has interacted with you before. Here are summaries of your past conversations to help you provide more relevant and personalized responses:

${memories.map((memory, index) => `Memory ${index + 1}: ${memory}`).join('\n\n')}

Please use this context to provide more personalized responses, but do not explicitly mention these previous conversations unless the user brings them up first.
`;
}
