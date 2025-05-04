import { useState, useEffect, useRef } from "react";
import { ChatMessage } from "@/shared/types";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Textarea } from "@/shared/ui/textarea";
import { Button } from "@/shared/ui/button";
import { Send, Search, Clock } from "lucide-react";
import { useToast } from "@/shared/hooks/use-toast";
import { LoadingIndicator } from "@/chat/components/LoadingIndicator";
import { ChatMessage as ChatMessageComponent } from "@/chat/components/ChatMessage";
import { TypingIndicator } from "@/chat/components/TypingIndicator";
import { Alert, AlertTitle, AlertDescription } from "@/shared/ui/alert";
import { AlertCircle } from "lucide-react";
import { analyzeListingUrl, analyzeAddress } from "@/listingAnalyzer/services/listingAnalyzerService";
import { chatPersistenceService } from "@/shared/services/chatPersistenceService";
import { v4 as uuidv4 } from 'uuid';

interface MarketInsightsProps {
  initialAddress?: string;
}

const MarketInsights = ({
  initialAddress = ""
}: MarketInsightsProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(initialAddress);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickActions = ["123 Main St, New York, NY", "Analyze 1-bed apartments in San Francisco", "Is $2,500 fair for a 2-bed in Chicago?"];
  
  // Load chat history
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const history = await chatPersistenceService.loadChatHistory();
        
        if (history.length > 0) {
          // Filter for market-related messages if needed
          setMessages(history);
          
          // Mark agent messages as read
          const agentMessageIds = history
            .filter(msg => msg.type === 'agent' && msg.isRead === false)
            .map(msg => msg.id);
          
          if (agentMessageIds.length > 0) {
            chatPersistenceService.markMessagesAsRead(agentMessageIds);
          }
        } else {
          // Welcome message
          const welcomeMessage: ChatMessage = {
            id: "welcome",
            type: "agent",
            text: "Hello! I can help you understand rental market trends and pricing. Enter a property address or paste a listing URL to get started.",
            timestamp: new Date(),
            isRead: true
          };
          
          setMessages([welcomeMessage]);
          // Save welcome message to history
          chatPersistenceService.saveMessage(welcomeMessage);
        }
      } catch (error) {
        console.error("Error loading chat history:", error);
        
        // Fallback welcome message
        const welcomeMessage: ChatMessage = {
          id: "welcome",
          type: "agent",
          text: "Hello! I can help you understand rental market trends and pricing. Enter a property address or paste a listing URL to get started.",
          timestamp: new Date(),
          isRead: true
        };
        
        setMessages([welcomeMessage]);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    
    loadChatHistory();
  }, []);
  
  // Process initial address if provided
  useEffect(() => {
    if (initialAddress && !isLoadingHistory) {
      handleSendMessage();
    }
  }, [initialAddress, isLoadingHistory]);

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
  
  // Mark messages as read when they're visible
  useEffect(() => {
    if (messages.length === 0) return;
    
    const unreadAgentMessageIds = messages
      .filter(msg => msg.type === 'agent' && msg.isRead === false)
      .map(msg => msg.id);
    
    if (unreadAgentMessageIds.length > 0) {
      // Mark messages as read and update local state
      chatPersistenceService.markMessagesAsRead(unreadAgentMessageIds)
        .then(success => {
          if (success) {
            setMessages(prev => prev.map(msg => 
              unreadAgentMessageIds.includes(msg.id) 
                ? { ...msg, isRead: true } 
                : msg
            ));
          }
        })
        .catch(error => console.error("Error marking messages as read:", error));
    }
  }, [messages]);

  const addAgentMessage = (msg: ChatMessage) => {
    // Ensure message has required properties
    const enhancedMsg = {
      ...msg,
      id: msg.id || uuidv4(),
      timestamp: msg.timestamp || new Date(),
      isRead: false
    };
    
    setMessages(prev => [...prev, enhancedMsg]);
    
    // Save message to persistence
    chatPersistenceService.saveMessage(enhancedMsg).catch(err => {
      console.error("Error saving agent message:", err);
    });
    
    return enhancedMsg;
  };

  const handleQuickAction = (actionText: string) => {
    setInput(actionText);
    // Use setTimeout to ensure the state is updated before sending
    setTimeout(() => handleSendMessage(), 0);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || isTyping) return;
    
    const userMessage: ChatMessage = {
      id: uuidv4(),
      type: 'user',
      text: input,
      timestamp: new Date(),
      isRead: true
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setIsTyping(true);
    setError(null);
    
    // Save user message to persistence
    try {
      await chatPersistenceService.saveMessage(userMessage);
    } catch (error) {
      console.error("Error saving user message:", error);
      // Continue even if saving fails
    }
    
    try {
      // First try to analyze as a URL
      const wasListingAnalyzed = await analyzeListingUrl(input, addAgentMessage);
      if (wasListingAnalyzed) {
        setIsLoading(false);
        setIsTyping(false);
        return;
      }

      // If not a listing URL, process as address
      await analyzeAddress(input, addAgentMessage);
    } catch (error: any) {
      console.error("Error sending message:", error);
      setError(error.message || "Failed to get response from the agent");
      toast({
        title: "Error",
        description: "Failed to get response from the agent",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full border rounded-xl overflow-hidden shadow-md bg-white dark:bg-slate-800">
      <div className="p-3 border-b border-border bg-orange-100">
        <h3 className="font-medium text-black">Rental Price Analyzer</h3>
      </div>
      
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div aria-live="polite" role="log" className="p-4 space-y-4">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center p-4">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Clock className="animate-pulse h-4 w-4" />
                <span>Loading conversation history...</span>
              </div>
            </div>
          ) : messages.length === 1 && messages[0].id === "welcome" && (
            <div className="space-y-3 mb-4">
              <p className="text-sm text-black">
                Enter an address to analyze rental prices, or try one of these examples:
              </p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map(action => (
                  <Button 
                    key={action} 
                    variant="outline" 
                    className="flex items-center gap-2" 
                    onClick={() => handleQuickAction(action)}
                  >
                    <Search className="h-4 w-4" />
                    {action}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {messages.map(message => (
            <ChatMessageComponent key={message.id} message={message} />
          ))}
          
          {isLoading && <LoadingIndicator />}
          {isTyping && <TypingIndicator />}
          
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-border bg-amber-100">
        <div className="flex items-end gap-2">
          <Textarea 
            placeholder="Enter an address or paste a listing URL..." 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            className="min-h-[80px] resize-none" 
            onKeyDown={e => {
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
