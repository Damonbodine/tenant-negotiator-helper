
// This service integrates with the ElevenLabs API for voice-based conversations
// It handles API key management, conversation state, and API calls

class AgentService {
  private apiKey: string | null = null;
  private conversationId: string | null = null;
  private voiceId: string = "21m00Tcm4TlvDq8ikWAM"; // Default voice - Rachel
  
  constructor() {
    // Try to load API key from localStorage on initialization
    this.apiKey = localStorage.getItem("elevenlabs_api_key");
  }
  
  setApiKey(key: string): void {
    this.apiKey = key;
    localStorage.setItem("elevenlabs_api_key", key);
  }
  
  hasApiKey(): boolean {
    return !!this.apiKey;
  }
  
  getApiKey(): string | null {
    return this.apiKey;
  }
  
  setVoice(voiceId: string): void {
    this.voiceId = voiceId;
  }
  
  // In a complete implementation, this would initialize a conversation with ElevenLabs API
  async startConversation(): Promise<void> {
    if (!this.apiKey) {
      throw new Error("API key not set");
    }
    
    // In a real implementation, this would create a new conversation with the ElevenLabs API
    this.conversationId = `conversation-${Date.now()}`;
    console.log("Started conversation with ID:", this.conversationId);
    
    // Implementation would initialize the voice chat session
    return Promise.resolve();
  }
  
  // This would send a user message to the ElevenLabs API and get a response
  async sendMessage(message: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error("API key not set");
    }
    
    if (!this.conversationId) {
      throw new Error("No active conversation");
    }
    
    console.log("Sending message to ElevenLabs API:", message);
    
    // This is a simulated response - in a real implementation, this would call the ElevenLabs API
    return this.simulateResponse(message);
  }
  
  // This would generate speech using the ElevenLabs API
  async generateSpeech(text: string): Promise<ArrayBuffer> {
    if (!this.apiKey) {
      throw new Error("API key not set");
    }
    
    console.log("Would generate speech with ElevenLabs API:", text);
    
    // In a real implementation, this would call the ElevenLabs Text-to-Speech API
    // For now, return an empty ArrayBuffer
    return new ArrayBuffer(0);
  }
  
  // Simulate negotiation responses
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
}

export const agentService = new AgentService();
