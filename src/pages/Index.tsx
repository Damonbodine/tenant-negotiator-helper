import { useState, useRef, useEffect } from "react";
import { AgentChat } from "@/components/AgentChat";
import { Header } from "@/components/layout/Header";
import { FeatureCards } from "@/components/marketing/FeatureCards";
import { NewsletterSignup } from "@/components/marketing/NewsletterSignup";
import { Button } from "@/components/ui/button";
import { chatService, ChatMessage } from "@/utils/chatService";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Send, MessageSquare } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const [activeJourney, setActiveJourney] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const quickActions = [
    "Am I paying too much?",
    "How much are rentals in this area?",
    "Help me negotiate"
  ];

  const handleQuickAction = (text: string) => {
    setInput(text);
    handleSendMessage();
  };

  useEffect(() => {
    if (activeJourney === "market" && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          type: "agent",
          text: "Hello! I can help you understand rental market trends and pricing. What area are you interested in learning about?",
          timestamp: new Date()
        }
      ]);
    }
  }, [activeJourney, messages.length]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

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
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container flex flex-col items-center justify-center py-12">
        {activeJourney ? (
          <>
            {activeJourney === "market" && (
              <div className="w-full max-w-4xl h-[calc(100vh-10rem)]">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-blue-600">Market Tips</h2>
                  <button 
                    onClick={() => setActiveJourney(null)}
                    className="px-4 py-2 rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors text-blue-600"
                  >
                    Back to options
                  </button>
                </div>
                
                <div className="flex flex-col h-full border rounded-xl overflow-hidden shadow-md bg-white">
                  <div className="p-3 border-b border-border bg-slate-50">
                    <h3 className="font-medium">Rental Market Assistant</h3>
                  </div>
                  
                  <ScrollArea className="flex-1" ref={scrollAreaRef}>
                    <div className="p-4 space-y-4">
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
                  
                  <div className="p-4 border-t border-border bg-slate-50">
                    <div className="flex items-end gap-2">
                      <Textarea
                        placeholder="Ask about rental market trends..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="min-h-[80px] resize-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button onClick={handleSendMessage} size="icon" disabled={isLoading || !input.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeJourney === "negotiation" && (
              <div className="w-full max-w-4xl h-[calc(100vh-10rem)]">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-blue-600">Negotiation Tips</h2>
                  <button 
                    onClick={() => setActiveJourney(null)}
                    className="px-4 py-2 rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors text-blue-600"
                  >
                    Back to options
                  </button>
                </div>
                <AgentChat chatType="negotiation" />
              </div>
            )}
          </>
        ) : (
          <div className="space-y-16 w-full max-w-4xl">
            <div className="text-center">
              <h2 className="text-5xl font-bold mb-6 gradient-heading">
                Don't overpay for your next apartment.
              </h2>
              <p className="text-xl text-cyan-400/90 font-medium">
                Arm yourself with data to get the best price on rent
              </p>
            </div>
            
            <FeatureCards setActiveJourney={setActiveJourney} />
            <NewsletterSignup />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
