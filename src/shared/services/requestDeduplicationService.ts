/**
 * Request Deduplication Service
 * 
 * Prevents duplicate API calls and expensive operations within short time windows
 * This can save significant costs when users submit similar requests rapidly
 * 
 * Features:
 * - Duplicate request detection within time windows
 * - Concurrent request batching
 * - Smart request grouping by similarity
 * - Real-time cost savings tracking
 */

interface PendingRequest {
  key: string;
  promise: Promise<any>;
  timestamp: number;
  originalQuery: string;
}

interface RequestBatch {
  requests: string[];
  promise: Promise<any>;
  timestamp: number;
}

class RequestDeduplicationService {
  private static instance: RequestDeduplicationService;
  private pendingRequests = new Map<string, PendingRequest>();
  private recentResults = new Map<string, { result: any; timestamp: number; ttl: number }>();
  private requestBatches = new Map<string, RequestBatch>();
  
  // Deduplication tracking
  private duplicatesBlocked = 0;
  private costSaved = 0;
  
  // Configuration
  private readonly DEDUPLICATION_WINDOW = 5000; // 5 seconds
  private readonly SIMILARITY_THRESHOLD = 0.9;
  private readonly BATCH_WINDOW = 500; // 500ms to collect similar requests
  private readonly MAX_CACHE_SIZE = 500;

  static getInstance(): RequestDeduplicationService {
    if (!RequestDeduplicationService.instance) {
      RequestDeduplicationService.instance = new RequestDeduplicationService();
    }
    return RequestDeduplicationService.instance;
  }

  /**
   * CHAT REQUEST DEDUPLICATION
   * Prevents duplicate chat requests within short time windows
   */
  async deduplicateChat(
    userMessage: string,
    systemPrompt: string,
    chatFunction: () => Promise<any>
  ): Promise<{ result: any; wasDuplicate: boolean; costSaved: number }> {
    
    const requestKey = this.generateRequestKey(userMessage, systemPrompt);
    console.log('🔍 Checking for duplicate chat request:', requestKey.substring(0, 16) + '...');

    // Check if exact same request is already pending
    const pendingRequest = this.pendingRequests.get(requestKey);
    if (pendingRequest && Date.now() - pendingRequest.timestamp < this.DEDUPLICATION_WINDOW) {
      console.log('⚠️ DUPLICATE REQUEST BLOCKED - awaiting existing request');
      this.duplicatesBlocked++;
      this.costSaved += this.estimateChatCost(userMessage);
      
      const result = await pendingRequest.promise;
      return { 
        result, 
        wasDuplicate: true, 
        costSaved: this.estimateChatCost(userMessage) 
      };
    }

    // Check recent results cache
    const cachedResult = this.recentResults.get(requestKey);
    if (cachedResult && Date.now() - cachedResult.timestamp < cachedResult.ttl) {
      console.log('💰 Using recent result cache');
      this.duplicatesBlocked++;
      this.costSaved += this.estimateChatCost(userMessage);
      
      return { 
        result: cachedResult.result, 
        wasDuplicate: true, 
        costSaved: this.estimateChatCost(userMessage) 
      };
    }

    // Check for similar requests that can be batched or reused
    const similarRequest = this.findSimilarPendingRequest(userMessage, systemPrompt);
    if (similarRequest) {
      console.log('🔄 Found similar pending request - reusing result');
      this.duplicatesBlocked++;
      this.costSaved += this.estimateChatCost(userMessage) * 0.7; // Partial savings
      
      const result = await similarRequest.promise;
      return { 
        result, 
        wasDuplicate: true, 
        costSaved: this.estimateChatCost(userMessage) * 0.7 
      };
    }

    // Execute new request
    console.log('✅ New unique request - executing');
    const requestPromise = this.executeWithDeduplication(requestKey, userMessage, chatFunction);
    
    // Store pending request
    this.pendingRequests.set(requestKey, {
      key: requestKey,
      promise: requestPromise,
      timestamp: Date.now(),
      originalQuery: userMessage
    });

    try {
      const result = await requestPromise;
      
      // Cache result for short term reuse
      this.recentResults.set(requestKey, {
        result,
        timestamp: Date.now(),
        ttl: this.getResultTTL(userMessage)
      });

      // Cleanup
      this.pendingRequests.delete(requestKey);
      this.cleanupOldRequests();

      return { result, wasDuplicate: false, costSaved: 0 };
    } catch (error) {
      this.pendingRequests.delete(requestKey);
      throw error;
    }
  }

