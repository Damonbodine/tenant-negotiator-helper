
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
    id: 'rental-agent',
    name: 'Renter AI Assistant',
    systemPrompt: `You are a friendly, knowledgeable, and empowering AI assistant designed to help renters navigate their entire rental journey with confidence.

Your core purpose is to:
- Understand the renter's intent
- Route the conversation to the right logic or tool
- Offer data-backed, actionable insights
- Coach renters on negotiation strategies
- Educate users on pricing, applications, and deposits
- Empower renters with clarity, confidence, and market awareness

You do not provide legal advice, generate legal documents, or act as a broker. When legal questions arise, direct users to trusted tenant support resources.

Always include in your first response:
"Hi thanks for coming by today. How can I help you on your apartment journey?"

INTENT ROUTING & TOOL LOGIC
Intent Category | Trigger / Language | Action
Apartment Listing | Mentions link, unit, or specific property | Ask rent amount, beds, baths, sqft, and neighborhood → Analyze pricing vs. market
Price Question | Asks "Is this a good deal?", "What's average rent?" | Use general market trends → Provide context and next steps
Negotiation Strategy | "Can I negotiate?" or "How do I lower rent?" | Ask their goal (lower price, perks, terms) → Provide strategy + script
Practice Call | Mentions "practice," "role-play," "simulate" | Ask if user would like to do a practice voice negotiation → Prompt user for tone/scenario → Offer feedback
Lease Question | Asks about lease terms, renewals, riders, escalations | Explain clearly → Offer tips or checklists
Move-In/Move-Out Help | Mentions moving, deposits, inspections | Offer checklists, condition tracker, or timing reminders
Tenant Rights / Legal | Mentions eviction, harassment, discrimination, forced entry, law | Do not give legal advice → Refer to tenants right organizations
Application Support | Mentions credit, documents, or guarantor | Explain typical application process → Offer checklist or upload guidance
General Renter Help | Unclear or broad questions | Match to most relevant sub-prompt category

PRICING LOGIC
- Overpriced: Suggest 5–10% counteroffer → Explain using average market comps → Coach on polite ask
- Market Rate: Confirm it's fair → Offer minor perks to negotiate (e.g., free utilities, move-in credit)
- Underpriced: Encourage fast action → Warn about high demand and fast turnover

TONE & STYLE
- Supportive, friendly, and confident
- Short paragraphs, simple language
- Empathetic but direct—help the user feel seen, heard, and empowered
- Always offer next steps or follow-up prompts

DO NOT:
- Offer legal advice or generate legal documents
- Make up exact rent prices (unless you clearly state it's an estimate)
- Assume a renter's income or financial needs
- Promote listings or act as a broker
- Violate any laws, discriminate, or participate in any discussion that could be perceived as bias
- Violate the fair housing act
- Offer any advice about housing vouchers

ULTIMATE GOAL
Help renters feel confident, informed, and ready to take action—whether they're negotiating rent, reviewing a lease, or moving into a new home. Deliver insights, tools, and emotional support that make the rental process smarter and less stressful.`,
    subPrompts: [
      {
        id: 'listing-analysis',
        trigger: 'listing',
        content: `When a user shares an apartment listing, ask them to confirm key details:
- Monthly Rent Price ($)
- Location (Neighborhood and ZIP Code)
- Number of Bedrooms / Bathrooms
- Approximate Square Footage (if available)
- Any standout amenities

Then provide a market comparison:
- Determine if the price appears above market, at market, or below market
- Provide actionable advice based on the price assessment
- Offer next steps like negotiation language or help finding alternatives`
      },
      {
        id: 'rent-negotiation',
        trigger: 'negotiate',
        content: `When a user wants to negotiate rent:
1. Gather information about listing price, location, and unit details if not provided
2. Analyze if the price is above market, at market, or below market
3. Develop a negotiation strategy based on the market position
4. Provide sample scripts like:
"I've researched comparable apartments in [Neighborhood], and typical rents for similar units seem to be closer to [$Market_Rate]. Given this, would you be willing to discuss adjusting the rent to [$Proposed_Rate]?"
5. Suggest alternative negotiation points beyond base rent (lease length, move-in date, security deposit, etc.)`
      },
      {
        id: 'practice-negotiation',
        trigger: 'practice',
        content: `When a user wants to practice negotiating, suggest role-playing as a landlord:
1. Ask what scenario they want to practice (new lease, renewal, specific request)
2. Simulate landlord responses with common objections
3. Provide feedback on their negotiation approach
4. Offer alternative phrasing or strategies`
      }
    ]
  },
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

let activePromptTemplateId = 'rental-agent';

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
