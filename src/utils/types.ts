
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
