
import { useState } from "react";
import { ChatMessage } from "@/utils/types";
import { useToast } from "./use-toast";

export function useAgentState() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("21m00Tcm4TlvDq8ikWAM");
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [lastUserInput, setLastUserInput] = useState<string>("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  return {
    messages,
    setMessages,
    input,
    setInput,
    isListening,
    setIsListening,
    isMuted,
    setIsMuted,
    isLoading,
    setIsLoading,
    showApiKeyInput,
    setShowApiKeyInput,
    selectedVoice,
    setSelectedVoice,
    availableVoices,
    setAvailableVoices,
    lastUserInput,
    setLastUserInput,
    suggestions,
    setSuggestions,
    toast
  };
}
