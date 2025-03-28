
// This service integrates with the ElevenLabs API for voice-based conversations
// It handles conversation state and API calls

import { getApiKey, hasApiKey, saveApiKey, API_KEYS } from './keyManager';

class AgentService {
  private conversationId: string | null = null;
  private voiceId: string = "21m00Tcm4TlvDq8ikWAM"; // Default voice - Rachel
  private baseUrl: string = "https://api.elevenlabs.io/v1";
  
  constructor() {
    // Constructor stays minimal, keys are handled by keyManager
  }
  
  async setApiKey(key: string): Promise<void> {
    await saveApiKey('ELEVEN_LABS', key);
  }
  
  async hasApiKey(): Promise<boolean> {
    return await hasApiKey('ELEVEN_LABS');
  }
  
  async getApiKey(): Promise<string | null> {
    return await getApiKey('ELEVEN_LABS');
  }
  
  setVoice(voiceId: string): void {
    this.voiceId = voiceId;
  }
  
  // Initialize a conversation with ElevenLabs API
  async startConversation(): Promise<void> {
    if (!(await this.hasApiKey())) {
      throw new Error("API key not set");
    }
    
    try {
      // In a real implementation, this would create a new conversation with the ElevenLabs API
      // For now, we'll just generate a unique conversation ID
      this.conversationId = `conversation-${Date.now()}`;
      console.log("Started conversation with ID:", this.conversationId);
      
      return Promise.resolve();
    } catch (error) {
      console.error("Error starting conversation:", error);
      throw error;
    }
  }
  
