
import { supabase } from '@/integrations/supabase/client';

export const marketService = {
  async getMarketInsights(query: string): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: { 
          message: query,
          history: [],
          systemPrompt: "You are a rental market expert. Focus on providing accurate, data-driven insights about rental markets, pricing trends, and neighborhood information. Keep your responses concise, factual, and helpful for renters making decisions."
        }
      });

      if (error) throw error;
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
          systemPrompt: "You are a rental negotiation expert. Provide tactical, practical advice to help renters negotiate better terms and prices. Be specific about negotiation strategies, timing, leverage points, and communication techniques. Keep advice actionable and realistic."
        }
      });

      if (error) throw error;
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
