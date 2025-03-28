
import { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { agentService } from "@/utils/agentService";
import { knowledgeBaseService } from "@/utils/knowledgeBase";
import { ApiKeyInput } from "@/components/ApiKeyInput";

type MessageType = "user" | "agent";
type ChatType = "market" | "negotiation" | "general";

interface Message {
  id: string;
  type: MessageType;
  text: string;
  timestamp: Date;
}

interface AgentChatProps {
  chatType?: ChatType;
}

export const AgentChat = ({ chatType = "general" }: AgentChatProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Initialize audio element
    audioRef.current = new Audio();
    
    // Add initial welcome message based on chat type
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
      
      setMessages([
        {
          id: "welcome",
          type: "agent",
          text: welcomeMessage,
          timestamp: new Date()
        }
      ]);

      // Check if API key is set, if not, prompt user
      const checkApiKey = async () => {
        if (!(await agentService.hasApiKey())) {
          setShowApiKeyInput(true);
        }
      };
      
      checkApiKey();
    }
  }, [messages.length, chatType]);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);
  
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      text: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    try {
      // Check if API key is set
      if (!(await agentService.hasApiKey())) {
        setShowApiKeyInput(true);
        setIsLoading(false);
        return;
      }
      
      // Get response based on chat type
      let response;
      
      switch(chatType) {
        case "market":
          response = await agentService.getMarketInsights(input);
          break;
        case "negotiation":
          response = await agentService.getNegotiationAdvice(input);
          break;
        default:
          response = await getIntelligentResponse(input);
      }
      
      const agentMessage: Message = {
        id: Date.now().toString(),
        type: "agent",
        text: response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, agentMessage]);
      
      // If not muted, speak the response
      if (!isMuted) {
        try {
          const audioBuffer = await agentService.generateSpeech(response);
          const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
          const audioUrl = URL.createObjectURL(audioBlob);
          
          if (audioRef.current) {
            audioRef.current.src = audioUrl;
            audioRef.current.play();
          }
        } catch (error) {
          console.error("Error generating speech:", error);
          // Fail silently - text response is still shown
        }
      }
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
  
  const getIntelligentResponse = async (userInput: string): Promise<string> => {
    // First, check if the knowledge base has a relevant response
    const knowledgeResponse = knowledgeBaseService.findResponseForQuery(userInput);
    
    if (knowledgeResponse) {
      return knowledgeResponse;
    }
    
    // Fall back to the agent service
    return agentService.sendMessage(userInput);
  };
  
  const toggleListening = () => {
    // This would implement speech recognition in a real application
    setIsListening(!isListening);
    
    if (!isListening) {
      // In a real implementation, this would start speech recognition
      toast({
        title: "Voice Input",
        description: "Voice input would be activated here in a complete implementation",
      });
    } else {
      // In a real implementation, this would stop speech recognition
    }
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
    
    // If currently playing, stop it
    if (!isMuted && audioRef.current) {
      audioRef.current.pause();
    }
  };
  
  const handleApiKeyClose = () => {
    setShowApiKeyInput(false);
  };
  
  return (
    <div className="flex flex-col h-full border rounded-xl overflow-hidden shadow-md bg-white dark:bg-slate-800">
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4 space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
            >
              <Card 
                className={`
                  max-w-[80%] p-3
                  ${message.type === "user" 
                    ? "bg-blue-500 text-white" 
                    : "bg-card border border-border"}
                `}
              >
                <p>{message.text}</p>
                <div 
                  className={`
                    text-xs mt-1 
                    ${message.type === "user" ? "text-blue-100" : "text-muted-foreground"}
                  `}
                >
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </Card>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <Card className="max-w-[80%] p-3 bg-card border border-border">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse delay-150" />
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse delay-300" />
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-border bg-slate-50 dark:bg-slate-900">
        <div className="flex items-end gap-2">
          <Textarea
            placeholder="Type your message here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[80px] resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <div className="flex flex-col gap-2">
            <Button 
              onClick={toggleListening}
              variant="outline" 
              size="icon"
              className={isListening ? "bg-red-100 text-red-500" : ""}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button 
              onClick={toggleMute}
              variant="outline" 
              size="icon"
              className={isMuted ? "bg-red-100 text-red-500" : ""}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Button onClick={handleSend} size="icon" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {showApiKeyInput && (
        <ApiKeyInput onClose={handleApiKeyClose} />
      )}
    </div>
  );
};
