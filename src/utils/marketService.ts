import { supabase } from '@/integrations/supabase/client';

export const marketService = {
  async getMarketInsights(query: string): Promise<string> {
    try {
      console.log("🚀 Market Service: Using premium intelligence for faster analysis...");
      
      // Get current user for memory context
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      // Try to extract property context from the query
      const propertyContext = extractPropertyContext(query);

      // PREMIUM INTELLIGENCE: Use enhanced function with parallel processing
      const { data, error } = await supabase.functions.invoke('chat-ai-enhanced', {
        body: { 
          message: query,
          history: [],
          systemPrompt: `You are a rental market expert focused on providing data-driven insights. 

Your task:
- Provide accurate, factual information about rental markets and pricing trends
- Use clear, concise language with specific numbers and percentages when available
- Include neighborhood-specific information when relevant
- Organize your response with short paragraphs and bullet points for readability
- Focus on helping renters make informed decisions with actionable insights
- Keep responses under 250 words

Always prioritize accuracy and clarity in your market analysis.`,
          context: {
            userId: userId,
            chatType: 'market_analysis',
            propertyContext: propertyContext
          }
        }
      });

      if (error) {
        console.error("Supabase function error:", error);
        throw error;
      }
      
      if (!data) {
        console.error("No data returned from AI service");
        throw new Error("No response data received");
      }
      
      // Log model information if available
      if (data.model) {
        console.log(`Market insights generated using model: ${data.model}`);
        console.log(`Memory storage: ${data.storedInMemory ? 'YES' : 'NO'}`);
        console.log(`Memory context: ${data.hasMemory ? 'YES' : 'NO'}`);
        console.log(`Property context: ${propertyContext ? 'YES' : 'NO'}`);
      }

      return data?.text || "Market data not available at the moment.";
    } catch (error) {
      console.error("Error getting market insights:", error);
      throw error;
    }
  },

  async getNegotiationAdvice(query: string): Promise<string> {
    try {
      // Get current user for memory context
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      // Try to extract property context from the query
      const propertyContext = extractPropertyContext(query);

      const { data, error } = await supabase.functions.invoke('chat-ai-enhanced', {
        body: { 
          message: query,
          history: [],
          systemPrompt: `You are a rental negotiation expert specializing in practical advice for renters.

Your task:
- Provide tactical, step-by-step negotiation strategies tailored to renters
- Focus on actionable techniques that work in real-world scenarios
- Include specific scripts and language that renters can use verbatim
- Cover timing strategies, leverage points, and communication approaches
- Adapt advice based on current market conditions (hot vs. cool markets)
- Keep responses under 300 words with clearly formatted sections

Remember to balance assertiveness with professionalism in all negotiation advice.`,
          context: {
            userId: userId,
            chatType: 'negotiation_help',
            propertyContext: propertyContext
          }
        }
      });

      if (error) {
        console.error("Supabase function error:", error);
        throw error;
      }
      
      if (!data) {
        console.error("No data returned from AI service");
        throw new Error("No response data received");
      }
      
      // Log model information if available
      if (data.model) {
        console.log(`Negotiation advice generated using model: ${data.model}`);
        console.log(`Memory storage: ${data.storedInMemory ? 'YES' : 'NO'}`);
        console.log(`Memory context: ${data.hasMemory ? 'YES' : 'NO'}`);
        console.log(`Property context: ${propertyContext ? 'YES' : 'NO'}`);
      }

      return data?.text || "Negotiation advice not available at the moment.";
    } catch (error) {
      console.error("Error getting negotiation advice:", error);
      throw error;
    }
  },

  async analyzeProperty(propertyDetails: {
    address: string;
    zipCode: string;
    bedrooms: number;
    bathrooms: number;
    squareFootage: number;
    price: number;
    propertyType: string;
  }) {
    try {
      console.log("🚀 PREMIUM PROPERTY ANALYSIS: Using parallel intelligence...");
      console.log("Property details:", propertyDetails);
      
      // Get current user for personalization
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      // Format property details into a comprehensive query
      const propertyQuery = `Analyze this rental property for negotiation potential:

**Property Details:**
- Address: ${propertyDetails.address}, ${propertyDetails.zipCode}
- Size: ${propertyDetails.bedrooms}BR/${propertyDetails.bathrooms}BA, ${propertyDetails.squareFootage} sqft
- Type: ${propertyDetails.propertyType}
- Listed Price: $${propertyDetails.price}/month

Please provide:
1. Market position analysis (above/below/at market)
2. Negotiation probability and potential savings
3. Specific leverage points for this property
4. Recommended negotiation strategy
5. Market timing considerations`;

      // PREMIUM: Use chat-ai-enhanced with parallel processing instead of rental-analysis
      const { data, error } = await supabase.functions.invoke('chat-ai-enhanced', {
        body: { 
          message: propertyQuery,
          history: [],
          systemPrompt: `You are a premium rental market analyst with access to comprehensive market data.

**ANALYSIS REQUIREMENTS:**
- Provide specific, actionable insights with confidence scores
- Include exact dollar amounts and percentages when possible  
- Reference comparable properties and market trends
- Give clear negotiation recommendations with success probability
- Format response with clear sections and bullet points
- Keep analysis comprehensive but under 400 words

**RESPONSE FORMAT:**
Market Position: [above/below/at market with %]
Negotiation Probability: [X% with reasoning]
Potential Savings: $[amount] ([X]% reduction)
Key Leverage Points: [3-4 specific points]
Recommended Strategy: [specific approach]
Timing: [best time to negotiate]`,
          context: {
            userId: userId,
            chatType: 'property_analysis',
            propertyContext: propertyDetails
          },
          enableToolCalling: true,
          availableTools: ['get_rent_predictions', 'get_market_data', 'search_knowledge_base']
        }
      });

      if (error) {
        console.error("Supabase function error:", error);
        throw error;
      }

      if (!data) {
        throw new Error("No data returned from analysis service");
      }
      
      return data?.analysis || null;
    } catch (error) {
      console.error("Error analyzing property:", error);
      throw error;
    }
  }
};

// Helper function to extract property context from user queries
function extractPropertyContext(query: string): any {
  const context: any = {};
  
  // Extract rent amounts (both current and target)
  const rentMatches = query.match(/\$?(\d{1,2}),?(\d{3})/g);
  if (rentMatches && rentMatches.length >= 1) {
    // Remove $ and commas, convert to cents
    const amounts = rentMatches.map(match => parseInt(match.replace(/[$,]/g, '')) * 100);
    context.rent = Math.max(...amounts); // Assume highest is current rent
    if (amounts.length > 1) {
      context.targetRent = Math.min(...amounts); // Assume lowest is target
    }
  }
  
  // Extract bedroom count
  const bedroomMatch = query.match(/(\d+)\s*(?:br|bedroom|bed)/i);
  if (bedroomMatch) {
    context.bedrooms = parseInt(bedroomMatch[1]);
  }
  
  // Extract address/location
  const locationPatterns = [
    /(?:at|on|in)\s+([^\,\.\?\!]+)/i,
    /(\d+\s+[^,\.\?\!]+(?:st|street|ave|avenue|rd|road|blvd|boulevard|way|ln|lane))/i,
    /(san francisco|sf|oakland|berkeley|[a-z]+\s+[a-z]+)/i
  ];
  
  for (const pattern of locationPatterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      context.address = match[1].trim();
      break;
    }
  }
  
  // Only return context if we found something meaningful
  return Object.keys(context).length > 0 ? context : null;
}
