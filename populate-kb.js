// Script to populate knowledge base
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://izzdyfrcxunfzlfgdjuv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6emR5ZnJjeHVuZnpsZmdkanV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMDIzMDgsImV4cCI6MjA1ODc3ODMwOH0.rLBqA9Ok3tKPx90Hgvf9bTx0rUjJWcMj2a-SRy_sA8M';

// You'll need to set your OpenAI API key here
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'your-openai-key-here';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Load JSON files
const negotiationTips = JSON.parse(fs.readFileSync('./negotiation_tips.json', 'utf8'));
const marketInsights = JSON.parse(fs.readFileSync('./market_insights.json', 'utf8'));

async function generateEmbedding(text) {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
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

async function insertKnowledgeEntry(content, source, metadata, chatType, embedding) {
  const { error } = await supabase
    .from('knowledge_base')
    .insert({
      content,
      source,
      embedding: JSON.stringify(embedding),
      metadata,
      chat_type: chatType,
    });

  if (error) {
    console.error('Error inserting knowledge entry:', error);
    throw error;
  }
}

async function populateKnowledgeBase() {
  console.log('🚀 Starting knowledge base population...');
  
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-openai-key-here') {
    console.error('❌ Please set your OPENAI_API_KEY environment variable');
    return;
  }
  
  // Check if data already exists
  const { data: existingData, error: checkError } = await supabase
    .from('knowledge_base')
    .select('id')
    .limit(1);

  if (checkError) {
    console.error('Error checking existing data:', checkError);
    return;
  }

  if (existingData && existingData.length > 0) {
    console.log('📚 Knowledge base already populated. Clearing first...');
    
    // Clear existing data
    const { error: deleteError } = await supabase
      .from('knowledge_base')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
      
    if (deleteError) {
      console.error('Error clearing knowledge base:', deleteError);
      return;
    }
  }

  let totalInserted = 0;

  // Populate negotiation tips
  console.log('📝 Populating negotiation tips...');
  for (const [key, tip] of Object.entries(negotiationTips)) {
    try {
      const content = `${key}: ${tip}`;
      const embedding = await generateEmbedding(content);
      
      await insertKnowledgeEntry(
        content,
        'negotiation_tips.json',
        { category: key, type: 'negotiation_strategy', original_key: key },
        'negotiation',
        embedding
      );
      
      console.log(`  ✅ Inserted: ${key}`);
      totalInserted++;
    } catch (error) {
      console.error(`  ❌ Failed to insert ${key}:`, error);
    }
  }

  // Populate market insights
  console.log('📊 Populating market insights...');
  for (const [location, insight] of Object.entries(marketInsights)) {
    try {
      const content = `${location} Market Insight: ${insight}`;
      const embedding = await generateEmbedding(content);
      
      await insertKnowledgeEntry(
        content,
        'market_insights.json',
        { location, type: 'market_data', geographic_focus: location },
        'market_analysis',
        embedding
      );
      
      console.log(`  ✅ Inserted: ${location}`);
      totalInserted++;
    } catch (error) {
      console.error(`  ❌ Failed to insert ${location}:`, error);
    }
  }

  console.log(`🎉 Knowledge base population complete! Total entries: ${totalInserted}`);
}

populateKnowledgeBase();