// Content value analysis for RAG optimization
const TEST_CONFIG = {
  supabaseUrl: 'https://izzdyfrcxunfzlfgdjuv.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6emR5ZnJjeHVuZnpsZmdkanV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMDIzMDgsImV4cCI6MjA1ODc3ODMwOH0.rLBqA9Ok3tKPx90Hgvf9bTx0rUjJWcMj2a-SRy_sA8M'
};

// Define value scoring criteria for rental negotiation
const VALUE_CRITERIA = {
  // High value for negotiation
  HIGH_VALUE: [
    'negotiation_strategy',
    'Strategy Guide',
    'Market Intelligence',
    'National Market Intelligence',
    'Predictive Analysis'
  ],
  
  // Medium value - useful context
  MEDIUM_VALUE: [
    'Location Analysis',
    'comprehensive_market_data'
  ],
  
  // Low value - too generic or redundant
  LOW_VALUE: [
    'state_coverage',
    'regional_coverage', 
    'zillow_excel_overview',
    'processed_csv_data',
    'zillow_excel_data'
  ]
};

function scoreContentValue(sourceType, dataType, content, metadata) {
  let score = 0;
  let reasoning = [];
  
  // Primary scoring based on source type
  if (VALUE_CRITERIA.HIGH_VALUE.includes(sourceType)) {
    score += 10;
    reasoning.push('High-value source type for negotiation');
  } else if (VALUE_CRITERIA.MEDIUM_VALUE.includes(sourceType)) {
    score += 5;
    reasoning.push('Medium-value source type');
  } else if (VALUE_CRITERIA.LOW_VALUE.includes(sourceType)) {
    score += 1;
    reasoning.push('Low-value source type');
  }
  
  // Bonus for negotiation-specific data types
  if (dataType === 'negotiation_strategy') {
    score += 8;
    reasoning.push('Direct negotiation strategy content');
  } else if (dataType === 'zip_analysis') {
    score += 3;
    reasoning.push('Specific market data useful for leverage');
  } else if (dataType === 'city_overview') {
    score += 2;
    reasoning.push('City-level market context');
  }
  
  // Content quality indicators
  if (content) {
    if (content.includes('negotiation') || content.includes('leverage') || content.includes('strategy')) {
      score += 5;
      reasoning.push('Contains negotiation keywords');
    }
    
    if (content.includes('rent prediction') || content.includes('market trend') || content.includes('growth')) {
      score += 3;
      reasoning.push('Contains predictive market data');
    }
    
    if (content.includes('average rent') || content.includes('$') || content.includes('%')) {
      score += 2;
      reasoning.push('Contains specific pricing data');
    }
    
    // Length penalty for very short generic content
    if (content.length < 100) {
      score -= 2;
      reasoning.push('Very short content may lack detail');
    }
    
    // Length penalty for very long repetitive content
    if (content.length > 1000 && !content.includes('strategy') && !content.includes('negotiation')) {
      score -= 1;
      reasoning.push('Long content without negotiation focus');
    }
  }
  
  // Metadata quality indicators
  if (metadata) {
    if (metadata.market_stage) {
      score += 2;
      reasoning.push('Has market cycle information');
    }
    
    if (metadata.avg_rent || metadata.avg_change) {
      score += 2;
      reasoning.push('Has specific financial metrics');
    }
    
    if (metadata.zip_code) {
      score += 1;
      reasoning.push('Has specific location data');
    }
  }
  
  return { score: Math.max(0, score), reasoning };
}

