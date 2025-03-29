import { useState, useRef, useEffect } from "react";
import { AgentChat } from "@/components/AgentChat";
import { Link } from "react-router-dom";
import { Building, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { chatService, ChatMessage } from "@/utils/chatService";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const Index = () => {
  const [activeJourney, setActiveJourney] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Success!",
      description: "Thank you for subscribing to our newsletter!",
    });
    setEmail("");
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
    <div className="min-h-screen flex flex-col bg-[#da7756]">
      <header className="w-full bg-background/80 backdrop-blur-md border-b border-border py-3">
        <div className="container flex items-center justify-between">
          <div className="flex-1 flex items-center gap-4">
          </div>
          <div className="flex items-center gap-3">
            <Building className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-blue-600 uppercase tracking-wider">RENTCOACH</h1>
          </div>
          <div className="flex-1 flex justify-end">
            <Button variant="outline" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>Contact Us</span>
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 container flex flex-col items-center justify-center py-6">
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
          <div className="space-y-12 w-full max-w-4xl">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-white mb-4">Don't overpay for your next apartment.</h2>
              <p className="text-xl text-white font-semibold">Arm yourself with data to get the best price on rent</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button
                onClick={() => setActiveJourney("market")}
                className="journey-bubble flex flex-col items-center justify-center p-8 bg-[#FEF7CD] hover:bg-[#fcf4b8] border-2 border-[#f0e9b0] rounded-full h-64 w-64 mx-auto transition-all hover:shadow-lg hover:scale-105"
              >
                <div className="text-black text-4xl font-bold mb-2">Market Tips</div>
                <p className="text-black text-center">Get insights on rental prices and market trends</p>
              </button>
              
              <Link
                to="/practice"
                className="journey-bubble flex flex-col items-center justify-center p-8 bg-[#FEF7CD] hover:bg-[#fcf4b8] border-2 border-[#f0e9b0] rounded-full h-64 w-64 mx-auto transition-all hover:shadow-lg hover:scale-105"
              >
                <div className="text-black text-4xl font-bold mb-2">Should I negotiate</div>
                <p className="text-black text-center">Analyze apartment pricing to strengthen your position</p>
              </Link>
              
              <Link
                to="/practice/voice"
                className="journey-bubble flex flex-col items-center justify-center p-8 bg-[#FEF7CD] hover:bg-[#fcf4b8] border-2 border-[#f0e9b0] rounded-full h-64 w-64 mx-auto transition-all hover:shadow-lg hover:scale-105"
              >
                <div className="text-black text-4xl font-bold mb-2 text-center">Practice Call</div>
                <p className="text-black text-center">Rehearse your negotiation with an AI landlord</p>
              </Link>
            </div>
            
            <div className="mx-auto max-w-md w-full mt-6">
              <div className="text-center mb-3">
                <h3 className="text-xl font-semibold text-white">Join our email list and get a free book</h3>
              </div>
              <form onSubmit={handleEmailSubmit} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit">Subscribe</Button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
