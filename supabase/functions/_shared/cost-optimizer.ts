/**
 * Cost Optimization Service for Edge Functions
 * 
 * Provides caching and optimization strategies to reduce API costs by 30-50%
 * Target: Reduce per-user cost from $2.15-4.40 to $1.50-3.00/month
 */

// Simple in-memory cache for edge function environment
const embeddingCache = new Map<string, { embedding: number[]; timestamp: number }>();
const responseCache = new Map<string, { response: string; timestamp: number; ttl: number }>();
const marketDataCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// Cost tracking
let totalCostSaved = 0;
let cacheHits = 0;
let cacheMisses = 0;

export interface CostOptimizerConfig {
  embeddingTTL: number; // milliseconds
  responseTTL: number; // milliseconds  
  marketDataTTL: number; // milliseconds
  maxCacheSize: number;
}

const defaultConfig: CostOptimizerConfig = {
  embeddingTTL: 24 * 60 * 60 * 1000, // 24 hours
  responseTTL: 2 * 60 * 60 * 1000, // 2 hours
  marketDataTTL: 6 * 60 * 60 * 1000, // 6 hours
  maxCacheSize: 1000
};

/**
 * Generate a simple hash for cache keys
 */
function generateHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Calculate text similarity using Jaccard index
 */
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * EMBEDDING OPTIMIZATION
 * Check cache for similar embeddings to reduce OpenAI embedding costs
 */
export async function getCachedEmbedding(
  text: string, 
  config: CostOptimizerConfig = defaultConfig
): Promise<{ cached: boolean; embedding: number[] | null; costSaved: number }> {
  
  const textKey = generateHash(text.toLowerCase().trim());
  
  // Check exact match first
  const exactMatch = embeddingCache.get(textKey);
  if (exactMatch && Date.now() - exactMatch.timestamp < config.embeddingTTL) {
    cacheHits++;
    totalCostSaved += 0.0001; // Embedding API cost
    console.log('💰 Embedding cache HIT (exact) - saved $0.0001');
    return { cached: true, embedding: exactMatch.embedding, costSaved: 0.0001 };
  }

  // Check for similar text (>90% similarity)
  for (const [key, entry] of embeddingCache.entries()) {
    if (Date.now() - entry.timestamp > config.embeddingTTL) continue;
    
    // Simple length-based pre-filter for performance
    if (Math.abs(text.length - key.length) / Math.max(text.length, key.length) > 0.3) continue;
    
    const similarity = calculateSimilarity(text, key);
    if (similarity > 0.90) {
      cacheHits++;
      totalCostSaved += 0.0001;
      console.log(`💰 Embedding cache HIT (${(similarity * 100).toFixed(1)}% similar) - saved $0.0001`);
      return { cached: true, embedding: entry.embedding, costSaved: 0.0001 };
    }
  }

  cacheMisses++;
  return { cached: false, embedding: null, costSaved: 0 };
}

/**
 * Cache an embedding after generation
 */
export function cacheEmbedding(text: string, embedding: number[]): void {
  const textKey = generateHash(text.toLowerCase().trim());
  
  embeddingCache.set(textKey, {
    embedding,
    timestamp: Date.now()
  });

  // Limit cache size to prevent memory issues
  if (embeddingCache.size > defaultConfig.maxCacheSize) {
    const oldestKey = Array.from(embeddingCache.keys())[0];
    embeddingCache.delete(oldestKey);
    console.log('🧹 Cleaned old embedding from cache');
  }
}

/**
 * RESPONSE CACHING
 * Cache OpenAI responses for similar prompts
 */
