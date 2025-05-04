
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/shared/types';
import { v4 as uuidv4 } from 'uuid';

// Define interface for chat history record
interface ChatHistoryRecord {
  id: string;
  user_id: string;
  message_type: 'user' | 'agent';
  message_text: string;
  created_at: string;
  is_read: boolean | null;
}

// Anonymous user ID for non-authenticated users
const ANONYMOUS_USER_ID = 'anonymous';

export const chatPersistenceService = {
  /**
   * Save a message to the chat_history table
   */
  async saveMessage(message: ChatMessage): Promise<boolean> {
    try {
      // Get current user or use anonymous ID
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || ANONYMOUS_USER_ID;
      
      const { error } = await supabase
        .from('chat_history')
        .insert({
          id: message.id,
          user_id: userId,
          message_type: message.type,
          message_text: message.text,
          is_read: message.isRead
        });
      
      if (error) {
        console.error('Error saving message to chat history:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Exception saving message:', error);
      return false;
    }
  },
  
  /**
   * Load chat history for the current user
   */
  async loadChatHistory(limit: number = 50): Promise<ChatMessage[]> {
    try {
      // Get current user or use anonymous ID
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || ANONYMOUS_USER_ID;
      
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(limit);
      
      if (error) {
        console.error('Error loading chat history:', error);
        return [];
      }
      
      // Convert database records to ChatMessage objects
      // Since we cast the data type explicitly to ensure type safety
      return (data as ChatHistoryRecord[] || []).map((record: ChatHistoryRecord) => ({
        id: record.id,
        type: record.message_type,
        text: record.message_text,
        timestamp: new Date(record.created_at),
        isRead: record.is_read !== false // Default to read if not specified
      }));
    } catch (error) {
      console.error('Exception loading chat history:', error);
      return [];
    }
  },
  
  /**
   * Mark messages as read
   */
  async markMessagesAsRead(messageIds: string[]): Promise<boolean> {
    if (!messageIds.length) return true;
    
    try {
      const { error } = await supabase
        .from('chat_history')
        .update({ is_read: true })
        .in('id', messageIds);
      
      if (error) {
        console.error('Error marking messages as read:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Exception marking messages as read:', error);
      return false;
    }
  },
  
  /**
   * Delete chat history for the current user
   */
  async clearChatHistory(): Promise<boolean> {
    try {
      // Get current user or use anonymous ID
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || ANONYMOUS_USER_ID;
      
      const { error } = await supabase
        .from('chat_history')
        .delete()
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error clearing chat history:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Exception clearing chat history:', error);
      return false;
    }
  },
  
  /**
   * Get unread message count
   */
  async getUnreadCount(): Promise<number> {
    try {
      // Get current user or use anonymous ID
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || ANONYMOUS_USER_ID;
      
      const { data, error } = await supabase
        .from('chat_history')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_read', false);
      
      if (error) {
        console.error('Error getting unread count:', error);
        return 0;
      }
      
      return data?.length || 0;
    } catch (error) {
      console.error('Exception getting unread count:', error);
      return 0;
    }
  }
};
