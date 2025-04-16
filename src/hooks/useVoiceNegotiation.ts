
import { useState, useEffect } from "react";
import { useVoiceAudio } from "./useVoiceAudio";
import { useMicrophoneRecording } from "./useMicrophoneRecording";
import { useNegotiationChat } from "./useNegotiationChat";
import { ChatMessage } from "@/utils/types";

export type MessageType = "user" | "agent";

export interface Message {
  id: string;
  type: MessageType;
  text: string;
  timestamp: Date;
}

export function useVoiceNegotiation(scenario: string) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [hasBackendApiKey, setHasBackendApiKey] = useState(false);

  const {
    isMuted,
    selectedVoice,
    availableVoices,
    audioRef,
    loadVoices,
    speakText,
    toggleMute,
    handleVoiceChange
  } = useVoiceAudio();

  const {
    isListening,
    microphoneAccessState,
    audioChunksRef,
    checkMicrophonePermission,
    startListening,
    stopListening
  } = useMicrophoneRecording();

  const {
    messages,
    input,
    setInput,
    isLoading,
    startNegotiationPractice,
    handleSend
  } = useNegotiationChat({ 
    scenario,
    onMessage: (text) => {
      if (!isMuted) {
        speakText(text);
      }
    }
  });

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current = new Audio();
    }
    
    if (messages.length === 0 && isCallActive) {
      startNegotiationPractice();
    }
  }, [messages.length, isCallActive, scenario, isMuted]);

  useEffect(() => {
    checkMicrophonePermission();
  }, []);

  const startCall = async () => {
    setIsCallActive(true);
    loadVoices();
  };

  const endCall = () => {
    setIsCallActive(false);
    setMessages([]);
    
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    if (isListening) {
      stopListening();
    }
  };

  const toggleListening = async () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return {
    messages,
    input,
    setInput,
    isListening,
    isCallActive,
    showApiKeyInput,
    setShowApiKeyInput,
    isLoading,
    isMuted,
    selectedVoice,
    availableVoices,
    hasBackendApiKey,
    microphoneAccessState,
    startCall,
    endCall,
    handleSend,
    toggleListening,
    toggleMute,
    handleVoiceChange
  };
}