  /**
   * EMBEDDING REQUEST BATCHING
   * Batch multiple embedding requests to reduce API overhead
   */
  async batchEmbeddingRequest(
    text: string,
    embeddingFunction: (texts: string[]) => Promise<number[][]>
  ): Promise<{ embedding: number[]; wasBatched: boolean; costSaved: number }> {
    
    const batchKey = this.generateBatchKey(text);
    console.log('📦 Checking for embedding batch opportunity...');

    // Check if there's an active batch for similar requests
    const existingBatch = this.requestBatches.get(batchKey);
    if (existingBatch && Date.now() - existingBatch.timestamp < this.BATCH_WINDOW) {
      console.log('📦 Adding to existing embedding batch');
      existingBatch.requests.push(text);
      
      const results = await existingBatch.promise;
      const textIndex = existingBatch.requests.indexOf(text);
      
      return {
        embedding: results[textIndex],
        wasBatched: true,
        costSaved: 0.00005 // Estimated savings from batching
      };
    }

    // Create new batch
    console.log('📦 Creating new embedding batch');
    const batchPromise = new Promise<number[][]>((resolve, reject) => {
      setTimeout(async () => {
        try {
          const batch = this.requestBatches.get(batchKey);
          if (batch) {
            console.log(`📦 Executing batch with ${batch.requests.length} embeddings`);
            const results = await embeddingFunction(batch.requests);
            this.requestBatches.delete(batchKey);
            resolve(results);
          } else {
            reject(new Error('Batch not found'));
          }
        } catch (error) {
          this.requestBatches.delete(batchKey);
          reject(error);
        }
      }, this.BATCH_WINDOW);
    });

    this.requestBatches.set(batchKey, {
      requests: [text],
      promise: batchPromise,
      timestamp: Date.now()
    });

    const results = await batchPromise;
    return {
      embedding: results[0],
      wasBatched: this.requestBatches.has(batchKey) && this.requestBatches.get(batchKey)!.requests.length > 1,
      costSaved: 0
    };
  }

  /**
   * MARKET DATA REQUEST DEDUPLICATION
   * Prevent duplicate expensive database queries
   */
  async deduplicateMarketData(
    location: string,
    dataType: string,
    queryFunction: () => Promise<any>
  ): Promise<{ result: any; wasDuplicate: boolean }> {
    
    const requestKey = `market_${this.generateRequestKey(location, dataType)}`;
    
    // Check pending requests
    const pendingRequest = this.pendingRequests.get(requestKey);
    if (pendingRequest && Date.now() - pendingRequest.timestamp < this.DEDUPLICATION_WINDOW * 2) {
      console.log('🏠 DUPLICATE MARKET DATA REQUEST BLOCKED');
      this.duplicatesBlocked++;
      
      const result = await pendingRequest.promise;
      return { result, wasDuplicate: true };
    }

    // Check recent results (longer TTL for market data)
    const cachedResult = this.recentResults.get(requestKey);
    if (cachedResult && Date.now() - cachedResult.timestamp < cachedResult.ttl) {
      console.log('🏠 Using cached market data');
      return { result: cachedResult.result, wasDuplicate: true };
    }

    // Execute new request
    const requestPromise = queryFunction();
    this.pendingRequests.set(requestKey, {
      key: requestKey,
      promise: requestPromise,
      timestamp: Date.now(),
      originalQuery: `${location}_${dataType}`
    });

    try {
      const result = await requestPromise;
      
      // Cache market data for longer period
      this.recentResults.set(requestKey, {
        result,
        timestamp: Date.now(),
        ttl: this.getMarketDataTTL(dataType)
      });

      this.pendingRequests.delete(requestKey);
      return { result, wasDuplicate: false };
    } catch (error) {
      this.pendingRequests.delete(requestKey);
      throw error;
    }
  }

