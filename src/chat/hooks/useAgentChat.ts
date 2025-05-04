
import { useEffect, useState } from "react";
import { agentService } from "@/shared/services/agentService";
import { voiceClient } from "@/shared/services/voiceClient";
import { useAgentState } from "@/chat/hooks/useAgentState";
import { useErrorHandling } from "@/shared/hooks/useErrorHandling";
import { useVoiceSettings } from "@/shared/hooks/useVoiceSettings";
import { processUserMessage } from "@/chat/hooks/useMessageProcessing";
import { ChatMessage } from "@/shared/types";
import { chatPersistenceService } from "@/shared/services/chatPersistenceService";

export type ChatType = "market" | "negotiation" | "general";

interface UseAgentChatProps {
  chatType?: ChatType;
}

export function useAgentChat({ chatType = "general" }: UseAgentChatProps) {
  const state = useAgentState();
  const { errorState, resetError, handleError } = useErrorHandling();
  const { audioRef, mediaRecorderRef, audioChunksRef, handleVoiceChange, toggleMute } = useVoiceSettings();
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Load chat history from Supabase
  useEffect(() => {
    const loadChatHistory = async () => {
      if (state.messages.length === 0) {
        setIsLoadingHistory(true);
        try {
          const history = await chatPersistenceService.loadChatHistory();
          
          // If there's history, use it; otherwise use the welcome message
          if (history.length > 0) {
            state.setMessages(history);
            
            // Mark agent messages as read
            const agentMessageIds = history
              .filter(msg => msg.type === 'agent' && msg.isRead === false)
              .map(msg => msg.id);
            
            if (agentMessageIds.length > 0) {
              chatPersistenceService.markMessagesAsRead(agentMessageIds);
            }
          } else {
            // Create welcome message based on chat type
            let welcomeMessage = "";
            
            switch (chatType) {
              case "market":
                welcomeMessage = "Hello! I can help you understand rental market trends and pricing. What area are you interested in learning about?";
                break;
              case "negotiation":
                welcomeMessage = "Welcome! I'm your negotiation coach. I can provide tips and strategies to help you secure a better rental deal. What would you like to know?";
                break;
              default:
                welcomeMessage = "Hello! I'm your Renters Mentor Assistant. How can I help you today?";
            }
            
            const initialMessage: ChatMessage = {
              id: "welcome",
              type: "agent",
              text: welcomeMessage,
              timestamp: new Date(),
              isRead: true
            };
            
            state.setMessages([initialMessage]);
            // Save welcome message to history
            chatPersistenceService.saveMessage(initialMessage);
          }
        } catch (error) {
          console.error("Error loading chat history:", error);
        } finally {
          setIsLoadingHistory(false);
        }
      }
    };

    loadChatHistory();
    
    // Check API key after loading history
    const checkApiKey = async () => {
      if (!(await voiceClient.hasApiKey())) {
        state.setShowApiKeyInput(true);
      } else {
        loadVoices();
      }
    };
    
    checkApiKey();
  }, [chatType]);

  const loadVoices = async () => {
    try {
      const voices = await agentService.getVoices();
      state.setAvailableVoices(voices);
    } catch (error) {
      console.error("Error loading voices:", error);
    }
  };

  const retryLastMessage = async () => {
    if (state.lastUserInput) {
      resetError();
      setIsTyping(true);
      await processUserMessage(state.lastUserInput, {
        ...state,
        audioRef,
        handleError,
        selectedVoice: state.selectedVoice,
        chatType,
        setIsTyping
      });
      setIsTyping(false);
    } else {
      state.toast({
        title: "Nothing to retry",
        description: "There is no previous message to retry",
        variant: "destructive",
      });
    }
  };

  const handleSend = async () => {
    const input = state.input;
    state.setLastUserInput(input);
    setIsTyping(true);
    await processUserMessage(input, {
      ...state,
      audioRef,
      handleError,
      selectedVoice: state.selectedVoice,
      chatType,
      setIsTyping
    });
    setIsTyping(false);
  };

  return {
    ...state,
    errorState,
    resetError,
    isTyping,
    isLoadingHistory,
    handleSend,
    retryLastMessage,
    toggleMute: () => toggleMute(state.isMuted, state.setIsMuted),
    handleVoiceChange: (voiceId: string) => {
      state.setSelectedVoice(voiceId);
      handleVoiceChange(voiceId);
    },
    audioRef
  };
}
