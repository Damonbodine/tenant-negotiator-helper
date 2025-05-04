import { useState, useEffect, useRef } from "react";
import { ChatMessage } from "@/shared/types";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Textarea } from "@/shared/ui/textarea";
import { Button } from "@/shared/ui/button";
import { Send, CheckCheck, Clock } from "lucide-react";
import { Card } from "@/shared/ui/card";
import { LoadingIndicator } from "@/chat/components/LoadingIndicator";
import { TypingIndicator } from "@/chat/components/TypingIndicator";
import { useToast } from "@/shared/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';
import { formatDistanceToNow } from "date-fns";

interface MarketInsightsProps {
  initialAddress?: string; // Added prop for initial address
}

const MarketInsights: React.FC<MarketInsightsProps> = ({ initialAddress = "" }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(initialAddress || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simulate receiving a message after a delay
    const timer = setTimeout(() => {
      const newMessage: ChatMessage = {
        id: uuidv4(),
        type: "agent",
        text: "Welcome to Market Insights! How can I help you today?",
        timestamp: new Date(),
        isRead: true
      };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      
      // If initial address is provided, simulate a search
      if (initialAddress) {
        const userMessage: ChatMessage = {
          id: uuidv4(),
          type: "user",
          text: initialAddress,
          timestamp: new Date(),
          isRead: true
        };
        
        setMessages((prevMessages) => [...prevMessages, userMessage]);
        // Simulate analysis for the initial address
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          const agentResponse: ChatMessage = {
            id: uuidv4(),
            type: "agent",
            text: `I'm analyzing ${initialAddress}. This is a simulated response to your initial address input.`,
            timestamp: new Date(),
            isRead: false
          };
          setMessages((prevMessages) => [...prevMessages, agentResponse]);
        }, 2000);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [initialAddress]);

  const handleSendMessage = () => {
    if (!input.trim() || isLoading) return;

    const newMessage: ChatMessage = {
      id: uuidv4(),
      type: "user",
      text: input,
      timestamp: new Date(),
      isRead: true
    };

    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInput("");

    // Simulate agent typing
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const agentResponse: ChatMessage = {
        id: uuidv4(),
        type: "agent",
        text: `This is a simulated response to your message: "${input}". I am analyzing the market for you...`,
        timestamp: new Date(),
        isRead: false
      };
      setMessages((prevMessages) => [...prevMessages, agentResponse]);
    }, 2000);
  };

  // Auto-scroll to bottom when messages change or typing state changes
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        setTimeout(() => {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }, 100);
      }
    }
  }, [messages, isTyping]);

  // Function to render a chat message
  const renderChatMessage = (message: ChatMessage) => {
    // Format the timestamp in a human-readable way
    const formattedTime = {
      relative: formatDistanceToNow(message.timestamp, { addSuffix: true }),
      exact: message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    return (
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
              flex items-center justify-between text-xs mt-1 
              ${message.type === "user" ? "text-blue-100" : "text-muted-foreground"}
            `}
          >
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span title={formattedTime.exact}>{formattedTime.relative}</span>
            </div>
            
            {message.type === "user" && (
              <div className="flex items-center" title={message.isRead ? "Read" : "Delivered"}>
                <CheckCheck className={`h-3 w-3 ${message.isRead ? "opacity-100" : "opacity-50"}`} />
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full border rounded-xl overflow-hidden shadow-md bg-white dark:bg-slate-800">
      <div className="p-3 border-b border-border bg-slate-50 dark:bg-slate-900">
        <h3 className="font-medium">Market Insights</h3>
      </div>

      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-4 space-y-4" aria-live="polite" role="log">
          {messages.map(renderChatMessage)}

          {isLoading && <LoadingIndicator />}
          {isTyping && <TypingIndicator />}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border bg-slate-50 dark:bg-slate-900">
        <div className="flex items-end gap-2">
          <Textarea
            placeholder="Enter your query here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[80px] resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            aria-label="Message input"
            disabled={isLoading || isTyping}
          />
          <Button
            onClick={handleSendMessage}
            size="icon"
            disabled={isLoading || isTyping || !input.trim()}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MarketInsights;
