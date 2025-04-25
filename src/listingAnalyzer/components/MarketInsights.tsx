import { useState, useEffect } from "react";
import { ChatMessage } from "@/shared/types";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Textarea } from "@/shared/ui/textarea";
import { Button } from "@/shared/ui/button";
import { Send, Search } from "lucide-react";
import { toast } from "@/shared/hooks/use-toast";
import { chatService } from "@/shared/services/chatService";
import { LoadingIndicator } from "@/chat/components/LoadingIndicator";
import { ChatMessage as ChatMessageComponent } from "@/chat/components/ChatMessage";
import { Alert, AlertTitle, AlertDescription } from "@/shared/ui/alert";
import { AlertCircle } from "lucide-react";
import { analyzeListingUrl, analyzeAddress } from "@/listingAnalyzer/services/listingAnalyzerService";

interface MarketInsightsProps {
  initialAddress?: string;
}

const MarketInsights = ({ initialAddress = "" }: MarketInsightsProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      type: "agent",
      text: "Hello! I can help you understand rental market trends and pricing. Enter a property address or paste a listing URL to get started.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState(initialAddress);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialAddress) {
      handleSendMessage();
    }
  }, []);

  const quickActions = [
    "123 Main St, New York, NY",
    "Analyze 1-bed apartments in San Francisco",
    "Is $2,500 fair for a 2-bed in Chicago?"
  ];

  const addAgentMessage = (msg: ChatMessage) => setMessages(prev => [...prev, msg]);

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
    setError(null);
    
    try {
      // First try to analyze as a URL
      const wasListingAnalyzed = await analyzeListingUrl(input, addAgentMessage);
      
      if (wasListingAnalyzed) {
        setIsLoading(false);
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
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full border rounded-xl overflow-hidden shadow-md bg-white dark:bg-slate-800">
      <div className="p-3 border-b border-border bg-slate-50 dark:bg-slate-900">
        <h3 className="font-medium">Rental Price Analyzer</h3>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4" aria-live="polite" role="log">
          {messages.length === 1 && (
            <div className="space-y-3 mb-4">
              <p className="text-sm text-muted-foreground">
                Enter an address to analyze rental prices, or try one of these examples:
              </p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action) => (
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
          {messages.map((message) => (
            <ChatMessageComponent key={message.id} message={message} />
          ))}
          {isLoading && <LoadingIndicator />}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-border bg-slate-50 dark:bg-slate-900">
        <div className="flex items-end gap-2">
          <Textarea
            placeholder="Enter an address or paste a listing URL..."
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

export default MarketInsights;
