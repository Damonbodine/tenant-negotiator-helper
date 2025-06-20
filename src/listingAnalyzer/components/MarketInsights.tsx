
import { useState, useEffect } from "react";
import { ChatMessage } from "@/shared/types";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Textarea } from "@/shared/ui/textarea";
import { Button } from "@/shared/ui/button";
import { Send, Search, Trash2, Save } from "lucide-react";
import { toast } from "@/shared/hooks/use-toast";
import { LoadingIndicator } from "@/chat/components/LoadingIndicator";
import { ChatMessage as ChatMessageComponent } from "@/chat/components/ChatMessage";
import { Alert, AlertTitle, AlertDescription } from "@/shared/ui/alert";
import { AlertCircle } from "lucide-react";
import { analyzeListingUrl, analyzeAddress } from "@/listingAnalyzer/services/listingAnalyzerService";
import { Link, useParams } from "react-router-dom";
import { useConversationHistory } from "@/hooks/useConversationHistory";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface MarketInsightsProps {
  embedded?: boolean;
  initialAddress?: string;
}

const MarketInsights = ({ embedded = false, initialAddress }: MarketInsightsProps) => {
  const params = useParams();
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: "welcome",
    type: "agent",
    text: "Hello! I can help you understand rental market trends and pricing. Enter a property address or paste a listing URL to get started.",
    timestamp: new Date()
  }]);
  const [input, setInput] = useState(initialAddress || params.address || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const { 
    conversations,
    currentConversation,
    isLoading: conversationLoading,
    startNewConversation,
    addMessageToConversation,
    clearCurrentConversation
  } = useConversationHistory();

  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [hasMemories, setHasMemories] = useState(false);

  const optOutOfMemory = async () => {
    setMemoryEnabled(false);
    setHasMemories(false);
    // Could implement actual memory clearing here if needed
    console.log('Memory opt-out requested');
  };

  useEffect(() => {
    // Check if the user is authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };
    
    checkAuth();
    
    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // FIXED: Prevent infinite loop by handling initial address separately
  useEffect(() => {
    const addressToAnalyze = initialAddress || params.address;
    if (addressToAnalyze && messages.length === 1) { // Only run on initial load
      setInput(addressToAnalyze);
      // Auto-analyze the address from URL params or props
      const analyzeInitialAddress = async () => {
        const userMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'user',
          text: addressToAnalyze,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        setError(null);
        
        try {
          const wasListingAnalyzed = await analyzeListingUrl(addressToAnalyze, addAgentMessage);
          if (!wasListingAnalyzed) {
            await analyzeAddress(addressToAnalyze, addAgentMessage);
          }
        } catch (error: any) {
          console.error("Error analyzing initial address:", error);
          setError(error.message || "Failed to analyze the address");
        } finally {
          setIsLoading(false);
        }
      };
      
      analyzeInitialAddress();
    }
  }, [params.address, initialAddress, messages.length]); // Include dependencies

  // REMOVED: This was causing excessive API calls - memory should only save on unmount or manual trigger

  const quickActions = ["123 Main St, New York, NY", "Analyze 1-bed apartments in San Francisco", "Is $2,500 fair for a 2-bed in Chicago?"];
  
  const addAgentMessage = (msg: ChatMessage) => setMessages(prev => [...prev, msg]);
  
  const handleManualSave = async () => {
    if (messages.length > 2 && session?.user) {
      try {
        // Create new conversation if none exists
        if (!currentConversationId) {
          const newConvId = await startNewConversation('listing_analyzer');
          if (newConvId) {
            setCurrentConversationId(newConvId);
            
            // Save all messages to the conversation
            for (const msg of messages) {
              if (msg.id !== 'welcome') { // Skip welcome message
                await addMessageToConversation(
                  newConvId, 
                  msg.text, 
                  msg.type === 'user' ? 'user' : 'assistant'
                );
              }
            }
          }
        }
        
        toast({
          title: "Conversation saved",
          description: "Your conversation has been saved to memory.",
        });
      } catch (error) {
        toast({
          title: "Save failed",
          description: "Failed to save conversation to memory.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Nothing to save",
        description: "Start a conversation to save it to memory.",
        variant: "secondary",
      });
    }
  };
  
  const handleQuickAction = (actionText: string) => {
    setInput(actionText);
    // Use setTimeout to ensure the state is updated before sending
    setTimeout(() => handleSendMessage(), 0);
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
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save memory ONLY when component unmounts - not on every message change
  useEffect(() => {
    // Save on unmount if there's a meaningful conversation
    const handleBeforeUnload = () => {
      if (messages.length > 2 && session?.user && memoryEnabled) {
        saveMemory(messages);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Save when component unmounts - but only if conversation is meaningful
      if (messages.length > 2 && session?.user && memoryEnabled) {
        saveMemory(messages);
      }
    };
  }, []); // Empty dependency array - only run on mount/unmount

  const containerClass = embedded ? "" : "container py-8";
  const wrapperClass = embedded ? "w-full" : "w-full max-w-4xl mx-auto";

  return <main className={containerClass}>
    <div className={wrapperClass}>
      {!embedded && (
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Market Insights</h2>
          <Link to="/" className="px-4 py-2 rounded-lg text-muted-foreground border-muted-foreground border-[1px] hover:opacity-70 transition-opacity">
            Back to home
          </Link>
        </div>
      )}
      <div className="flex flex-col h-full border rounded-xl overflow-hidden shadow-md bg-white dark:bg-slate-800">
        <div className="p-3 border-b border-border bg-card">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Rental Price Analyzer</h3>
            {session?.user && (
              <div className="flex items-center space-x-2">
                <Switch 
                  id="memory-toggle"
                  checked={memoryEnabled}
                  onCheckedChange={(checked) => {
                    setMemoryEnabled(checked);
                    if (!checked && hasMemories) {
                      optOutOfMemory();
                    }
                  }}
                />
                <Label htmlFor="memory-toggle" className="text-xs">
                  Remember conversation
                </Label>
                {hasMemories && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={optOutOfMemory}
                    title="Clear conversation memory"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <ScrollArea className="bg-card flex-1">
          <div aria-live="polite" role="log" className="p-4 space-y-4">
            {messages.length === 1 && <div className="space-y-3 mb-4">
              <p className="text-sm">
                Enter an address to analyze rental prices, or try one of these examples:
              </p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map(action => <Button key={action} variant="outline" className="flex items-center gap-2" onClick={() => handleQuickAction(action)}>
                  <Search className="h-4 w-4" />
                  {action}
                </Button>)}
              </div>
            </div>}
            {messages.map(message => <ChatMessageComponent key={message.id} message={message} />)}
            {isLoading && <LoadingIndicator />}
            {error && <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border bg-card">
          <div className="flex items-end gap-2">
            <Textarea 
              placeholder="Enter an address or paste a listing URL..." 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              className="min-h-[80px] resize-none bg-input" 
              onKeyDown={e => {
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
    </div>
  </main>;
};

export default MarketInsights;
