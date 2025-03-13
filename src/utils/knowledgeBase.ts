
// Knowledge base for rent negotiation data
// This simulates a database of negotiation knowledge that could be expanded with real data

export interface KnowledgeItem {
  id: string;
  category: 'tactics' | 'marketData' | 'legalRights' | 'scripts' | 'questions';
  title: string;
  content: string;
  tags: string[];
  source?: string; // Optional URL source
}

export interface ExternalSource {
  id: string;
  name: string;
  url: string;
  type: 'website' | 'marketData';
  lastFetched?: string;
  status: 'active' | 'pending' | 'error';
  description?: string;
}

// Initial knowledge base with sample data
const knowledgeItems: KnowledgeItem[] = [
  {
    id: 'tactic-1',
    category: 'tactics',
    title: 'Emphasize Tenant Reliability',
    content: 'Present yourself as a reliable tenant with stable income, good credit score, and rental history. Landlords value dependability over slightly higher rent from potentially problematic tenants.',
    tags: ['positioning', 'reliability', 'introduction']
  },
  {
    id: 'tactic-2',
    category: 'tactics',
    title: 'Longer Lease for Lower Rent',
    content: 'Offer to sign a longer lease (18-24 months) in exchange for a lower monthly rent. This provides landlords with stability and reduced vacancy risk.',
    tags: ['lease length', 'stability', 'monthly discount']
  },
  {
    id: 'market-1',
    category: 'marketData',
    title: 'Seasonal Timing Impact',
    content: 'Rental prices typically drop 2-5% during winter months (November-February) in most markets, as fewer people move during cold weather and holidays.',
    tags: ['seasonality', 'timing', 'market trends']
  },
  {
    id: 'market-2',
    category: 'marketData',
    title: 'Vacancy Rate Leverage',
    content: 'Areas with vacancy rates above 7% typically have more negotiable rent prices. Each percentage above 7% correlates with approximately 1-3% more negotiation flexibility.',
    tags: ['vacancy', 'market conditions', 'leverage points']
  },
  {
    id: 'legal-1',
    category: 'legalRights',
    title: 'Rent Control Protections',
    content: 'In rent-controlled areas, there are strict limits on rent increases (typically 2-5% annually). Research if your target location has rent control before negotiating.',
    tags: ['rent control', 'regulations', 'tenant rights']
  },
  {
    id: 'legal-2',
    category: 'legalRights',
    title: 'Security Deposit Limits',
    content: "Many states limit security deposits to 1-2 months' rent. Knowing this can prevent landlords from requiring excessive deposits.",
    tags: ['security deposit', 'regulations', 'tenant rights']
  },
  {
    id: 'script-1',
    category: 'scripts',
    title: 'Negotiating Rent Reduction',
    content: "I appreciate the property and would like to make it my home. I've researched similar units in this area that are going for [lower price]. Would you consider [specific amount] to match the market rate? I'm a reliable tenant with excellent references and would sign a 12-month lease immediately.",
    tags: ['rent reduction', 'negotiation script', 'market comparison']
  },
  {
    id: 'script-2',
    category: 'scripts',
    title: 'Requesting Property Improvements',
    content: "I'm very interested in the apartment but noticed [specific issues]. If you're able to address these before move-in, I'd be happy to sign a lease at the asking price. Alternatively, I could handle these improvements myself for a rent reduction of [amount] per month.",
    tags: ['property improvements', 'negotiation script', 'value exchange']
  },
  {
    id: 'question-1',
    category: 'questions',
    title: 'Maintenance Responsibility',
    content: "Could you clarify the maintenance policy? Specifically, who is responsible for [specific maintenance issues] and what's the typical response time for repairs?",
    tags: ['maintenance', 'important questions', 'responsibilities']
  },
  {
    id: 'question-2',
    category: 'questions',
    title: 'Rent Increase Policy',
    content: 'What has been your typical annual rent increase for tenants who renew their lease? Are increases standardized or determined case-by-case?',
    tags: ['future costs', 'important questions', 'planning ahead']
  },
];

