
import { useState } from "react";
import { useToast } from "./use-toast";
import { ChatMessage } from "@/utils/types";
import { chatService } from "@/utils/chatService";

interface UseNegotiationChatProps {
  scenario: string;
  onMessage?: (text: string) => void;
}

export function useNegotiationChat({ scenario, onMessage }: UseNegotiationChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const startNegotiationPractice = async () => {
    try {
      const systemPrompt = await chatService.getPromptTemplates();
      
      let welcomeMessage = "Hello! I'm the landlord for the property you're interested in. What aspects of the lease would you like to discuss today?";
      
      if (scenario === "random") {
        welcomeMessage = "Hello! I'm the property manager for the unit you inquired about. I see you're interested in discussing some details about the lease. What specific aspects would you like to negotiate today?";
      }
      
      const initialMessage: ChatMessage = {
        id: "welcome",
        type: "agent",
        text: welcomeMessage,
        timestamp: new Date()
      };
      
      setMessages([initialMessage]);
      if (onMessage) onMessage(welcomeMessage);
      
    } catch (error) {
      console.error("Error starting negotiation practice:", error);
      toast({
        title: "Error",
        description: "Failed to start the negotiation practice",
        variant: "destructive",
      });
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      text: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    try {
      const history = messages.map(msg => ({
        id: msg.id,
        type: msg.type,
        text: msg.text,
        timestamp: msg.timestamp
      }));
      
      console.log("Sending message to Gemini:", input);
      console.log("With history:", JSON.stringify(history, null, 2));
      
      const response = await chatService.sendMessageToGemini(input, history);
      
      const agentMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "agent",
        text: response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, agentMessage]);
      if (onMessage) onMessage(response);
      
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to get response from the agent",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    input,
    setInput,
    isLoading,
    startNegotiationPractice,
    handleSend
  };
}
