
import { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { agentService } from "@/utils/agentService";
import { knowledgeBaseService } from "@/utils/knowledgeBase";

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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
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
      if (!agentService.hasApiKey()) {
        toast({
          title: "API Key Required",
          description: "Please set your ElevenLabs API key to chat with the agent",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Get response based on chat type
      let response;
      
      switch(chatType) {
        case "market":
          response = await simulateMarketResponse(input);
          break;
        case "negotiation":
          response = await simulateNegotiationResponse(input);
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
  
  const getIntelligentResponse = async (userInput: string): Promise<string> => {
    // First, check if the knowledge base has a relevant response
    const knowledgeResponse = knowledgeBaseService.findResponseForQuery(userInput);
    
    if (knowledgeResponse) {
      return knowledgeResponse;
    }
    
    // Fall back to the simulated responses if no knowledge match
    return simulateGeneralResponse(userInput);
  };
  
  const simulateMarketResponse = (userInput: string): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const responses = [
          "Based on current data, rental prices in that area have increased by about 5% over the past year, with a median price of $1,850 for a one-bedroom apartment.",
          "That neighborhood is currently seeing high demand but also increasing supply with several new developments. This might provide some negotiation leverage in the next 3-6 months.",
          "Comparable properties in that area are currently renting for $2.75-$3.25 per square foot, which is slightly above the city average.",
          "The seasonal trends show that winter months (November-February) typically have lower rental prices, with potential savings of 5-8% compared to summer peaks.",
          "That area has a current vacancy rate of approximately 4.2%, which is below the 5% threshold considered a 'balanced' market. This gives landlords some pricing power.",
          "Recent policy changes in that municipality now require landlords to disclose the rental history of units, which can give you valuable information for negotiation."
        ];
        const randomIndex = Math.floor(Math.random() * responses.length);
        resolve(responses[randomIndex]);
      }, 1500);
    });
  };
  
  const simulateNegotiationResponse = (userInput: string): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const responses = [
          "A good strategy is to start by expressing genuine interest in the property, then mention 2-3 comparable units with lower prices. This shows you've done your research and have alternatives.",
          "Consider offering a longer lease term in exchange for a lower monthly rent. Many landlords value stability and reduced vacancy risk over maximizing monthly income.",
          "When negotiating, focus on creating a win-win scenario. For example, offering to handle minor repairs yourself in exchange for a rent reduction can benefit both parties.",
          "Timing matters in negotiations. If a unit has been vacant for over 30 days, landlords are typically more willing to negotiate on price or terms.",
          "Don't limit negotiations to just the rent. Security deposits, parking fees, included utilities, and move-in dates are all negotiable terms that can save you money.",
          "Practice active listening during negotiations. Often, landlords will reveal their priorities or concerns, giving you valuable information about what concessions might be most effective."
        ];
        const randomIndex = Math.floor(Math.random() * responses.length);
        resolve(responses[randomIndex]);
      }, 1500);
    });
  };
  
  const simulateGeneralResponse = (userInput: string): Promise<string> => {
    // This function simulates a general AI response
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
    </div>
  );
};