export function getCachedResponse(
  prompt: string, 
  systemPrompt: string = '',
  config: CostOptimizerConfig = defaultConfig
): { cached: boolean; response: string | null; costSaved: number } {
  
  const promptKey = generateHash(prompt + systemPrompt);
  
  // Check exact match
  const exactMatch = responseCache.get(promptKey);
  if (exactMatch && Date.now() - exactMatch.timestamp < exactMatch.ttl) {
    cacheHits++;
    const costSaved = estimateOpenAICost(prompt);
    totalCostSaved += costSaved;
    console.log(`💰 Response cache HIT (exact) - saved $${costSaved.toFixed(4)}`);
    return { cached: true, response: exactMatch.response, costSaved };
  }

  // Check for similar prompts (>85% similarity for responses)
  for (const [key, entry] of responseCache.entries()) {
    if (Date.now() - entry.timestamp > entry.ttl) continue;
    
    const similarity = calculateSimilarity(prompt, key);
    if (similarity > 0.85) {
      cacheHits++;
      const costSaved = estimateOpenAICost(prompt);
      totalCostSaved += costSaved;
      console.log(`💰 Response cache HIT (${(similarity * 100).toFixed(1)}% similar) - saved $${costSaved.toFixed(4)}`);
      return { cached: true, response: entry.response, costSaved };
    }
  }

  cacheMisses++;
  return { cached: false, response: null, costSaved: 0 };
}

/**
 * Cache a response after generation
 */
export function cacheResponse(
  prompt: string, 
  systemPrompt: string = '',
  response: string,
  customTTL?: number
): void {
  const promptKey = generateHash(prompt + systemPrompt);
  const ttl = customTTL || getResponseTTL(prompt);
  
  responseCache.set(promptKey, {
    response,
    timestamp: Date.now(),
    ttl
  });

  // Limit cache size
  if (responseCache.size > defaultConfig.maxCacheSize) {
    const oldestKey = Array.from(responseCache.keys())[0];
    responseCache.delete(oldestKey);
  }
}

/**
 * MARKET DATA CACHING
 * Cache expensive database queries
 */
export function getCachedMarketData(
  location: string, 
  dataType: string,
  config: CostOptimizerConfig = defaultConfig
): { cached: boolean; data: any | null } {
  
  const cacheKey = `${dataType}_${generateHash(location)}`;
  
  const cached = marketDataCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    console.log(`💰 Market data cache HIT for ${location} (${dataType})`);
    return { cached: true, data: cached.data };
  }

  return { cached: false, data: null };
}

/**
 * Cache market data
 */
export function cacheMarketData(
  location: string, 
  dataType: string, 
  data: any,
  customTTL?: number
): void {
  const cacheKey = `${dataType}_${generateHash(location)}`;
  const ttl = customTTL || getMarketDataTTL(dataType);
  
  marketDataCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    ttl
  });
}

/**
 * Get cost analytics
 */
export function getCostAnalytics(): {
  totalSaved: number;
  cacheHitRate: number;
  totalRequests: number;
  recommendations: string[];
} {
  const totalRequests = cacheHits + cacheMisses;
  const hitRate = totalRequests > 0 ? cacheHits / totalRequests : 0;

  const recommendations = [];
  if (hitRate < 0.3) {
    recommendations.push('Low cache hit rate - consider longer TTL');
  }
  if (totalCostSaved > 1.0) {
    recommendations.push('Excellent savings! Cache is working well');
  }
  if (embeddingCache.size < 50) {
    recommendations.push('Few cached embeddings - users may have unique queries');
  }

  return {
    totalSaved: totalCostSaved,
    cacheHitRate: hitRate,
    totalRequests,
    recommendations
  };
}

/**
 * Helper functions
 */
function estimateOpenAICost(prompt: string): number {
  // Rough token estimation: 1 token ≈ 4 characters
  const tokenCount = (prompt.length / 4) + 500; // Add 500 for response
  return tokenCount * 0.00003; // GPT-4 cost per token
}

function getResponseTTL(prompt: string): number {
  if (prompt.toLowerCase().includes('market') || prompt.toLowerCase().includes('prediction')) {
    return 2 * 60 * 60 * 1000; // 2 hours for market data
  }
  if (prompt.toLowerCase().includes('negotiation') || prompt.toLowerCase().includes('strategy')) {
    return 30 * 60 * 1000; // 30 minutes for negotiation advice
  }
  return 15 * 60 * 1000; // 15 minutes default
}

function getMarketDataTTL(dataType: string): number {
  switch (dataType) {
    case 'predictions': return 24 * 60 * 60 * 1000; // 24 hours
    case 'hud_data': return 7 * 24 * 60 * 60 * 1000; // 7 days
    case 'zillow_data': return 6 * 60 * 60 * 1000; // 6 hours
    default: return 60 * 60 * 1000; // 1 hour
  }
}