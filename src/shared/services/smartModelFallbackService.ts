/**
 * Smart Model Fallback Service
 * 
 * Automatically routes queries to the most cost-effective AI model based on:
 * - Query complexity
 * - Required accuracy level  
 * - User context and history
 * - Cost optimization targets
 * 
 * Target: Reduce AI costs by 40-60% through intelligent model selection
 */

export interface ModelConfig {
  name: string;
  costPer1kTokens: number;
  maxTokens: number;
  strengths: string[];
  weaknesses: string[];
  useCase: string;
}

export interface QueryClassification {
  complexity: 'simple' | 'moderate' | 'complex';
  domain: 'general' | 'market_analysis' | 'negotiation' | 'legal' | 'calculation';
  accuracyRequired: 'low' | 'medium' | 'high';
  recommendedModel: string;
  costSavings: number;
  confidence: number;
}

class SmartModelFallbackService {
  private static instance: SmartModelFallbackService;
  
  // Available models with cost and capability data
  private readonly models: Record<string, ModelConfig> = {
    'gpt-4-1106-preview': {
      name: 'gpt-4-1106-preview',
      costPer1kTokens: 0.03,
      maxTokens: 4096,
      strengths: ['complex reasoning', 'market analysis', 'negotiation strategy', 'accuracy'],
      weaknesses: ['cost'],
      useCase: 'Complex analysis, high-stakes negotiations'
    },
    'gpt-3.5-turbo': {
      name: 'gpt-3.5-turbo',
      costPer1kTokens: 0.002,
      maxTokens: 4096,
      strengths: ['fast responses', 'cost-effective', 'general queries'],
      weaknesses: ['complex reasoning', 'detailed analysis'],
      useCase: 'Simple questions, basic negotiation tips'
    },
    'gpt-3.5-turbo-16k': {
      name: 'gpt-3.5-turbo-16k',
      costPer1kTokens: 0.004,
      maxTokens: 16384,
      strengths: ['long context', 'cost-effective', 'document analysis'],
      weaknesses: ['complex reasoning'],
      useCase: 'Long document analysis, extended conversations'
    }
  };

