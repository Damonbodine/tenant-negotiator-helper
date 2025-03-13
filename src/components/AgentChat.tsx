
import { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { agentService } from "@/utils/agentService";

type MessageType = "user" | "agent";

interface Message {
  id: string;
  type: MessageType;
  text: string;
  timestamp: Date;
}

export const AgentChat = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Add initial welcome message
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          type: "agent",
          text: "Hello! I'm your Rent Negotiator Assistant. I can help you negotiate better rental terms. What kind of property are you interested in?",
          timestamp: new Date()
        }
      ]);
    }
  }, [messages.length]);
  
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
      if (!agentService.hasApiKey()) {
        toast({
          title: "API Key Required",
          description: "Please set your ElevenLabs API key to chat with the agent",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Simulate AI response for now
      const response = await simulateResponse(input);
      
      const agentMessage: Message = {
        id: Date.now().toString(),
        type: "agent",
        text: response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, agentMessage]);
      
      // If not muted, speak the response
      if (!isMuted) {
        // In a real implementation, this would use the ElevenLabs API to speak the response
        console.log("Would speak:", response);
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
  
  const simulateResponse = (userInput: string): Promise<string> => {
    // This function simulates an AI response
    // In a real implementation, this would call the ElevenLabs API
    return new Promise((resolve) => {
      setTimeout(() => {
        const responses = [
          "Based on current market data, you can negotiate for a 5-10% discount on the asking rent if the property has been vacant for over 30 days.",
          "When negotiating your lease, consider asking for a longer lease term in exchange for a lower monthly rent. Landlords often prefer stable, long-term tenants.",
          "I'd recommend gathering information about similar properties in the area. Having comparable rental prices can strengthen your negotiating position.",
          "You might want to ask about maintenance responsibilities. Sometimes landlords are willing to reduce rent if you take on some minor maintenance tasks.",
          "When viewing the apartment, take notes of any issues or needed repairs. These can be leveraging points during your negotiation.",
          "In this market, security deposit amount is often negotiable. You could ask for a reduction from two months' rent to one month's rent."
        ];
        const randomIndex = Math.floor(Math.random() * responses.length);
        resolve(responses[randomIndex]);
      }, 1500);
    });
  };
  
  const toggleListening = () => {
    // This would implement speech recognition in a real application
    // For now, just toggle the state
    setIsListening(!isListening);
    if (!isListening) {
      toast({
        title: "Voice Input",
        description: "Voice input would be activated here in a complete implementation",
      });
    }
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  return (
    <div className="flex flex-col h-full">
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
                    ? "bg-negotiator-500 text-white" 
                    : "bg-card border border-border"}
                `}
              >
                <p>{message.text}</p>
                <div 
                  className={`
                    text-xs mt-1 
                    ${message.type === "user" ? "text-negotiator-100" : "text-muted-foreground"}
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
                  <div className="w-2 h-2 rounded-full bg-negotiator-400 animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-negotiator-400 animate-pulse delay-150" />
                  <div className="w-2 h-2 rounded-full bg-negotiator-400 animate-pulse delay-300" />
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-border">
        <div className="flex items-end gap-2">
          <Textarea
            placeholder="Ask about rental negotiation strategies..."
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
    </div>
  );
};
