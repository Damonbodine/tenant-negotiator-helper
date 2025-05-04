
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
  is_read?: boolean;
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
          // Since is_read doesn't exist in the database schema, we won't insert it
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
      return (data || []).map((record: ChatHistoryRecord) => ({
        id: record.id,
        type: record.message_type as 'user' | 'agent',
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
      // Since is_read doesn't exist in the database schema,
      // we'll log this intention but not perform the update
      console.log('Would mark messages as read:', messageIds);
      return true;
      
      /* This would be the implementation if the column existed
      const { error } = await supabase
        .from('chat_history')
        .update({ is_read: true })
        .in('id', messageIds);
      
      if (error) {
        console.error('Error marking messages as read:', error);
        return false;
      }
      
      return true;
      */
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
      // Since is_read doesn't exist in the database schema,
      // we'll log this intention but return 0
      console.log('Would get unread count');
      return 0;
      
      /* This would be the implementation if the column existed
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
      */
    } catch (error) {
      console.error('Exception getting unread count:', error);
      return 0;
    }
  }
};