async function analyzeContentValue() {
  console.log('💎 Analyzing content value for rental negotiation RAG...\n');
  
  try {
    // Get all chunks
    const chunksResponse = await fetch(`${TEST_CONFIG.supabaseUrl}/rest/v1/document_chunks?select=*`, {
      headers: {
        'apikey': TEST_CONFIG.anonKey,
        'Authorization': `Bearer ${TEST_CONFIG.anonKey}`
      }
    });
    
    const chunks = await chunksResponse.json();
    console.log(`📊 Analyzing ${chunks.length} chunks for value...\n`);
    
    const valueAnalysis = {
      HIGH: { chunks: [], totalSize: 0, avgScore: 0 },
      MEDIUM: { chunks: [], totalSize: 0, avgScore: 0 },
      LOW: { chunks: [], totalSize: 0, avgScore: 0 }
    };
    
    const sourceTypeAnalysis = {};
    let totalScore = 0;
    
    chunks.forEach((chunk, index) => {
      let metadata = null;
      try {
        metadata = typeof chunk.metadata === 'string' ? JSON.parse(chunk.metadata) : chunk.metadata;
      } catch (e) {
        // Skip chunks with invalid metadata
        return;
      }
      
      const sourceType = metadata?.source_type || 'unknown';
      const dataType = metadata?.data_type || null;
      const content = chunk.content || '';
      
      const valueResult = scoreContentValue(sourceType, dataType, content, metadata);
      totalScore += valueResult.score;
      
      // Categorize by value
      let category;
      if (valueResult.score >= 15) {
        category = 'HIGH';
      } else if (valueResult.score >= 8) {
        category = 'MEDIUM';
      } else {
        category = 'LOW';
      }
      
      valueAnalysis[category].chunks.push({
        index,
        sourceType,
        dataType,
        score: valueResult.score,
        reasoning: valueResult.reasoning,
        contentLength: content.length,
        preview: content.substring(0, 100) + (content.length > 100 ? '...' : '')
      });
      
      valueAnalysis[category].totalSize += content.length;
      
      // Track by source type
      if (!sourceTypeAnalysis[sourceType]) {
        sourceTypeAnalysis[sourceType] = {
          count: 0,
          totalScore: 0,
          avgScore: 0,
          totalSize: 0,
          samples: []
        };
      }
      
      sourceTypeAnalysis[sourceType].count++;
      sourceTypeAnalysis[sourceType].totalScore += valueResult.score;
      sourceTypeAnalysis[sourceType].totalSize += content.length;
      
      if (sourceTypeAnalysis[sourceType].samples.length < 2) {
        sourceTypeAnalysis[sourceType].samples.push({
          score: valueResult.score,
          preview: content.substring(0, 80) + '...'
        });
      }
    });
    
    // Calculate averages
    Object.keys(valueAnalysis).forEach(category => {
      if (valueAnalysis[category].chunks.length > 0) {
        valueAnalysis[category].avgScore = 
          valueAnalysis[category].chunks.reduce((sum, chunk) => sum + chunk.score, 0) / 
          valueAnalysis[category].chunks.length;
      }
    });
    
    Object.keys(sourceTypeAnalysis).forEach(sourceType => {
      sourceTypeAnalysis[sourceType].avgScore = 
        sourceTypeAnalysis[sourceType].totalScore / sourceTypeAnalysis[sourceType].count;
    });
    
    // Display results
    console.log('🎯 VALUE CATEGORY BREAKDOWN:');
    console.log('=' .repeat(60));
    
    Object.entries(valueAnalysis).forEach(([category, data]) => {
      const percentage = ((data.chunks.length / chunks.length) * 100).toFixed(1);
      const sizeKB = (data.totalSize / 1024).toFixed(1);
      
      console.log(`\n${category} VALUE (Score 15+ / 8+ / <8):`);
      console.log(`  Chunks: ${data.chunks.length} (${percentage}%)`);
      console.log(`  Total Size: ${sizeKB} KB`);
      console.log(`  Avg Score: ${data.avgScore.toFixed(1)}`);
      
      if (data.chunks.length > 0) {
        console.log(`  Top samples:`);
        data.chunks
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .forEach((chunk, i) => {
            console.log(`    ${i+1}. [${chunk.sourceType}] Score: ${chunk.score}`);
            console.log(`       "${chunk.preview}"`);
            console.log(`       Reasoning: ${chunk.reasoning.join(', ')}`);
          });
      }
    });
    
    console.log('\n📊 SOURCE TYPE VALUE RANKING:');
    console.log('=' .repeat(60));
    
    Object.entries(sourceTypeAnalysis)
      .sort((a, b) => b[1].avgScore - a[1].avgScore)
      .forEach(([sourceType, data]) => {
        const sizeKB = (data.totalSize / 1024).toFixed(1);
        console.log(`\n${sourceType}:`);
        console.log(`  Avg Score: ${data.avgScore.toFixed(1)} | Count: ${data.count} | Size: ${sizeKB} KB`);
        console.log(`  Samples: "${data.samples[0]?.preview || 'N/A'}"`);
      });
    
    // Generate recommendations
    console.log('\n🎯 OPTIMIZATION RECOMMENDATIONS:');
    console.log('=' .repeat(60));
    
    const highValue = valueAnalysis.HIGH;
    const mediumValue = valueAnalysis.MEDIUM;
    const lowValue = valueAnalysis.LOW;
    
    const totalSize = (highValue.totalSize + mediumValue.totalSize + lowValue.totalSize) / 1024;
    const lowValueSize = lowValue.totalSize / 1024;
    const potentialSavings = (lowValueSize / totalSize * 100).toFixed(1);
    
    console.log(`\n📈 KEEP (High Value): ${highValue.chunks.length} chunks (${(highValue.totalSize/1024).toFixed(1)} KB)`);
    console.log(`   These contain direct negotiation strategies, market intelligence, and predictive analysis`);
    
    console.log(`\n🤔 REVIEW (Medium Value): ${mediumValue.chunks.length} chunks (${(mediumValue.totalSize/1024).toFixed(1)} KB)`);
    console.log(`   Location-specific data useful for context but may be redundant`);
    
    console.log(`\n❌ REMOVE (Low Value): ${lowValue.chunks.length} chunks (${lowValueSize.toFixed(1)} KB)`);
    console.log(`   Generic state/regional overviews and redundant market data`);
    console.log(`   Potential storage savings: ${potentialSavings}% of total content`);
    
    // Specific removal targets
    const removalTargets = Object.entries(sourceTypeAnalysis)
      .filter(([sourceType, data]) => data.avgScore < 5)
      .sort((a, b) => b[1].totalSize - a[1].totalSize);
    
    if (removalTargets.length > 0) {
      console.log(`\n🗑️  PRIORITY REMOVAL TARGETS:`);
      removalTargets.forEach(([sourceType, data]) => {
        const sizeKB = (data.totalSize / 1024).toFixed(1);
        console.log(`   ${sourceType}: ${data.count} chunks, ${sizeKB} KB (avg score: ${data.avgScore.toFixed(1)})`);
      });
    }
    
    console.log(`\n💰 COST IMPACT:`);
    console.log(`   Current total: ${totalSize.toFixed(1)} KB`);
    console.log(`   After optimization: ${((totalSize - lowValueSize)).toFixed(1)} KB`);
    console.log(`   Size reduction: ${potentialSavings}%`);
    
  } catch (error) {
    console.error('❌ Error analyzing content value:', error);
  }
}

// Run the analysis
analyzeContentValue();