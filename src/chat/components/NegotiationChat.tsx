import { useState, useEffect, useRef } from "react";
import { ChatMessage } from "@/shared/types";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Textarea } from "@/shared/ui/textarea";
import { Button } from "@/shared/ui/button";
import { Send, MessageSquare, Clock, CheckCheck } from "lucide-react";
import { Card } from "@/shared/ui/card";
import { LoadingIndicator } from "@/chat/components/LoadingIndicator";
import { TypingIndicator } from "@/chat/components/TypingIndicator";
import { useToast } from "@/shared/hooks/use-toast";
import { chatService } from "@/shared/services/chatService";
import { chatPersistenceService } from "@/shared/services/chatPersistenceService";
import { v4 as uuidv4 } from 'uuid';
import { formatDistanceToNow } from "date-fns";

const NegotiationChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickActions = [
    "Lower my rent",
    "Add a roommate",
    "Negotiate lease terms",
    "Handle a rent increase"
  ];

  // Load chat history
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const history = await chatPersistenceService.loadChatHistory();
        
        if (history.length > 0) {
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
            text: "Welcome! I'm your negotiation coach. What rental situation would you like advice on?",
            timestamp: new Date(),
            isRead: true
          };
          
          setMessages([welcomeMessage]);
          // Save welcome message to history
          chatPersistenceService.saveMessage(welcomeMessage);
        }
      } catch (error) {
        console.error("Error loading chat history:", error);
        toast({
          title: "Error",
          description: "Failed to load chat history",
          variant: "destructive"
        });
        
        // Fallback welcome message if history can't be loaded
        const welcomeMessage: ChatMessage = {
          id: "welcome",
          type: "agent",
          text: "Welcome! I'm your negotiation coach. What rental situation would you like advice on?",
          timestamp: new Date(),
          isRead: true
        };
        
        setMessages([welcomeMessage]);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    
    loadChatHistory();
  }, [toast]);
  
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

  const handleQuickAction = (text: string) => {
    setInput(text);
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
    
    // Save user message to persistence
    try {
      await chatPersistenceService.saveMessage(userMessage);
    } catch (error) {
      console.error("Error saving user message:", error);
      // Continue even if saving fails
    }
    
    try {
      const response = await chatService.sendMessageToGemini(input, messages);
      
      const agentMessage: ChatMessage = {
        id: uuidv4(),
        type: 'agent',
        text: response,
        timestamp: new Date(),
        isRead: false
      };
      
      setMessages(prev => [...prev, agentMessage]);
      
      // Save agent message to persistence
      try {
        await chatPersistenceService.saveMessage(agentMessage);
      } catch (error) {
        console.error("Error saving agent message:", error);
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
      setIsTyping(false);
    }
  };

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
        <h3 className="font-medium">Negotiation Coach</h3>
      </div>
      
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-4 space-y-4" aria-live="polite" role="log">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center p-4">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Clock className="animate-pulse h-4 w-4" />
                <span>Loading conversation history...</span>
              </div>
            </div>
          ) : messages.length === 1 && messages[0].id === "welcome" && (
            <div className="flex flex-wrap gap-2 mb-4">
              {quickActions.map((action) => (
                <Button
                  key={action}
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => handleQuickAction(action)}
                >
                  <MessageSquare className="h-4 w-4" />
                  {action}
                </Button>
              ))}
            </div>
          )}
          
          {messages.map(renderChatMessage)}
          
          {isLoading && <LoadingIndicator />}
          {isTyping && <TypingIndicator />}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-border bg-slate-50 dark:bg-slate-900">
        <div className="flex items-end gap-2">
          <Textarea
            placeholder="Ask for negotiation advice..."
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

export default NegotiationChat;