  // Query patterns and their classifications
  private readonly queryPatterns = {
    simple: [
      /^(what is|define|explain briefly)/i,
      /^(yes or no|true or false)/i,
      /^(how much|what's the)/i,
      /^(quick tip|simple advice)/i
    ],
    moderate: [
      /negotiate|strategy|approach/i,
      /compare|analysis|market/i,
      /should i|recommend|suggest/i,
      /steps|process|how to/i
    ],
    complex: [
      /comprehensive|detailed|in-depth/i,
      /legal|contract|lease terms/i,
      /multiple properties|comparison/i,
      /long-term strategy|investment/i
    ]
  };

  private costSaved = 0;
  private fallbacksUsed = 0;
  private totalRequests = 0;

  static getInstance(): SmartModelFallbackService {
    if (!SmartModelFallbackService.instance) {
      SmartModelFallbackService.instance = new SmartModelFallbackService();
    }
    return SmartModelFallbackService.instance;
  }

  /**
   * INTELLIGENT MODEL SELECTION
   * Analyze query and select optimal model for cost vs performance
   */
  classifyAndRoute(
    userQuery: string,
    context?: {
      hasMarketData?: boolean;
      isNegotiation?: boolean;
      userHistory?: any[];
      prioritizeCost?: boolean;
    }
  ): QueryClassification {
    
    console.log('🤖 Analyzing query for optimal model selection...');
    this.totalRequests++;

    // Analyze query complexity
    const complexity = this.analyzeComplexity(userQuery);
    const domain = this.analyzeDomain(userQuery);
    const accuracyRequired = this.determineAccuracyRequirement(userQuery, context);
    
    // Select optimal model
    const { model, costSavings, confidence } = this.selectOptimalModel(
      complexity, 
      domain, 
      accuracyRequired, 
      userQuery.length,
      context
    );

    if (model !== 'gpt-4-1106-preview') {
      this.fallbacksUsed++;
      this.costSaved += costSavings;
    }

    console.log(`🎯 Selected model: ${model} (complexity: ${complexity}, domain: ${domain})`);
    console.log(`💰 Estimated cost savings: $${costSavings.toFixed(4)}`);

    return {
      complexity,
      domain,
      accuracyRequired,
      recommendedModel: model,
      costSavings,
      confidence
    };
  }

  /**
   * ADAPTIVE MODEL ROUTING
   * Route based on user preferences and cost targets
   */
  getAdaptiveModelRecommendation(
    userQuery: string,
    userPreferences?: {
      costOptimization: 'aggressive' | 'balanced' | 'performance';
      accuracyTolerance: 'low' | 'medium' | 'high';
    }
  ): QueryClassification {
    
    const baseClassification = this.classifyAndRoute(userQuery);
    
    // Adjust based on user preferences
    if (userPreferences?.costOptimization === 'aggressive') {
      // Always try to use cheaper model
      if (baseClassification.complexity !== 'complex') {
        return {
          ...baseClassification,
          recommendedModel: 'gpt-3.5-turbo',
          costSavings: this.calculateCostSavings('gpt-4-1106-preview', 'gpt-3.5-turbo', userQuery),
          confidence: Math.max(0.6, baseClassification.confidence - 0.2)
        };
      }
    }
    
    if (userPreferences?.costOptimization === 'performance') {
      // Always use best model
      return {
        ...baseClassification,
        recommendedModel: 'gpt-4-1106-preview',
        costSavings: 0,
        confidence: 0.95
      };
    }

    return baseClassification;
  }

  /**
   * DYNAMIC FALLBACK STRATEGY
   * Implement progressive fallbacks based on context
   */
  async executeWithFallback<T>(
    query: string,
    executeFunction: (model: string) => Promise<T>,
    options?: {
      maxRetries?: number;
      fallbackOnError?: boolean;
      costTarget?: number;
    }
  ): Promise<{ result: T; modelUsed: string; costSaved: number }> {
    
    const classification = this.classifyAndRoute(query);
    let currentModel = classification.recommendedModel;
    let attempt = 0;
    const maxRetries = options?.maxRetries || 2;

    while (attempt < maxRetries) {
      try {
        console.log(`🔄 Attempt ${attempt + 1} with model: ${currentModel}`);
        const result = await executeFunction(currentModel);
        
        const costSaved = this.calculateCostSavings('gpt-4-1106-preview', currentModel, query);
        
        return {
          result,
          modelUsed: currentModel,
          costSaved
        };
        
      } catch (error) {
        console.log(`❌ Model ${currentModel} failed:`, error);
        
        if (options?.fallbackOnError && attempt < maxRetries - 1) {
          // Fallback to more powerful model
          currentModel = this.getNextBestModel(currentModel);
          console.log(`🔄 Falling back to: ${currentModel}`);
        } else {
          throw error;
        }
      }
      
      attempt++;
    }

    throw new Error('All model attempts failed');
  }

  /**
   * Get optimization analytics
   */
  getOptimizationAnalytics(): {
    totalRequests: number;
    fallbacksUsed: number;
    fallbackRate: number;
    totalCostSaved: number;
    averageSavingsPerRequest: number;
    recommendations: string[];
  } {
    const fallbackRate = this.totalRequests > 0 ? this.fallbacksUsed / this.totalRequests : 0;
    const avgSavings = this.totalRequests > 0 ? this.costSaved / this.totalRequests : 0;

    const recommendations = [];
    if (fallbackRate > 0.7) {
      recommendations.push('High fallback rate - most queries can use cheaper models');
    }
    if (this.costSaved > 1.0) {
      recommendations.push('Excellent cost optimization - significant savings achieved');
    }
    if (fallbackRate < 0.3) {
      recommendations.push('Consider more aggressive cost optimization settings');
    }

    return {
      totalRequests: this.totalRequests,
      fallbacksUsed: this.fallbacksUsed,
      fallbackRate,
      totalCostSaved: this.costSaved,
      averageSavingsPerRequest: avgSavings,
      recommendations
    };
  }

  /**
   * Private helper methods
   */
  private analyzeComplexity(query: string): 'simple' | 'moderate' | 'complex' {
    const queryLower = query.toLowerCase();
    
    // Check for complex patterns first
    if (this.queryPatterns.complex.some(pattern => pattern.test(queryLower))) {
      return 'complex';
    }
    
    // Check for simple patterns
    if (this.queryPatterns.simple.some(pattern => pattern.test(queryLower))) {
      return 'simple';
    }
    
    // Length-based complexity
    if (query.length < 50) return 'simple';
    if (query.length > 200) return 'complex';
    
    return 'moderate';
  }

  private analyzeDomain(query: string): 'general' | 'market_analysis' | 'negotiation' | 'legal' | 'calculation' {
    const queryLower = query.toLowerCase();
    
    if (/legal|contract|lease|terms|clause/i.test(queryLower)) return 'legal';
    if (/calculate|math|cost|price|\$/i.test(queryLower)) return 'calculation';
    if (/market|rent|price|trend|data/i.test(queryLower)) return 'market_analysis';
    if (/negotiate|strategy|deal|offer/i.test(queryLower)) return 'negotiation';
    
    return 'general';
  }

  private determineAccuracyRequirement(
    query: string, 
    context?: any
  ): 'low' | 'medium' | 'high' {
    const queryLower = query.toLowerCase();
    
    // High accuracy required
    if (/legal|contract|important|crucial|critical/i.test(queryLower)) return 'high';
    if (context?.isNegotiation && /strategy|approach/i.test(queryLower)) return 'high';
    
    // Low accuracy acceptable
    if (/quick|general|rough|estimate/i.test(queryLower)) return 'low';
    if (/tip|advice|suggestion/i.test(queryLower)) return 'low';
    
    return 'medium';
  }

  private selectOptimalModel(
    complexity: string,
    domain: string,
    accuracyRequired: string,
    queryLength: number,
    context?: any
  ): { model: string; costSavings: number; confidence: number } {
    
    // High accuracy or complex queries always use GPT-4
    if (accuracyRequired === 'high' || complexity === 'complex') {
      return {
        model: 'gpt-4-1106-preview',
        costSavings: 0,
        confidence: 0.95
      };
    }

    // Legal domain always uses GPT-4
    if (domain === 'legal') {
      return {
        model: 'gpt-4-1106-preview',
        costSavings: 0,
        confidence: 0.95
      };
    }

    // Long queries might need 16k model
    if (queryLength > 2000) {
      const costSavings = this.calculateCostSavings('gpt-4-1106-preview', 'gpt-3.5-turbo-16k', `${'x'.repeat(queryLength)}`);
      return {
        model: 'gpt-3.5-turbo-16k',
        costSavings,
        confidence: 0.85
      };
    }

    // Simple queries can use GPT-3.5
    if (complexity === 'simple' && accuracyRequired === 'low') {
      const costSavings = this.calculateCostSavings('gpt-4-1106-preview', 'gpt-3.5-turbo', `${'x'.repeat(queryLength)}`);
      return {
        model: 'gpt-3.5-turbo',
        costSavings,
        confidence: 0.8
      };
    }

    // Moderate queries with cost optimization
    if (context?.prioritizeCost && complexity === 'moderate') {
      const costSavings = this.calculateCostSavings('gpt-4-1106-preview', 'gpt-3.5-turbo', `${'x'.repeat(queryLength)}`);
      return {
        model: 'gpt-3.5-turbo',
        costSavings,
        confidence: 0.75
      };
    }

    // Default to GPT-4 for everything else
    return {
      model: 'gpt-4-1106-preview',
      costSavings: 0,
      confidence: 0.95
    };
  }

  private calculateCostSavings(fromModel: string, toModel: string, sampleText: string): number {
    const tokenCount = sampleText.length / 4; // Rough token estimation
    
    const fromCost = (this.models[fromModel]?.costPer1kTokens || 0.03) * (tokenCount / 1000);
    const toCost = (this.models[toModel]?.costPer1kTokens || 0.002) * (tokenCount / 1000);
    
    return Math.max(0, fromCost - toCost);
  }

  private getNextBestModel(currentModel: string): string {
    switch (currentModel) {
      case 'gpt-3.5-turbo': return 'gpt-3.5-turbo-16k';
      case 'gpt-3.5-turbo-16k': return 'gpt-4-1106-preview';
      default: return 'gpt-4-1106-preview';
    }
  }
}

export const smartModelFallback = SmartModelFallbackService.getInstance();