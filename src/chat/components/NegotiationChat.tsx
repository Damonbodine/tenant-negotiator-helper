
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
import { detectAffordabilityTrigger, extractFinancialData } from "@/shared/services/chatClient";
import { ChatWithArtifacts } from "@/shared/components/layout/ChatWithArtifacts";
import { useArtifactStore } from "@/shared/stores/artifactStore";
import { negotiationTrigger } from "@/shared/services/negotiationTriggerService";
import { VisualArtifact, MarketPositionIndicatorData, AffordabilityCalculatorData } from "@/shared/types/artifacts";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";

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
  const { addArtifact, triggerAffordabilityCalculator } = useArtifactStore();

  // Post-response affordability triggering
  // This implements Claude AI-style conditional artifact rendering:
  // - Waits for complete AI response (no render loops)
  // - 1-second delay ensures DOM stability
  // - Analyzes both user input AND AI response for triggers
  // - Extracts financial data for personalized calculator
  useEffect(() => {
    // Only trigger after AI responses (not on initial load)
    if (messages.length < 2) return;
    
    const lastMessage = messages[messages.length - 1];
    const secondLastMessage = messages[messages.length - 2];
    
    // Only trigger after an agent response to a user message
    if (lastMessage?.type === 'agent' && secondLastMessage?.type === 'user') {
      // Wait for render cycle to complete, then check for triggers
      const triggerTimer = setTimeout(() => {
        const userText = secondLastMessage.text;
        const agentText = lastMessage.text;
        const fullConversation = messages.slice(-4); // Last 2 exchanges
        
        // Check for affordability calculator triggers
        if (detectAffordabilityTrigger(userText, fullConversation) || 
            detectAffordabilityTrigger(agentText, fullConversation)) {
          
          console.log('🧮 Post-response affordability trigger detected');
          
          // Extract financial data from the conversation
          const financialData = extractFinancialData(userText + ' ' + agentText, fullConversation);
          console.log('💰 Extracted financial data:', financialData);
          
          // Trigger affordability calculator
          triggerAffordabilityCalculator(financialData);
        }
        
        // Check for negotiation roadmap triggers
        if (negotiationTrigger.shouldTriggerRoadmap(userText) || 
            negotiationTrigger.shouldTriggerRoadmap(agentText)) {
          
          console.log('🗺️ Post-response negotiation roadmap trigger detected');
          
          // Trigger roadmap generation (async, don't await to avoid blocking)
          negotiationTrigger.processPotentialTrigger(userText + ' ' + agentText)
            .then(result => {
              if (result.needsMoreInfo && result.followUpMessage) {
                console.log('❓ Need more context, will show follow-up message');
                // Add the follow-up message to the chat
                const followUpMsg = {
                  id: (Date.now() + Math.random()).toString(),
                  type: 'agent' as const,
                  text: result.followUpMessage,
                  timestamp: new Date()
                };
                setMessages(prev => [...prev, followUpMsg]);
              }
            })
            .catch(error => console.error('❌ Roadmap trigger error:', error));
        }
      }, 1000); // 1 second delay to ensure DOM is stable
      
      // Cleanup timer on unmount or dependency change
      return () => clearTimeout(triggerTimer);
    }
  }, [messages.length, messages, triggerAffordabilityCalculator]); // Only trigger when message count changes

  const quickActions = [
    "Help me negotiate my $2500/month rent down by $200",  // Direct roadmap trigger
    "I need a negotiation strategy for my rent",           // Direct roadmap trigger
    "Lower my rent",
    "Add a roommate", 
    "Negotiate lease terms",
    "Handle a rent increase",
    "Show budget calculator", // Direct affordability calculator
    "Show market analysis demo", // Demo action
    "Show affordability analysis" // Affordability calculator demo
  ];

  // Demo artifact generation
  const generateDemoArtifact = () => {
    const demoData: MarketPositionIndicatorData = {
      currentRent: 2400,
      marketMedian: 2200,
      percentile: 72,
      status: 'above_market',
      message: 'Your rent is 9.1% above the market median. This presents a good opportunity for negotiation.',
      confidence: 0.85
    };

    const artifact: VisualArtifact = {
      id: `demo-${Date.now()}`,
      type: 'market-position-indicator',
      title: 'Market Position Analysis',
      description: 'Analysis of your rent compared to market rates in your area',
      data: demoData,
      priority: 'high',
      interactive: true,
      timestamp: new Date(),
      associatedMessageId: 'demo'
    };

    addArtifact(artifact);
  };

  // Demo affordability calculator
  const generateAffordabilityDemo = () => {
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
  };

  const handleQuickAction = (text: string) => {
    if (text === "Show budget calculator") {
      // Direct affordability calculator without demo data
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
        id: `budget-calc-${Date.now()}`,
        type: 'affordability-calculator',
        title: 'Budget Calculator',
        description: 'Calculate your ideal rent budget and explore affordability scenarios',
        data: basicData,
        priority: 'high',
        interactive: true,
        timestamp: new Date(),
        associatedMessageId: 'budget-calc'
      };

      addArtifact(artifact);
      
      const budgetMessage: ChatMessage = {
        id: `budget-calc-${Date.now()}`,
        type: 'agent',
        text: "I've opened the budget calculator for you! Use the interactive tool on the right to:\n\n• Enter your annual income\n• Set your current rent amount\n• See if you're following the 30% rule\n• Explore different rent scenarios\n\nAdjust the sliders to see real-time calculations and recommendations.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, budgetMessage]);
      return;
    }
    
    if (text === "Show market analysis demo") {
      generateDemoArtifact();
      
      // Add a demo message to chat
      const demoMessage: ChatMessage = {
        id: `demo-${Date.now()}`,
        type: 'agent',
        text: "I've generated a market position analysis for you! Check out the artifact panel on the right to see how your rent compares to market rates. This type of analysis helps identify negotiation opportunities.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, demoMessage]);
      return;
    }
    
    if (text === "Show affordability analysis") {
      generateAffordabilityDemo();
      
      // Add a demo message to chat
      const demoMessage: ChatMessage = {
        id: `affordability-demo-${Date.now()}`,
        type: 'agent',
        text: "I've created an interactive affordability calculator for you! This shows whether your current rent fits your budget and how much you could save through negotiation. Use the sliders to adjust your income and rent amounts to see real-time calculations.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, demoMessage]);
      return;
    }
    
    setInput(text);
    // Use setTimeout to ensure state update completes before async call
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
    <ChatWithArtifacts>
      <main className="flex-1 container flex flex-col items-center justify-center py-12 mb-16">
        <div className="w-full max-w-4xl h-[calc(100vh-21rem)]">
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
