// Simple script to populate knowledge base without embedding generation for testing
const TEST_CONFIG = {
  supabaseUrl: 'https://izzdyfrcxunfzlfgdjuv.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6emR5ZnJjeHVuZnpsZmdkanV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMDIzMDgsImV4cCI6MjA1ODc3ODMwOH0.rLBqA9Ok3tKPx90Hgvf9bTx0rUjJWcMj2a-SRy_sA8M'
};

// Sample entries to test with (without embeddings for now)
const sampleEntries = [
  {
    content: "RenewalNegotiation: When renewing, highlight your on-time payment history and politely request a rent reduction or improved terms based on comparable listings.",
    source: "negotiation_tips.json",
    metadata: { category: "RenewalNegotiation", type: "negotiation_strategy" },
    chat_type: "negotiation"
  },
  {
    content: "MarketResearchTip: Always research at least 3-5 similar nearby listings and bring printed comps to show why your offer is fair.",
    source: "negotiation_tips.json",
    metadata: { category: "MarketResearchTip", type: "negotiation_strategy" },
    chat_type: "negotiation"
  },
  {
    content: "New York Market Insight: New York rents have slightly cooled, with increased concessions for renewals and new leases.",
    source: "market_insights.json",
    metadata: { location: "New York", type: "market_data" },
    chat_type: "market_analysis"
  }
];

async function checkKnowledgeBase() {
  console.log('📊 Checking knowledge base status...');
  
  try {
    const response = await fetch(`${TEST_CONFIG.supabaseUrl}/rest/v1/knowledge_base?select=id,content,source,chat_type`, {
      headers: {
        'apikey': TEST_CONFIG.anonKey,
        'Authorization': `Bearer ${TEST_CONFIG.anonKey}`
      }
    });
    
    if (!response.ok) {
      console.error('❌ Error response:', await response.text());
      return;
    }
    
    const data = await response.json();
    console.log(`Found ${data.length} existing entries`);
    
    if (data.length > 0) {
      console.log('Sample entries:');
      data.slice(0, 3).forEach((entry, index) => {
        console.log(`  ${index + 1}. [${entry.chat_type}] ${entry.content.substring(0, 60)}...`);
      });
    }
    
    return data.length;
  } catch (error) {
    console.error('❌ Error checking knowledge base:', error);
    return 0;
  }
}

async function insertSampleEntries() {
  console.log('📝 Inserting sample entries...');
  
  for (const entry of sampleEntries) {
    try {
      const response = await fetch(`${TEST_CONFIG.supabaseUrl}/rest/v1/knowledge_base`, {
        method: 'POST',
        headers: {
          'apikey': TEST_CONFIG.anonKey,
          'Authorization': `Bearer ${TEST_CONFIG.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(entry)
      });
      
      if (response.ok) {
        console.log(`  ✅ Inserted: ${entry.metadata.category || entry.metadata.location}`);
      } else {
        const errorText = await response.text();
        console.error(`  ❌ Failed to insert entry:`, errorText);
      }
    } catch (error) {
      console.error(`  ❌ Error inserting entry:`, error);
    }
  }
}

async function testKnowledgeBase() {
  const existingCount = await checkKnowledgeBase();
  
  if (existingCount === 0) {
    console.log('\n🚀 Knowledge base is empty, inserting sample entries...');
    await insertSampleEntries();
    await checkKnowledgeBase();
  } else {
    console.log('\n✅ Knowledge base already has content');
  }
}

testKnowledgeBase();