  // Send a user message to the ElevenLabs API and get a response
  async sendMessage(message: string): Promise<string> {
    if (!(await this.hasApiKey())) {
      throw new Error("API key not set");
    }
    
    if (!this.conversationId) {
      throw new Error("No active conversation");
    }
    
    console.log("Sending message to ElevenLabs API:", message);
    
    try {
      // For now, we'll use our fallback simulation
      // In a full implementation, this would call the ElevenLabs API
      return this.simulateResponse(message);
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }
  
  // Generate speech using the ElevenLabs API
  async generateSpeech(text: string): Promise<ArrayBuffer> {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error("API key not set");
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/text-to-speech/${this.voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`ElevenLabs API error: ${errorData.detail}`);
      }
      
      return await response.arrayBuffer();
    } catch (error) {
      console.error("Error generating speech:", error);
      throw error;
    }
  }
  
  // Get market insights based on user query
  async getMarketInsights(query: string): Promise<string> {
    if (!(await this.hasApiKey())) {
      throw new Error("API key not set");
    }
    
    try {
      // For now, we'll use our fallback simulation
      // In a real implementation, this would call an API for market data
      return this.simulateMarketResponse(query);
    } catch (error) {
      console.error("Error getting market insights:", error);
      throw error;
    }
  }
  
  // Get negotiation advice based on user query
  async getNegotiationAdvice(query: string): Promise<string> {
    if (!(await this.hasApiKey())) {
      throw new Error("API key not set");
    }
    
    try {
      // For now, we'll use our fallback simulation
      // In a real implementation, this would call an API for negotiation advice
      return this.simulateNegotiationResponse(query);
    } catch (error) {
      console.error("Error getting negotiation advice:", error);
      throw error;
    }
  }
  
  // Simulate negotiation responses for testing
  private simulateResponse(userInput: string): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const lowerInput = userInput.toLowerCase();
        
        // Rent discount mentions
        if (lowerInput.includes("lower rent") || lowerInput.includes("discount") || lowerInput.includes("reduce")) {
          resolve("I understand you're looking for a lower rent. Given the current market conditions, I might be willing to consider a small reduction if you can commit to a longer lease term. Would a 18 or 24-month lease be of interest to you?");
        }
        // Lease length mentions
        else if (lowerInput.includes("lease term") || lowerInput.includes("longer lease")) {
          resolve("A longer lease term would definitely give us more stability. For an 18-month lease, I could offer a 3% discount on the monthly rent, or for a 24-month lease, we could look at a 5% reduction. Would either of those options work for you?");
        }
        // Maintenance or repairs
        else if (lowerInput.includes("repair") || lowerInput.includes("maintenance") || lowerInput.includes("fix")) {
          resolve("Yes, we're committed to maintaining the property in good condition. I can certainly prioritize those repairs before your move-in date. Would you like me to add specific repair requests to the lease agreement?");
        }
        // Security deposit discussions
        else if (lowerInput.includes("security deposit") || lowerInput.includes("deposit")) {
          resolve("Regarding the security deposit, our standard is one month's rent. However, with proof of excellent rental history and credit score, we might be able to reduce that to half a month's rent. Would you be able to provide references from previous landlords?");
        }
        // Amenities or utilities
        else if (lowerInput.includes("utilities") || lowerInput.includes("amenities") || lowerInput.includes("parking")) {
          resolve("While the rent covers the basic amenities, I could consider including the water utility in the monthly rent, which would save you about $40-50 per month. As for parking, we normally charge $75 per month, but I could reduce that to $50 if that would help.");
        }
        // Move-in date flexibility
        else if (lowerInput.includes("move in") || lowerInput.includes("date")) {
          resolve("We do have some flexibility with the move-in date. If you could move in within the next two weeks, I might be able to offer two weeks of free rent to help with your transition. Would an earlier move-in work for your schedule?");
        }
        // Fallback response
        else {
          resolve("That's an interesting perspective. I'd like to find a solution that works for both of us. Could you tell me what specific terms are most important to you in this negotiation?");
        }
      }, 1500);
    });
  }
  
  // Simulate market data responses for testing
  private simulateMarketResponse(userInput: string): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const responses = [
          "Based on current data, rental prices in that area have increased by about 5% over the past year, with a median price of $1,850 for a one-bedroom apartment.",
          "That neighborhood is currently seeing high demand but also increasing supply with several new developments. This might provide some negotiation leverage in the next 3-6 months.",
          "Comparable properties in that area are currently renting for $2.75-$3.25 per square foot, which is slightly above the city average.",
          "The seasonal trends show that winter months (November-February) typically have lower rental prices, with potential savings of 5-8% compared to summer peaks.",
          "That area has a current vacancy rate of approximately 4.2%, which is below the 5% threshold considered a 'balanced' market. This gives landlords some pricing power.",
          "Recent policy changes in that municipality now require landlords to disclose the rental history of units, which can give you valuable information for negotiation."
        ];
        const randomIndex = Math.floor(Math.random() * responses.length);
        resolve(responses[randomIndex]);
      }, 1500);
    });
  }
  
  // Simulate negotiation advice responses for testing
  private simulateNegotiationResponse(userInput: string): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const responses = [
          "A good strategy is to start by expressing genuine interest in the property, then mention 2-3 comparable units with lower prices. This shows you've done your research and have alternatives.",
          "Consider offering a longer lease term in exchange for a lower monthly rent. Many landlords value stability and reduced vacancy risk over maximizing monthly income.",
          "When negotiating, focus on creating a win-win scenario. For example, offering to handle minor repairs yourself in exchange for a rent reduction can benefit both parties.",
          "Timing matters in negotiations. If a unit has been vacant for over 30 days, landlords are typically more willing to negotiate on price or terms.",
          "Don't limit negotiations to just the rent. Security deposits, parking fees, included utilities, and move-in dates are all negotiable terms that can save you money.",
          "Practice active listening during negotiations. Often, landlords will reveal their priorities or concerns, giving you valuable information about what concessions might be most effective."
        ];
        const randomIndex = Math.floor(Math.random() * responses.length);
        resolve(responses[randomIndex]);
      }, 1500);
    });
  }
}

export const agentService = new AgentService();