  /**
   * Get deduplication analytics
   */
  getAnalytics(): {
    duplicatesBlocked: number;
    costSaved: number;
    activePendingRequests: number;
    cacheSize: number;
    efficiency: number;
  } {
    const totalRequests = this.duplicatesBlocked + this.pendingRequests.size;
    const efficiency = totalRequests > 0 ? this.duplicatesBlocked / totalRequests : 0;

    return {
      duplicatesBlocked: this.duplicatesBlocked,
      costSaved: this.costSaved,
      activePendingRequests: this.pendingRequests.size,
      cacheSize: this.recentResults.size,
      efficiency
    };
  }

  /**
   * Helper methods
   */
  private generateRequestKey(input1: string, input2: string = ''): string {
    const combined = (input1 + input2).toLowerCase().trim();
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private generateBatchKey(text: string): string {
    // Group similar length texts for batching
    const lengthGroup = Math.floor(text.length / 100) * 100;
    return `batch_${lengthGroup}`;
  }

  private findSimilarPendingRequest(userMessage: string, systemPrompt: string): PendingRequest | null {
    for (const [key, request] of this.pendingRequests.entries()) {
      if (Date.now() - request.timestamp > this.DEDUPLICATION_WINDOW) continue;
      
      const similarity = this.calculateSimilarity(userMessage, request.originalQuery);
      if (similarity > this.SIMILARITY_THRESHOLD) {
        return request;
      }
    }
    return null;
  }

  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  private async executeWithDeduplication<T>(
    requestKey: string,
    userMessage: string,
    requestFunction: () => Promise<T>
  ): Promise<T> {
    try {
      return await requestFunction();
    } catch (error) {
      // Remove from pending on error
      this.pendingRequests.delete(requestKey);
      throw error;
    }
  }

  private estimateChatCost(message: string): number {
    const tokenCount = (message.length / 4) + 500; // Include response tokens
    return tokenCount * 0.00003; // GPT-4 cost per token
  }

  private getResultTTL(userMessage: string): number {
    // Market-related queries: longer cache
    if (userMessage.toLowerCase().includes('market') || userMessage.toLowerCase().includes('rent')) {
      return 30 * 60 * 1000; // 30 minutes
    }
    // General queries: shorter cache
    return 10 * 60 * 1000; // 10 minutes
  }

  private getMarketDataTTL(dataType: string): number {
    switch (dataType) {
      case 'predictions': return 60 * 60 * 1000; // 1 hour
      case 'hud_data': return 24 * 60 * 60 * 1000; // 24 hours
      case 'comparables': return 30 * 60 * 1000; // 30 minutes
      default: return 15 * 60 * 1000; // 15 minutes
    }
  }

  private cleanupOldRequests(): void {
    const now = Date.now();
    
    // Cleanup pending requests
    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.DEDUPLICATION_WINDOW * 2) {
        this.pendingRequests.delete(key);
      }
    }

    // Cleanup results cache
    for (const [key, result] of this.recentResults.entries()) {
      if (now - result.timestamp > result.ttl) {
        this.recentResults.delete(key);
      }
    }

    // Limit cache sizes
    if (this.recentResults.size > this.MAX_CACHE_SIZE) {
      const oldestKey = Array.from(this.recentResults.keys())[0];
      this.recentResults.delete(oldestKey);
    }
  }
}

export const requestDeduplication = RequestDeduplicationService.getInstance();