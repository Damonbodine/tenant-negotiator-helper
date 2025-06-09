/**
 * Premium Chat Interface
 * 
 * Integrates all premium services into a cohesive, intelligent chat experience
 * Demonstrates how the new architecture feels to users
 * 
 * Features:
 * - Parallel intelligence processing
 * - Contextual awareness
 * - Proactive suggestions
 * - Visual insights integration
 * - Sub-2 second responses
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { VisualIntelligenceDashboard } from '@/components/intelligence/VisualIntelligenceDashboard';
import { 
  Send, 
  Zap, 
  Brain, 
  Target,
  Clock,
  TrendingUp,
  Lightbulb
} from 'lucide-react';

// Mock imports - replace with actual services
// import { parallelIntelligence } from '@/shared/services/parallelIntelligenceService';
// import { intelligentContext } from '@/shared/services/intelligentContextService';

interface ChatMessage {
  id: string;
  type: 'user' | 'agent';
  text: string;
  timestamp: Date;
  insights?: any;
  visualData?: any;
  responseTime?: number;
}

interface ProactiveSuggestion {
  id: string;
  type: 'insight' | 'action' | 'timing' | 'strategy';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
}

export const PremiumChatInterface: React.FC<{
  userId?: string;
  initialContext?: any;
}> = ({ userId, initialContext }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [proactiveSuggestions, setProactiveSuggestions] = useState<ProactiveSuggestion[]>([]);
  const [showVisualDashboard, setShowVisualDashboard] = useState(false);
  const [userContext, setUserContext] = useState(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);

  // Initialize with proactive suggestions
  useEffect(() => {
    if (userId) {
      initializePremiumExperience();
    }
  }, [userId]);

  const initializePremiumExperience = async () => {
    console.log('🚀 Initializing premium experience...');
    
    // Mock proactive suggestions - replace with real service calls
    setProactiveSuggestions([
      {
        id: '1',
        type: 'insight',
        title: 'Market Opportunity Detected',
        description: 'Rental prices in Austin dropped 3% this month - excellent negotiation timing',
        priority: 'high',
        actionable: true
      },
      {
        id: '2', 
        type: 'action',
        title: 'Practice Recommendation',
        description: 'Voice practice could improve your success rate by 15%',
        priority: 'medium',
        actionable: true
      },
      {
        id: '3',
        type: 'timing',
        title: 'Optimal Contact Window',
        description: 'Tuesday 2-4 PM has highest landlord response rates',
        priority: 'medium',
        actionable: false
      }
    ]);

    // Add welcome message with intelligence
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      type: 'agent',
      text: `🎯 **Premium Intelligence Activated**

I've analyzed current market conditions and your profile. Based on your location and recent activity:

• **Market Status:** Cooling trend (favorable for negotiation)
• **Your Success Rate:** 82% with market data approach
• **Optimal Timing:** Next 2 weeks for maximum impact

**What would you like to negotiate today?**`,
      timestamp: new Date(),
      responseTime: 850
    };

    setMessages([welcomeMessage]);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const startTime = Date.now();
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Simulate premium parallel intelligence processing
      console.log('⚡ Processing with parallel intelligence...');
      
      // Mock parallel processing - replace with actual service
      const response = await simulatePremiumResponse(input);
      const processingTime = Date.now() - startTime;
      
      const agentMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        text: response.text,
        timestamp: new Date(),
        insights: response.insights,
        visualData: response.visualData,
        responseTime: processingTime
      };

      setMessages(prev => [...prev, agentMessage]);
      setResponseTime(processingTime);

      // Show visual dashboard if property analysis
      if (response.visualData) {
        setShowVisualDashboard(true);
      }

      // Update proactive suggestions based on conversation
      updateProactiveSuggestions(input, response);

    } catch (error) {
      console.error('❌ Premium chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        text: '⚠️ I encountered an issue, but I\'m still here to help. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const simulatePremiumResponse = async (userInput: string): Promise<any> => {
    // Simulate parallel processing delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Mock intelligent response based on input
    if (userInput.toLowerCase().includes('rent') || userInput.toLowerCase().includes('negotiate')) {
      return {
        text: `🎯 **Comprehensive Analysis Complete** *(1.2s)*

Based on parallel market intelligence:

**Property Position:** 8% above market average
**Negotiation Probability:** 78% success rate
**Recommended Approach:** Market research + longer lease term
**Potential Savings:** $200-300/month

**Next Steps:**
1. Gather 3 comparable properties showing lower rents
2. Prepare 18-month lease proposal
3. Contact Tuesday afternoon (your highest success time)

**Market Evidence:** Rental prices decreased 3% this month in your area, giving you strong leverage.

*Would you like me to show the visual market analysis?*`,
        insights: {
          confidence: 87,
          probability: 78,
          savings: 250
        },
        visualData: {
          location: 'Austin, TX',
          rent: 2500,
          marketPosition: 'above_market'
        }
      };
    }

    return {
      text: `✨ **Intelligence Processing Complete** *(1.1s)*

I've analyzed your request with comprehensive market data and your personal success patterns. 

How can I provide the most valuable assistance for your rental negotiation needs?

**Quick Options:**
• Analyze a specific property
• Compare multiple properties  
• Practice negotiation conversation
• Get market timing recommendations`,
      insights: {},
      visualData: null
    };
  };

  const updateProactiveSuggestions = (userInput: string, response: any) => {
    // Add contextual suggestions based on conversation
    if (response.visualData) {
      setProactiveSuggestions(prev => [
        {
          id: Date.now().toString(),
          type: 'action',
          title: 'Visual Analysis Available',
          description: 'View comprehensive market dashboard for this property',
          priority: 'high',
          actionable: true
        },
        ...prev.slice(0, 2)
      ]);
    }
  };

  const handleSuggestionClick = (suggestion: ProactiveSuggestion) => {
    if (suggestion.type === 'action' && suggestion.title.includes('Visual')) {
      setShowVisualDashboard(true);
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'insight': return <Brain className="h-4 w-4" />;
      case 'action': return <Target className="h-4 w-4" />;
      case 'timing': return <Clock className="h-4 w-4" />;
      case 'strategy': return <TrendingUp className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getSuggestionColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-blue-500 bg-blue-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Premium Intelligence Chat
              {responseTime && (
                <Badge variant="secondary" className="ml-auto">
                  {responseTime}ms response
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id}>
                  <ChatMessage
                    message={{
                      id: message.id,
                      type: message.type,
                      text: message.text,
                      timestamp: message.timestamp
                    }}
                  />
                  {message.responseTime && (
                    <div className="text-xs text-gray-500 mt-1 ml-2">
                      Processed in {message.responseTime}ms with parallel intelligence
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Processing with premium intelligence...</span>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about negotiation, market analysis, or property comparison..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={isLoading || !input.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Proactive Suggestions Sidebar */}
      <div className="lg:w-80 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Intelligent Suggestions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {proactiveSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={`p-3 rounded-lg border-l-4 cursor-pointer hover:shadow-sm transition-shadow ${getSuggestionColor(suggestion.priority)}`}
                onClick={() => suggestion.actionable && handleSuggestionClick(suggestion)}
              >
                <div className="flex items-start gap-2">
                  {getSuggestionIcon(suggestion.type)}
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{suggestion.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{suggestion.description}</p>
                    {suggestion.actionable && (
                      <Button variant="link" size="sm" className="p-0 h-auto mt-1 text-xs">
                        Take Action →
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {showVisualDashboard && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Visual Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-orange-600">78%</div>
                <div className="text-sm text-gray-600">Negotiation Probability</div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowVisualDashboard(true)}
                  className="w-full"
                >
                  View Full Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Visual Dashboard Modal/Panel */}
      {showVisualDashboard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Visual Intelligence Dashboard</h2>
              <Button variant="ghost" onClick={() => setShowVisualDashboard(false)}>
                ✕
              </Button>
            </div>
            <VisualIntelligenceDashboard 
              propertyData={{ location: 'Austin, TX', rent: 2500 }}
              userContext={userContext}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PremiumChatInterface;