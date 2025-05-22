
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/shared/types';
import { getRecentMemories, saveChatMemory, deleteUserMemories, formatMemoriesForContext } from '@/shared/services/memoryService';
import { toast } from '@/shared/hooks/use-toast';

export function useMemory(featureType = 'market') {
  const [userId, setUserId] = useState<string | null>(null);
  const [memories, setMemories] = useState<string[]>([]);
  const [memoryEnabled, setMemoryEnabled] = useState<boolean>(true);
  const [isLoadingMemories, setIsLoadingMemories] = useState<boolean>(false);

  // Get the current user and their memories
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        loadMemories(session.user.id);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUserId(session.user.id);
          // Use setTimeout to avoid potential deadlocks
          setTimeout(() => loadMemories(session.user.id), 0);
        } else if (event === 'SIGNED_OUT') {
          setUserId(null);
          setMemories([]);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [featureType]);

  // Load memories for the current user
  const loadMemories = async (uid: string) => {
    if (!uid) return;

    setIsLoadingMemories(true);
    try {
      const recentMemories = await getRecentMemories(uid, featureType);
      setMemories(recentMemories);
    } catch (error) {
      console.error('Error loading memories:', error);
    } finally {
      setIsLoadingMemories(false);
    }
  };

  // Save current chat as a memory
  const saveMemory = async (messages: ChatMessage[]) => {
    if (!userId || !memoryEnabled || messages.length === 0) return;

    try {
      // Only save if we have at least one user message and one agent message
      const hasUserMessage = messages.some(m => m.type === 'user');
      const hasAgentMessage = messages.some(m => m.type === 'agent');
      
      if (!hasUserMessage || !hasAgentMessage) {
        console.log('Not saving memory: conversation is too short');
        return;
      }
      
      const success = await saveChatMemory(userId, messages, featureType);
      if (success) {
        console.log('Chat memory saved successfully');
        // Reload memories to include the new one
        loadMemories(userId);
      }
    } catch (error) {
      console.error('Error saving chat memory:', error);
    }
  };

  // Opt out of memory
  const optOutOfMemory = async () => {
    if (!userId) return;

    try {
      const success = await deleteUserMemories(userId);
      if (success) {
        setMemories([]);
        setMemoryEnabled(false);
        toast({
          title: "Memory cleared",
          description: "Your conversation history has been deleted",
        });
      }
    } catch (error) {
      console.error('Error opting out of memory:', error);
      toast({
        title: "Error",
        description: "Failed to clear conversation history",
        variant: "destructive",
      });
    }
  };

  // Format memories for the LLM context
  const getMemoryContext = () => {
    return formatMemoriesForContext(memories);
  };

  return {
    memories,
    memoryEnabled,
    isLoadingMemories,
    hasMemories: memories.length > 0,
    saveMemory,
    optOutOfMemory,
    getMemoryContext
  };
}
