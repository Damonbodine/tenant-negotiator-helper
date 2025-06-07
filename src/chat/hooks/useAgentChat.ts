
import { useEffect, useRef } from "react";
import { agentService } from "@/shared/services/agentService";
import { voiceClient } from "@/shared/services/voiceClient";
import { useAgentState } from "@/chat/hooks/useAgentState";
import { useErrorHandling } from "@/shared/hooks/useErrorHandling";
import { useVoiceSettings } from "@/shared/hooks/useVoiceSettings";
import { processUserMessage } from "@/chat/hooks/useMessageProcessing";
import { ChatMessage } from "@/shared/types";

export type ChatType = "market" | "negotiation" | "general";

interface UseAgentChatProps {
  chatType?: ChatType;
}

export function useAgentChat({ chatType = "general" }: UseAgentChatProps) {
  const state = useAgentState();
  const { errorState, resetError, handleError } = useErrorHandling();
  const { audioRef, mediaRecorderRef, audioChunksRef, handleVoiceChange, toggleMute } = useVoiceSettings();
  const initializedRef = useRef(false);

  // FIXED: Prevent infinite loop by using ref to track initialization
  useEffect(() => {
    audioRef.current = new Audio();
    
    // Only initialize once per chatType change
    if (!initializedRef.current || state.messages.length === 0) {
      initializedRef.current = true;
      
      let welcomeMessage = "";
      
      switch (chatType) {
        case "market":
          welcomeMessage = "Hello! I can help you understand rental market trends and pricing. What area are you interested in learning about?";
          break;
        case "negotiation":
          welcomeMessage = "Welcome! I'm your negotiation coach. I can provide tips and strategies to help you secure a better rental deal. What would you like to know?";
          break;
        default:
          welcomeMessage = "Hello! I'm your Rent Negotiator Assistant. How can I help you today?";
      }
      
      const initialMessage: ChatMessage = {
        id: `welcome-${chatType}`,
        type: "agent",
        text: welcomeMessage,
        timestamp: new Date()
      };
      
      state.setMessages([initialMessage]);
      
      const checkApiKey = async () => {
        if (!(await voiceClient.hasApiKey())) {
          state.setShowApiKeyInput(true);
        } else {
          loadVoices();
        }
      };
      
      checkApiKey();
    }
  }, [chatType]); // FIXED: Only depend on chatType, not message length

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
      await processUserMessage(state.lastUserInput, {
        ...state,
        audioRef,
        handleError,
        selectedVoice: state.selectedVoice,
        chatType
      });
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
    await processUserMessage(input, {
      ...state,
      audioRef,
      handleError,
      selectedVoice: state.selectedVoice,
      chatType
    });
  };

  return {
    ...state,
    errorState,
    resetError,
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
