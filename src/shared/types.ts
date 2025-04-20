
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
  simulateResponse(userInput: string): Promise<any>;
}

export interface MarketService {
  getMarketInsights(query: string): Promise<any>;
  getNegotiationAdvice(query: string): Promise<any>;
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

export interface PropertyDetails {
  address: string;
  zipCode: string;
  bedrooms: number;
  bathrooms: number;
  price: number;
  propertyType: string;
  squareFootage: number;
  url?: string;
}

export interface Comparable {
  address: string;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  propertyType: string;
  distance: number;
  url: string;
  squareFootage: number | null;
}

export interface AnalysisResult {
  subjectProperty: PropertyDetails;
  averagePrice: number;
  higherPriced: number;
  lowerPriced: number;
  totalComparables: number;
  comparables: Comparable[];
  priceRank: number | null;
  priceAssessment: string;
  negotiationStrategy: string;
}
