export interface ChatMessage {
  id: string;
  type: 'user' | 'agent';
  text: string;
  timestamp: Date;
}

export interface PromptTemplate {
  id: string;
  name: string;
  systemPrompt: string;
  subPrompts?: {
    id: string;
    trigger: string;
    content: string;
  }[];
}

export interface VoiceService {
  hasApiKey(): Promise<boolean>;
  setApiKey(key: string): Promise<void>;
  getApiKey(): Promise<string | null>;
  setVoice(voiceId: string): void;
  generateSpeech(text: string): Promise<ArrayBuffer>;
  getVoices(): Promise<any[]>;
}

export interface SimulationService {
  simulateResponse(userInput: string): Promise<string>;
}

export interface MarketService {
  getMarketInsights(query: string): Promise<string>;
  getNegotiationAdvice(query: string): Promise<string>;
  analyzeProperty(propertyDetails: {
    address: string;
    zipCode: string;
    bedrooms: number;
    bathrooms: number;
    squareFootage: number;
    price: number;
  }): Promise<any>;
}

export interface AgentService extends VoiceService, SimulationService, MarketService {
  startConversation(): Promise<void>;
  sendMessage(message: string): Promise<string>;
}

export interface PromptService {
  getPromptTemplates(): PromptTemplate[];
  savePromptTemplates(templates: PromptTemplate[]): void;
  addPromptTemplate(template: Omit<PromptTemplate, "id">): PromptTemplate;
  editPromptTemplate(id: string, template: Partial<Omit<PromptTemplate, "id">>): PromptTemplate;
  deletePromptTemplate(id: string): void;
  getPracticeNegotiationPrompt(scenario: string): Promise<string>;
  sendMessageToGemini(message: string, history: ChatMessage[]): Promise<string>;
}

export interface ChatService extends PromptService {}