// Sample external sources
const externalSources: ExternalSource[] = [
  {
    id: 'source-1',
    name: 'Rent Data NYC',
    url: 'https://www.rentdata.org/new-york-ny-hud-metro-area/2023',
    type: 'marketData',
    lastFetched: '2023-11-01',
    status: 'active',
    description: 'Official HUD Fair Market Rent data for New York'
  },
  {
    id: 'source-2',
    name: 'RentCafe Market Insights',
    url: 'https://www.rentcafe.com/market-trends/',
    type: 'marketData',
    lastFetched: '2023-10-15',
    status: 'active',
    description: 'Current market trends and analysis for rental properties'
  }
];

class KnowledgeBaseService {
  private items: KnowledgeItem[] = knowledgeItems;
  private sources: ExternalSource[] = externalSources;

  // Get all knowledge items
  getAllItems(): KnowledgeItem[] {
    return this.items;
  }

  // Get items by category
  getItemsByCategory(category: KnowledgeItem['category']): KnowledgeItem[] {
    return this.items.filter(item => item.category === category);
  }

  // Search knowledge base by query string
  searchItems(query: string): KnowledgeItem[] {
    const normalizedQuery = query.toLowerCase();
    return this.items.filter(item =>
      item.title.toLowerCase().includes(normalizedQuery) ||
      item.content.toLowerCase().includes(normalizedQuery) ||
      item.tags.some(tag => tag.toLowerCase().includes(normalizedQuery))
    );
  }

  // Add an item to the knowledge base
  addItem(item: Omit<KnowledgeItem, 'id'>): KnowledgeItem {
    const newItem = {
      ...item,
      id: `${item.category}-${this.items.length + 1}`
    };
    this.items.push(newItem);
    return newItem;
  }

  // Get all external sources
  getAllSources(): ExternalSource[] {
    return this.sources;
  }

  // Get sources by type
  getSourcesByType(type: ExternalSource['type']): ExternalSource[] {
    return this.sources.filter(source => source.type === type);
  }

  // Add a new external source
  addSource(source: Omit<ExternalSource, 'id' | 'status'>): ExternalSource {
    const newSource = {
      ...source,
      id: `source-${this.sources.length + 1}`,
      status: 'pending' as const,
      lastFetched: new Date().toISOString()
    };
    this.sources.push(newSource);
    return newSource;
  }

  // Update source status
  updateSourceStatus(id: string, status: ExternalSource['status']): ExternalSource | null {
    const source = this.sources.find(s => s.id === id);
    if (!source) return null;
    
    source.status = status;
    if (status === 'active') {
      source.lastFetched = new Date().toISOString();
    }
    
    return source;
  }

  // Delete a source
  deleteSource(id: string): boolean {
    const initialLength = this.sources.length;
    this.sources = this.sources.filter(source => source.id !== id);
    return this.sources.length < initialLength;
  }

  // Simulate fetching data from a source
  async fetchDataFromSource(id: string): Promise<boolean> {
    // In a real implementation, this would actually fetch data from the URL
    const source = this.sources.find(s => s.id === id);
    if (!source) return false;
    
    // Simulate an async operation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Update the source status
    source.status = 'active';
    source.lastFetched = new Date().toISOString();
    
    // In a real implementation, we would parse the fetched data
    // and add it to the knowledge base
    // For now, we'll just simulate adding a new knowledge item
    if (source.type === 'marketData') {
      this.addItem({
        category: 'marketData',
        title: `Data from ${source.name}`,
        content: `This data was automatically extracted from ${source.url} on ${new Date().toLocaleDateString()}.`,
        tags: ['imported', 'market data', source.name.toLowerCase()]
      });
    } else {
      this.addItem({
        category: 'tactics',
        title: `Tactic from ${source.name}`,
        content: `This tactic was automatically extracted from ${source.url} on ${new Date().toLocaleDateString()}.`,
        tags: ['imported', 'website', source.name.toLowerCase()],
        source: source.url
      });
    }
    
    return true;
  }

  // Find knowledge response for user message
  findResponseForQuery(userMessage: string): string | null {
    const relevantItems = this.searchItems(userMessage.toLowerCase());
    
    if (relevantItems.length === 0) {
      return null;
    }
    
    // Return the most relevant response (first match for now)
    // In a more sophisticated implementation, this would use better matching logic
    return relevantItems[0].content;
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();
