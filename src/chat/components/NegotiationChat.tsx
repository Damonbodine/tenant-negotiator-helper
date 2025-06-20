
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
// import { detectAffordabilityTrigger, extractFinancialData } from "@/shared/services/chatClient";
import { ChatWithArtifacts } from "@/shared/components/layout/ChatWithArtifacts";
import { useArtifactStore } from "@/shared/stores/artifactStore";
// import { negotiationTrigger } from "@/shared/services/negotiationTriggerService";
import { VisualArtifact, MarketPositionIndicatorData, AffordabilityCalculatorData } from "@/shared/types/artifacts";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";
import { useConversationHistory } from "@/hooks/useConversationHistory";
import { useConversationContext } from "@/contexts/ConversationContext";
import { supabase } from "@/integrations/supabase/client";

const NegotiationChat = () => {
  console.log("🔍 ORIGINAL NegotiationChat component is mounting...");
  
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  const { addArtifact } = useArtifactStore();
  
  // Use conversation context to get current conversation and messages
  const {
    currentConversation,
    isLoadingConversation,
    createNewConversation,
    addMessage,
    updateMessages
  } = useConversationContext();

  // Get messages from current conversation or show welcome message
  const messages = currentConversation?.messages || [{
    id: "welcome",
    type: "agent" as const,
    text: "Welcome! I'm your negotiation coach. What rental situation would you like advice on?",
    timestamp: new Date()
  }];
  const currentConversationId = currentConversation?.conversationId || null;

  const { addMessageToConversation } = useConversationHistory();

  // Simplified: No complex triggering - users click tools directly

  // Permanent tools available in sidebar
  const permanentTools = [
    {
      id: "affordability-calculator",
      title: "Affordability Calculator", 
      description: "Calculate ideal rent budget using 30% rule",
      icon: "💰"
    },
    {
      id: "market-position",
      title: "Market Position",
      description: "Compare your rent to market rates",
      icon: "📊"
    },
    {
      id: "negotiation-roadmap", 
      title: "Negotiation Roadmap",
      description: "Step-by-step negotiation strategy",
      icon: "🗺️"
    },
    {
      id: "script-generator",
      title: "Script Generator", 
      description: "Generate negotiation emails & scripts",
      icon: "📝"
    }
  ];

  const quickQuestions = [
    "Help me negotiate my $2500/month rent down by $200",
    "I need a negotiation strategy for my rent",
    "Lower my rent",
    "Add a roommate", 
    "Negotiate lease terms",
    "Handle a rent increase"
  ];

  // Tool functions - each creates and shows an artifact
  const generateAffordabilityCalculator = () => {
    const basicData: AffordabilityCalculatorData = {
      income: 60000,
      currentRent: 0,
      recommendedMax: 1500,
      savingsWithNegotiation: 0,
      breakdown: {
        thirtyPercent: 1500,
        currentPercentage: 0,
        postNegotiation: 0
      },
      recommendations: [
        "Enter your income and current rent to see personalized recommendations",
        "The 30% rule suggests spending no more than 30% of income on rent",
        "Use the sliders to explore different scenarios"
      ]
    };

    const artifact: VisualArtifact = {
      id: `affordability-calc-${Date.now()}`,
      type: 'affordability-calculator',
      title: 'Affordability Calculator',
      description: 'Calculate your ideal rent budget and explore affordability scenarios',
      data: basicData,
      priority: 'high',
      interactive: true,
      timestamp: new Date(),
      associatedMessageId: 'affordability-tool'
    };

    addArtifact(artifact);
    console.log("💰 Affordability Calculator opened");
  };

  const generateMarketPosition = () => {
    const demoData: MarketPositionIndicatorData = {
      currentRent: 2400,
      marketMedian: 2200,
      percentile: 72,
      status: 'above_market',
      message: 'Your rent is 9.1% above the market median. This presents a good opportunity for negotiation.',
      confidence: 0.85
    };

    const artifact: VisualArtifact = {
      id: `market-position-${Date.now()}`,
      type: 'market-position-indicator',
      title: 'Market Position Analysis',
      description: 'Analysis of your rent compared to market rates in your area',
      data: demoData,
      priority: 'high',
      interactive: true,
      timestamp: new Date(),
      associatedMessageId: 'market-tool'
    };

    addArtifact(artifact);
    console.log("📊 Market Position Analysis opened");
  };

  const generateNegotiationRoadmap = () => {
    // For now, we'll create a simple roadmap artifact
    // Later we can integrate with the actual roadmap service
    const roadmapData = {
      steps: [
        "Research market rates for your area",
        "Document your positive tenant history", 
        "Identify your negotiation leverage points",
        "Draft your negotiation script",
        "Schedule meeting with landlord",
        "Present your case professionally"
      ],
      currentStep: 0,
      targetReduction: 200,
      confidence: "medium"
    };

    const artifact: VisualArtifact = {
      id: `roadmap-${Date.now()}`,
      type: 'negotiation-roadmap',
      title: 'Negotiation Roadmap',
      description: 'Step-by-step strategy for your rent negotiation',
      data: roadmapData,
      priority: 'high',
      interactive: true,
      timestamp: new Date(),
      associatedMessageId: 'roadmap-tool'
    };

    addArtifact(artifact);
    console.log("🗺️ Negotiation Roadmap opened");
  };

  const generateScriptGenerator = () => {
    const scriptData = {
      templates: [
        { type: "email", title: "Rent Reduction Request Email" },
        { type: "phone", title: "Phone Call Script" },
        { type: "meeting", title: "In-Person Meeting Script" }
      ],
      selectedTemplate: "email",
      customization: {
        currentRent: 0,
        targetRent: 0,
        reasonForReduction: ""
      }
    };

    const artifact: VisualArtifact = {
      id: `script-gen-${Date.now()}`,
      type: 'script-generator',
      title: 'Script Generator',
      description: 'Generate personalized negotiation scripts and emails',
      data: scriptData,
      priority: 'high',
      interactive: true,
      timestamp: new Date(),
      associatedMessageId: 'script-tool'
    };

    addArtifact(artifact);
    console.log("📝 Script Generator opened");
  };

  // Demo affordability calculator - TEMPORARILY DISABLED
  const generateAffordabilityDemo = () => {
    /*
    const demoData: AffordabilityCalculatorData = {
      income: 75000,
      currentRent: 2600,
      recommendedMax: 1875, // 30% of $75k annual = $6,250/month * 0.3 = $1,875
      savingsWithNegotiation: 2400, // $200/month = $2,400/year
      breakdown: {
        thirtyPercent: 1875,
        currentPercentage: 41.6, // $2,600 / $6,250 = 41.6%
        postNegotiation: 38.4 // $2,400 / $6,250 = 38.4%
      },
      recommendations: [
        "Your rent exceeds 30% rule - consider negotiating to $2,400 or lower",
        "Current rent uses 41.6% of income, creating financial strain",
        "Reducing to $2,400 would save $2,400 annually for emergency fund"
      ]
    };

    const artifact: VisualArtifact = {
      id: `affordability-${Date.now()}`,
      type: 'affordability-calculator',
      title: 'Affordability Analysis',
      description: 'Interactive calculator showing rent affordability and potential savings',
      data: demoData,
      priority: 'high',
      interactive: true,
      timestamp: new Date(),
      associatedMessageId: 'affordability-demo'
    };

    addArtifact(artifact);
    */
    console.log("Affordability demo temporarily disabled");
  };

  // Handle tool clicks
  const handleToolClick = (toolId: string) => {
    switch (toolId) {
      case "affordability-calculator":
        generateAffordabilityCalculator();
        break;
      case "market-position":
        generateMarketPosition();
        break;
      case "negotiation-roadmap":
        generateNegotiationRoadmap();
        break;
      case "script-generator":
        generateScriptGenerator();
        break;
      default:
        console.log(`Tool ${toolId} not implemented yet`);
    }
  };

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session?.user);
    };
    
    checkAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
    });
    
    return () => subscription.unsubscribe();
  }, []);



  // Handle quick question clicks
  const handleQuickAction = (text: string) => {
    setInput(text);
    // Use setTimeout to ensure state update completes before async call
    setTimeout(() => handleSendMessage(), 0);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const messageText = input;
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: messageText,
      timestamp: new Date()
    };

    // Add user message to conversation context
    addMessage(userMessage);
    setInput("");
    setIsLoading(true);

    try {
      // Check if user is authenticated before attempting conversation operations
      const { data: { session } } = await supabase.auth.getSession();
      const isAuthenticated = !!session?.user;
      
      let conversationId = currentConversationId;

      // Create new conversation if none exists and user is authenticated
      if (isAuthenticated && !conversationId) {
        try {
          conversationId = await createNewConversation('negotiation_help');
          console.log('✅ Created new conversation:', conversationId);
        } catch (error) {
          console.warn("Could not create conversation:", error);
        }
      }

      // Save user message to conversation if authenticated and conversation exists
      if (isAuthenticated && conversationId) {
        try {
          await addMessageToConversation(conversationId, messageText, 'user');
        } catch (error) {
          console.warn("Could not save user message to conversation:", error);
        }
      }

      // Include the user message in the history for AI context
      const messagesWithUser = [...messages, userMessage];
      const response = await chatService.sendMessageToGemini(messageText, messagesWithUser, conversationId || undefined);

      const agentMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'agent',
        text: response.text,
        timestamp: new Date()
      };

      // Add agent message to conversation context
      addMessage(agentMessage);

      // Save agent response to conversation if authenticated and conversation exists
      const activeConversationId = response.conversationId || conversationId;
      if (isAuthenticated && activeConversationId) {
        try {
          await addMessageToConversation(activeConversationId, response.text, 'assistant');
        } catch (error) {
          console.warn("Could not save agent response to conversation:", error);
        }
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

  return (
    <ChatWithArtifacts
      showConversationHistory={isAuthenticated}
      currentConversationId={currentConversationId || undefined}
    >
      <main className="container py-8">
        <div className="w-full max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Negotiation Tips</h2>
            <Link to="/" className="px-4 py-2 rounded-lg text-muted-foreground border-muted-foreground border-[1px] hover:opacity-70 transition-opacity">
              Back to home
            </Link>
          </div>
          <div className="flex flex-col h-full border rounded-xl overflow-hidden shadow-md bg-white dark:bg-slate-800">
      <div className="p-3 border-b border-border bg-card">
        <h3 className="font-medium">Negotiation Coach</h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4" aria-live="polite" role="log">
          {messages.length === 1 && (
            <div className="space-y-4 mb-4">
              {/* Permanent Tools Section */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">🛠️ Negotiation Tools</h4>
                <div className="grid grid-cols-2 gap-2">
                  {permanentTools.map((tool) => (
                    <Button
                      key={tool.id}
                      variant="outline"
                      className="flex flex-col items-start p-3 h-auto text-left gap-1"
                      onClick={() => handleToolClick(tool.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{tool.icon}</span>
                        <span className="font-medium text-sm">{tool.title}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{tool.description}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Quick Questions Section */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">💬 Quick Questions</h4>
                <div className="flex flex-wrap gap-2">
                  {quickQuestions.map((question) => (
                    <Button
                      key={question}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => handleQuickAction(question)}
                    >
                      <MessageSquare className="h-4 w-4" />
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
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
                    ? "bg-secondary border text-secondary-foreground"
                    : "bg-primary border text-primary-foreground"}
                `}
              >
                {message.type === "user" ? (
                  <p className="prose prose-sm dark:prose-invert max-w-none text-white">{message.text}</p>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-white">
                    <ReactMarkdown className="break-words text-white">
                      {message.text}
                    </ReactMarkdown>
                  </div>
                )}
                <div
                  className={`
                    text-xs mt-1
                    ${message.type === "user" ? "text-blue-100" : "text-white/80"}
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
        </div>
      </main>
    </ChatWithArtifacts>
  );
};

export default NegotiationChat;
