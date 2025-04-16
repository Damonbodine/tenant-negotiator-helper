
import { voiceClient } from './voiceClient';
import { simulationService } from './simulationService';
import { marketService } from './marketService';

class AgentService {
  private conversationId: string | null = null;

  async startConversation(): Promise<void> {
    if (!(await voiceClient.hasApiKey())) {
      throw new Error("API key not set");
    }
    
    try {
      this.conversationId = `conversation-${Date.now()}`;
      console.log("Started conversation with ID:", this.conversationId);
      return Promise.resolve();
    } catch (error) {
      console.error("Error starting conversation:", error);
      throw error;
    }
  }
  
  async sendMessage(message: string): Promise<string> {
    if (!(await voiceClient.hasApiKey())) {
      throw new Error("API key not set");
    }
    
    if (!this.conversationId) {
      await this.startConversation();
    }
    
    return simulationService.simulateResponse(message);
  }
}

// Combine all services into one exported object
export const agentService = {
  ...new AgentService(),
  ...voiceClient,
  ...simulationService,
  ...marketService
};

