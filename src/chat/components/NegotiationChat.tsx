
import { useState, useEffect } from "react";
import { ChatMessage } from "@/shared/types";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Textarea } from "@/shared/ui/textarea";
import { Button } from "@/shared/ui/button";
import { Send, MessageSquare } from "lucide-react";
import { Card } from "@/shared/ui/card";
import { LoadingIndicator } from "@/chat/components/LoadingIndicator";
import { useToast } from "@/shared/hooks/use-toast";
import { chatService } from "@/shared/services/chatService";

const NegotiationChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      type: "agent",
      text: "Welcome! I'm your negotiation coach. What rental situation would you like advice on?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const quickActions = [
    "Lower my rent",
    "Add a roommate",
    "Negotiate lease terms",
    "Handle a rent increase"
  ];

  const handleQuickAction = (text: string) => {
    setInput(text);
    handleSendMessage();
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    try {
      const response = await chatService.sendMessageToGemini(input, messages);
      
      const agentMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'agent',
        text: response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, agentMessage]);
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

  return (
    <div className="flex flex-col h-full border rounded-xl overflow-hidden shadow-md bg-white dark:bg-slate-800">
      <div className="p-3 border-b border-border bg-slate-50 dark:bg-slate-900">
        <h3 className="font-medium">Negotiation Coach</h3>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4" aria-live="polite" role="log">
          {messages.length === 1 && (
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
          
          {isLoading && <LoadingIndicator />}
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
          />
          <Button 
            onClick={handleSendMessage} 
            size="icon" 
            disabled={isLoading || !input.trim()}
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
