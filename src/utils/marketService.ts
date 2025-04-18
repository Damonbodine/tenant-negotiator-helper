
import { supabase } from '@/integrations/supabase/client';

export const marketService = {
  async getMarketInsights(query: string): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
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

Always prioritize accuracy and clarity in your market analysis.`
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
      }

      return data?.text || "Market data not available at the moment.";
    } catch (error) {
      console.error("Error getting market insights:", error);
      throw error;
    }
  },

  async getNegotiationAdvice(query: string): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
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

Remember to balance assertiveness with professionalism in all negotiation advice.`
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
      console.log("Sending property details to rental-analysis function:", propertyDetails);
      
      const { data, error } = await supabase.functions.invoke('rental-analysis', {
        body: { propertyDetails }
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
