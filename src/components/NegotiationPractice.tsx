import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Headphones, Mic, MicOff, Phone, PhoneOff, Settings, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ApiKeyInput } from "@/components/ApiKeyInput";
import { agentService } from "@/utils/agentService";
import { PracticeScenario } from "@/components/PracticeScenario";
import { Link } from "react-router-dom";

type MessageType = "user" | "agent";

interface Message {
  id: string;
  type: MessageType;
  text: string;
  timestamp: Date;
}

export const NegotiationPractice = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState("standard");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const scenarios = [
    { id: "standard", name: "Standard Apartment", description: "Practice negotiating rent for a standard 1-bedroom apartment in an urban area." },
    { id: "luxury", name: "Luxury Condo", description: "Negotiate for a high-end luxury condo with premium amenities." },
    { id: "house", name: "Single Family Home", description: "Practice negotiating for a 3-bedroom single family home in the suburbs." }
  ];
  
  useEffect(() => {
    if (messages.length === 0 && isCallActive) {
      const scenarioTitle = scenarios.find(s => s.id === selectedScenario)?.name || "Standard Apartment";
      setMessages([
        {
          id: "welcome",
          type: "agent",
          text: `Hello! I'm the landlord for the ${scenarioTitle} you're interested in. I understand you wanted to discuss the terms. What aspects of the lease would you like to negotiate?`,
          timestamp: new Date()
        }
      ]);
    }
  }, [messages.length, isCallActive, selectedScenario]);
  
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);
  
  const startCall = async () => {
    if (!agentService.hasApiKey()) {
      setShowApiKeyInput(true);
      return;
    }
    
    try {
      await agentService.startConversation();
      setIsCallActive(true);
      toast({
        title: "Call Started",
        description: "You're now connected with the landlord agent.",
      });
    } catch (error) {
      console.error("Error starting call:", error);
      toast({
        title: "Error",
        description: "Failed to start the call. Please check your API key.",
        variant: "destructive",
      });
    }
  };
  
  const endCall = () => {
    setIsCallActive(false);
    setMessages([]);
    toast({
      title: "Call Ended",
      description: "Your practice session has ended.",
    });
  };
  
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
      const response = await agentService.sendMessage(input);
      
      const agentMessage: Message = {
        id: Date.now().toString(),
        type: "agent",
        text: response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, agentMessage]);
      
      console.log("Agent would speak:", response);
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
  
  const toggleListening = () => {
    setIsListening(!isListening);
    
    if (!isListening) {
      toast({
        title: "Voice Input",
        description: "Voice input activated. Speak clearly into your microphone.",
      });
    } else {
      toast({
        title: "Voice Input Disabled",
        description: "Returning to text input mode.",
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold gradient-heading">Practice Negotiation Calls</h2>
          <p className="text-muted-foreground mt-1">
            Improve your rental negotiation skills with interactive voice practice
          </p>
        </div>
        <Link to="/">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col shadow-md border-negotiator-100">
            <CardHeader className="pb-2 flex flex-row justify-between items-center bg-gradient-to-r from-negotiator-50 to-transparent dark:from-negotiator-900/20 dark:to-transparent border-b">
              <div>
                <CardTitle>Negotiation Simulator</CardTitle>
                <CardDescription>
                  Practice your negotiation skills with an AI landlord
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {!isCallActive ? (
                  <Button onClick={startCall} className="gap-2 bg-negotiator-600 hover:bg-negotiator-700">
                    <Phone className="h-4 w-4" />
                    Start Call
                  </Button>
                ) : (
                  <Button onClick={endCall} variant="destructive" className="gap-2">
                    <PhoneOff className="h-4 w-4" />
                    End Call
                  </Button>
                )}
                <Button 
                  variant="outline"
                  size="icon"
                  onClick={() => setShowApiKeyInput(true)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 p-0 overflow-hidden">
              {isCallActive ? (
                <div className="flex flex-col h-full">
                  <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                    <div className="space-y-4">
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
                        disabled={!isCallActive}
                      />
                      <div className="flex flex-col gap-2">
                        <Button 
                          onClick={toggleListening}
                          variant="outline" 
                          size="icon"
                          className={isListening ? "bg-red-100 text-red-500" : ""}
                          disabled={!isCallActive}
                        >
                          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </Button>
                        <Button 
                          onClick={handleSend} 
                          size="icon" 
                          disabled={isLoading || !input.trim() || !isCallActive}
                        >
                          <Headphones className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center p-6">
                  <div className="text-center max-w-md">
                    <Headphones className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">Ready to Practice?</h3>
                    <p className="text-muted-foreground mb-4">
                      Select a scenario from the right panel and click "Start Call" to begin your negotiation practice session.
                    </p>
                    <Button onClick={startCall} className="gap-2">
                      <Phone className="h-4 w-4" />
                      Start Call
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card className="shadow-md border-negotiator-100">
            <CardHeader className="bg-gradient-to-r from-negotiator-50 to-transparent dark:from-negotiator-900/20 dark:to-transparent border-b">
              <CardTitle>Practice Scenarios</CardTitle>
              <CardDescription>
                Choose a scenario to practice different negotiation contexts
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs value={selectedScenario} onValueChange={setSelectedScenario}>
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="standard">Standard</TabsTrigger>
                  <TabsTrigger value="luxury">Luxury</TabsTrigger>
                  <TabsTrigger value="house">House</TabsTrigger>
                </TabsList>
                
                {scenarios.map((scenario) => (
                  <TabsContent key={scenario.id} value={scenario.id} className="mt-0">
                    <PracticeScenario scenario={scenario.id} />
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-negotiator-700 to-negotiator-600 text-white shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Quick Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-negotiator-100">
                <Badge variant="outline" className="mb-1 border-white/20 text-white mr-2">Tip 1</Badge>
                Start by building rapport. Briefly introduce yourself and why you like the property.
              </p>
              <p className="text-negotiator-100">
                <Badge variant="outline" className="mb-1 border-white/20 text-white mr-2">Tip 2</Badge>
                Ask open-ended questions to understand the landlord's needs and flexibility.
              </p>
              <p className="text-negotiator-100">
                <Badge variant="outline" className="mb-1 border-white/20 text-white mr-2">Tip 3</Badge>
                When stating your offer, provide reasoning based on market research or property condition.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {showApiKeyInput && (
        <ApiKeyInput onClose={() => setShowApiKeyInput(false)} />
      )}
    </div>
  );
};
