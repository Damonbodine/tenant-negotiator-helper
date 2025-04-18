
import { useState, useRef, useEffect } from "react";
import { useToast } from "./use-toast";
import { agentService } from "@/utils/agentService";
import { voiceClient } from "@/utils/voiceClient";
import { knowledgeBaseService } from "@/utils/knowledgeBase";
import { ChatMessage } from "@/utils/types";

export type ChatType = "market" | "negotiation" | "general";

interface UseAgentChatProps {
  chatType?: ChatType;
}

interface ErrorState {
  message: string;
  details?: string;
}

export function useAgentChat({ chatType = "general" }: UseAgentChatProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("21m00Tcm4TlvDq8ikWAM");
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [errorState, setErrorState] = useState<ErrorState | null>(null);
  const [lastUserInput, setLastUserInput] = useState<string>("");
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    audioRef.current = new Audio();
    
    if (messages.length === 0) {
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
        id: "welcome",
        type: "agent",
        text: welcomeMessage,
        timestamp: new Date()
      };
      
      setMessages([initialMessage]);
      
      const checkApiKey = async () => {
        if (!(await voiceClient.hasApiKey())) {
          setShowApiKeyInput(true);
        } else {
          loadVoices();
        }
      };
      
      checkApiKey();
    }
  }, [messages.length, chatType]);

  const loadVoices = async () => {
    try {
      const voices = await agentService.getVoices();
      setAvailableVoices(voices);
    } catch (error) {
      console.error("Error loading voices:", error);
    }
  };

  const resetError = () => {
    setErrorState(null);
  };

  const retryLastMessage = async () => {
    if (lastUserInput) {
      resetError();
      await processUserMessage(lastUserInput);
    } else {
      toast({
        title: "Nothing to retry",
        description: "There is no previous message to retry",
        variant: "destructive",
      });
    }
  };

  const processUserMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;
    
    setLastUserInput(messageText);
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      text: messageText,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setErrorState(null);
    
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
        text: response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, agentMessage]);
      
      if (!isMuted) {
        try {
          agentService.setVoice(selectedVoice);
          const audioBuffer = await agentService.generateSpeech(response);
          const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
          const audioUrl = URL.createObjectURL(audioBlob);
          
          if (audioRef.current) {
            audioRef.current.src = audioUrl;
            audioRef.current.play();
          }
        } catch (error) {
          console.error("Error generating speech:", error);
          toast({
            title: "Speech Error",
            description: "Could not generate speech. Check your API key and try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      
      setErrorState({
        message: "Failed to get a response from the AI service. Please try again.",
        details: error?.toString()
      });
      
      toast({
        title: "Communication Error",
        description: "Failed to get response from the agent. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    await processUserMessage(input);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    
    if (!isMuted && audioRef.current) {
      audioRef.current.pause();
    }
    
    toast({
      title: isMuted ? "Audio Enabled" : "Audio Disabled",
      description: isMuted ? "Agent responses will now be spoken" : "Agent responses will be text only",
    });
  };

  const handleVoiceChange = (voiceId: string) => {
    setSelectedVoice(voiceId);
    agentService.setVoice(voiceId);
    
    toast({
      title: "Voice Changed",
      description: "The agent will now use a different voice",
    });
  };

  return {
    messages,
    input,
    setInput,
    isListening,
    isMuted,
    isLoading,
    errorState,
    resetError,
    showApiKeyInput,
    setShowApiKeyInput,
    selectedVoice,
    availableVoices,
    handleSend,
    toggleMute,
    handleVoiceChange,
    retryLastMessage,
    audioRef
  };
}
