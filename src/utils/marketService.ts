import { supabase } from '@/integrations/supabase/client';

export const marketService = {
  async getMarketInsights(query: string): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('market-insights', {
        body: { query }
      });

      if (error) throw error;
      return data?.insights || "Market data not available at the moment.";
    } catch (error) {
      console.error("Error getting market insights:", error);
      throw error;
    }
  },

  async getNegotiationAdvice(query: string): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('negotiation-advice', {
        body: { query }
      });

      if (error) throw error;
      return data?.advice || "Negotiation advice not available at the moment.";
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
  }) {
    try {
      const { data, error } = await supabase.functions.invoke('rental-analysis', {
        body: { propertyDetails }
      });

      if (error) throw error;
      return data?.analysis || null;
    } catch (error) {
      console.error("Error analyzing property:", error);
      throw error;
    }
  }
};
