import { supabase } from '../integrations/supabase/client';
import negotiationTips from '../../negotiation_tips.json';
import marketInsights from '../../market_insights.json';

interface KnowledgeEntry {
  content: string;
  source: string;
  metadata: Record<string, any>;
  chat_type: string;
}

export class KnowledgeBasePopulator {
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: text,
          model: 'text-embedding-3-small',
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  private async insertKnowledgeEntry(entry: KnowledgeEntry, embedding: number[]) {
    const { error } = await supabase
      .from('knowledge_base')
      .insert({
        content: entry.content,
        source: entry.source,
        embedding: `[${embedding.join(',')}]`,
        metadata: entry.metadata,
        chat_type: entry.chat_type,
      });

    if (error) {
      console.error('Error inserting knowledge entry:', error);
      throw error;
    }
  }

  async populateNegotiationTips(): Promise<void> {
    console.log('Populating negotiation tips...');
    
    const entries: KnowledgeEntry[] = Object.entries(negotiationTips).map(([key, tip]) => ({
      content: `${key}: ${tip}`,
      source: 'negotiation_tips.json',
      metadata: {
        category: key,
        type: 'negotiation_strategy',
        original_key: key,
      },
      chat_type: 'negotiation',
    }));

    for (const entry of entries) {
      try {
        const embedding = await this.generateEmbedding(entry.content);
        await this.insertKnowledgeEntry(entry, embedding);
        console.log(`Inserted: ${entry.metadata.category}`);
      } catch (error) {
        console.error(`Failed to insert ${entry.metadata.category}:`, error);
      }
    }
  }

  async populateMarketInsights(): Promise<void> {
    console.log('Populating market insights...');
    
    const entries: KnowledgeEntry[] = Object.entries(marketInsights).map(([location, insight]) => ({
      content: `${location} Market Insight: ${insight}`,
      source: 'market_insights.json',
      metadata: {
        location,
        type: 'market_data',
        geographic_focus: location,
      },
      chat_type: 'market_analysis',
    }));

    for (const entry of entries) {
      try {
        const embedding = await this.generateEmbedding(entry.content);
        await this.insertKnowledgeEntry(entry, embedding);
        console.log(`Inserted: ${entry.metadata.location}`);
      } catch (error) {
        console.error(`Failed to insert ${entry.metadata.location}:`, error);
      }
    }
  }

  async populateKnowledgeBaseFromFiles(): Promise<void> {
    try {
      console.log('Starting knowledge base population...');
      
      // Check if data already exists
      const { data: existingData, error: checkError } = await supabase
        .from('knowledge_base')
        .select('id')
        .limit(1);

      if (checkError) {
        console.error('Error checking existing data:', checkError);
        throw checkError;
      }

      if (existingData && existingData.length > 0) {
        console.log('Knowledge base already populated. Skipping...');
        return;
      }

      await this.populateNegotiationTips();
      await this.populateMarketInsights();
      
      console.log('Knowledge base population complete!');
    } catch (error) {
      console.error('Error populating knowledge base:', error);
      throw error;
    }
  }

  async clearKnowledgeBase(): Promise<void> {
    const { error } = await supabase
      .from('knowledge_base')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (error) {
      console.error('Error clearing knowledge base:', error);
      throw error;
    }

    console.log('Knowledge base cleared successfully');
  }

  async searchKnowledgeBase(query: string, chatType?: string, limit: number = 5): Promise<any[]> {
    try {
      const embedding = await this.generateEmbedding(query);
      
      let rpcQuery = supabase.rpc('search_knowledge_base', {
        query_embedding: `[${embedding.join(',')}]`,
        match_threshold: 0.7,
        match_count: limit,
      });

      if (chatType) {
        rpcQuery = rpcQuery.eq('chat_type', chatType);
      }

      const { data, error } = await rpcQuery;

      if (error) {
        console.error('Error searching knowledge base:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in knowledge base search:', error);
      throw error;
    }
  }
}

export const knowledgeBasePopulator = new KnowledgeBasePopulator();