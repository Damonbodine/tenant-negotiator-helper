
import { supabase } from '@/integrations/supabase/client';

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

// Default prompt templates
const defaultPromptTemplates: PromptTemplate[] = [
  {
    id: 'rental-market',
    name: 'Rental Market Expert',
    systemPrompt: "You're a rental market expert assistant. Your goal is to help users understand rental market trends, pricing strategies, and provide data-driven advice to help them get the best rental deals. Keep responses concise and practical. Focus on rental market data.",
    subPrompts: [
      {
        id: 'pricing',
        trigger: 'pricing',
        content: "When discussing pricing, include information about average rent in the area, price trends over time, and factors that influence pricing such as location, amenities, and market conditions."
      },
      {
        id: 'negotiation',
        trigger: 'negotiate',
        content: "For negotiation advice, recommend specific tactics based on market conditions. In hot markets, focus on non-monetary benefits. In cooler markets, suggest asking for rent reductions or concessions."
      },
      {
        id: 'timing',
        trigger: 'when',
        content: "When discussing timing for rentals, explain the seasonal trends, with winter usually being cheaper and summer more expensive due to higher demand."
      }
    ]
  },
  {
    id: 'negotiation-coach',
    name: 'Negotiation Coach',
    systemPrompt: "You're a rental negotiation coach. Your goal is to help users prepare for and conduct successful negotiations with landlords. Provide tactical advice, scripts, and strategies to help secure better rental terms.",
    subPrompts: [
      {
        id: 'scripts',
        trigger: 'script',
        content: "When asked for scripts, provide word-for-word examples of what to say in specific negotiation scenarios, with alternatives for different landlord responses."
      },
      {
        id: 'preparation',
        trigger: 'prepare',
        content: "For preparation advice, recommend researching comparable properties, understanding the landlord's possible pain points, and having data ready to support your position."
      }
    ]
  }
];

// Load prompt templates from localStorage or use defaults
const getPromptTemplates = (): PromptTemplate[] => {
  try {
    const savedTemplates = localStorage.getItem('promptTemplates');
    return savedTemplates ? JSON.parse(savedTemplates) : defaultPromptTemplates;
  } catch (error) {
    console.error('Error loading prompt templates:', error);
    return defaultPromptTemplates;
  }
};

// Save prompt templates to localStorage
const savePromptTemplates = (templates: PromptTemplate[]): void => {
  try {
    localStorage.setItem('promptTemplates', JSON.stringify(templates));
  } catch (error) {
    console.error('Error saving prompt templates:', error);
  }
};

let activePromptTemplateId = 'rental-market';

export const chatService = {
  async sendMessageToGemini(message: string, history: ChatMessage[]): Promise<string> {
    try {
      console.log("Sending message to Gemini:", message);
      console.log("With history:", history);
      
      // Get active prompt template
      const templates = getPromptTemplates();
      const activeTemplate = templates.find(t => t.id === activePromptTemplateId) || templates[0];
      
      // Check if any sub-prompts should be activated
      const activatedSubPrompts = activeTemplate.subPrompts?.filter(
        sp => message.toLowerCase().includes(sp.trigger.toLowerCase())
      ) || [];
      
      // Apply sub-prompts to the system prompt if needed
      let enhancedSystemPrompt = activeTemplate.systemPrompt;
      if (activatedSubPrompts.length > 0) {
        enhancedSystemPrompt += "\n\nAdditional context: " + 
          activatedSubPrompts.map(sp => sp.content).join("\n\n");
      }
      
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: { 
          message, 
          history,
          systemPrompt: enhancedSystemPrompt
        },
      });

      if (error) {
        console.error('Error calling Gemini API:', error);
        throw new Error('Failed to get response from AI service');
      }

      console.log("Response from Gemini:", data);
      
      if (!data || !data.text) {
        console.error('Invalid response from Gemini API:', data);
        throw new Error('Received an invalid response from the AI service');
      }

      return data.text;
    } catch (error) {
      console.error('Error in sendMessageToGemini:', error);
      throw error;
    }
  },
  
  // Methods to manage prompt templates
  getPromptTemplates,
  savePromptTemplates,
  
  setActivePromptTemplate(templateId: string): void {
    activePromptTemplateId = templateId;
  },
  
  getActivePromptTemplateId(): string {
    return activePromptTemplateId;
  },
  
  addPromptTemplate(template: Omit<PromptTemplate, 'id'>): PromptTemplate {
    const templates = this.getPromptTemplates();
    const newTemplate = {
      ...template,
      id: Date.now().toString(),
      subPrompts: template.subPrompts || []
    };
    
    templates.push(newTemplate);
    this.savePromptTemplates(templates);
    return newTemplate;
  },
  
  updatePromptTemplate(template: PromptTemplate): void {
    const templates = this.getPromptTemplates();
    const index = templates.findIndex(t => t.id === template.id);
    
    if (index !== -1) {
      templates[index] = template;
      this.savePromptTemplates(templates);
    }
  },
  
  deletePromptTemplate(templateId: string): void {
    const templates = this.getPromptTemplates();
    const filteredTemplates = templates.filter(t => t.id !== templateId);
    
    this.savePromptTemplates(filteredTemplates);
    
    // If active template was deleted, set first available as active
    if (activePromptTemplateId === templateId && filteredTemplates.length > 0) {
      activePromptTemplateId = filteredTemplates[0].id;
    }
  }
};
