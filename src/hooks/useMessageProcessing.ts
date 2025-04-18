
import { ChatMessage } from "@/utils/types";
import { agentService } from "@/utils/agentService";
import { voiceClient } from "@/utils/voiceClient";
import { ChatType } from "./useAgentChat";

interface UseMessageProcessingProps {
  setMessages: (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  setInput: (input: string) => void;
  setIsLoading: (loading: boolean) => void;
  setShowApiKeyInput: (show: boolean) => void;
  setSuggestions: (suggestions: string[]) => void;
  audioRef: React.RefObject<HTMLAudioElement>;
  handleError: (error: any) => void;
  selectedVoice: string;
  chatType?: ChatType;
}

export async function processUserMessage(messageText: string, {
  setMessages,
  setInput,
  setIsLoading,
  setShowApiKeyInput,
  setSuggestions,
  audioRef,
  handleError,
  selectedVoice,
  chatType = "general"
}: UseMessageProcessingProps) {
  if (!messageText.trim() || setIsLoading) return;
  
  const userMessage: ChatMessage = {
    id: Date.now().toString(),
    type: "user",
    text: messageText,
    timestamp: new Date()
  };
  
  setMessages((prev: ChatMessage[]) => [...prev, userMessage]);
  setInput("");
  setIsLoading(true);
  setSuggestions([]);
  
  try {
    if (!(await voiceClient.hasApiKey())) {
      setShowApiKeyInput(true);
      setIsLoading(false);
      return;
    }
    
    let response;
    
    switch(chatType) {
      case "market":
        response = await agentService.getMarketInsights(messageText);
        break;
      case "negotiation":
        response = await agentService.getNegotiationAdvice(messageText);
        break;
      default:
        response = await agentService.simulateResponse(messageText);
    }
    
    const agentMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "agent",
      text: response.text,
      timestamp: new Date()
    };
    
    setMessages((prev: ChatMessage[]) => [...prev, agentMessage]);
    
    if (response.suggestions) {
      setSuggestions(response.suggestions);
    }
    
    try {
      agentService.setVoice(selectedVoice);
      const audioBuffer = await agentService.generateSpeech(response.text);
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
      }
    } catch (error) {
      console.error("Error generating speech:", error);
      throw new Error("Could not generate speech. Check your API key and try again.");
    }
  } catch (error: any) {
    handleError(error);
  } finally {
    setIsLoading(false);
  }
}
