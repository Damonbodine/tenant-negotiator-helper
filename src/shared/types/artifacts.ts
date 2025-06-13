export interface VisualArtifact {
  id: string;
  type: ArtifactType;
  title: string;
  description?: string;
  data: any;
  priority: 'high' | 'medium' | 'low';
  interactive: boolean;
  timestamp: Date;
  associatedMessageId?: string;
}

export type ArtifactType = 
  | 'rent-trend-chart'
  | 'property-comparison'
  | 'negotiation-roadmap'
  | 'market-heatmap'
  | 'affordability-calculator'
  | 'script-generator'
  | 'market-position-indicator'
  | 'neighborhood-insights';

export interface RentTrendChartData {
  historical: {
    date: string;
    rent: number;
    change?: number;
  }[];
  predictions: {
    date: string;
    rent: number;
    confidence: number;
    lowerBound: number;
    upperBound: number;
  }[];
  currentPosition: number;
  trendDirection: 'increasing' | 'decreasing' | 'stable';
  insights: string[];
}

export interface PropertyComparisonData {
  targetProperty: {
    rent: number;
    bedrooms: number;
    bathrooms: number;
    squareFootage?: number;
    amenities: string[];
    address?: string;
  };
  comparables: Array<{
    rent: number;
    bedrooms: number;
    bathrooms: number;
    squareFootage?: number;
    amenities: string[];
    address?: string;
    distance?: string;
    listingUrl?: string;
  }>;
  analysis: {
    position: 'above_market' | 'below_market' | 'at_market';
    negotiationRoom: string;
    leverage: string[];
    recommendations: string[];
  };
}

export interface NegotiationRoadmapData {
  // Strategy Overview
  strategy: {
    type: 'assertive_collaborative' | 'strategic_patience' | 'relationship_building' | 'collaborative_approach' | 'leverage_focused';
    name: string;
    description: string;
    reasoning: string;
  };
  
  // Success Metrics
  successProbability: {
    overall: number; // 0-100
    breakdown: {
      marketConditions: number;
      relationshipStrength: number;
      timingOptimality: number;
      strategyAlignment: number;
    };
    confidenceInterval: { min: number; max: number };
  };
  
  // Leverage Analysis
  leverageScore: {
    total: number; // 0-10
    factors: {
      market: number;
      financial: number;
      relationship: number;
      timing: number;
    };
    strengths: string[];
    weaknesses: string[];
  };
  
  // Timeline & Phases
  timeline: {
    estimatedDuration: string;
    phases: Array<{
      id: number;
      name: string;
      duration: string;
      status: 'pending' | 'active' | 'completed';
      description: string;
    }>;
  };
  
  // Detailed Steps
  steps: Array<{
    id: number;
    phase: number;
    title: string;
    description: string;
    status: 'pending' | 'active' | 'completed' | 'skipped';
    difficulty: 'easy' | 'medium' | 'hard';
    estimatedTime: string;
    
    // Action Items
    actionItems: Array<{
      type: 'research' | 'document' | 'communicate' | 'wait' | 'analyze';
      description: string;
      template?: string;
      automated: boolean;
      priority: 'high' | 'medium' | 'low';
    }>;
    
    // Success Criteria
    successMetrics: string[];
    tips: string[];
    riskFactors: string[];
    
    // Communication
    templates?: {
      email?: string;
      phoneScript?: string;
      followUp?: string;
    };
  }>;
  
  // Real-time Guidance
  currentRecommendations: string[];
  warningFlags: string[];
  opportunityAlerts: string[];
  nextBestActions: string[];
  
  // Market Context
  marketContext: {
    currentRent: number;
    targetRent: number;
    marketPosition: 'below' | 'at' | 'above' | 'significantly_above';
    comparableRange: { min: number; max: number; median: number };
    negotiationRoom: number; // percentage
  };

  // Enhanced Market Intelligence (from RAG)
  marketIntelligence?: {
    comparableProperties: Array<{
      address?: string;
      rent: number;
      size?: string;
      type?: string;
      distance?: string;
    }>;
    marketTrends: {
      avgRent?: number;
      medianRent?: number;
      rentGrowth?: string;
      vacancyRate?: string;
      marketCondition?: string;
    };
    evidencePoints: string[];
    locationInsights?: string;
  };
  
  // Adaptation Triggers
  adaptationTriggers: Array<{
    condition: string;
    suggestedAdjustment: string;
    impact: 'minor' | 'moderate' | 'major';
  }>;
}

export interface MarketHeatmapData {
  center: { lat: number; lng: number };
  properties: Array<{
    lat: number;
    lng: number;
    price: number;
    bedrooms: number;
    address: string;
    type: 'comparable' | 'target' | 'other';
  }>;
  priceRanges: {
    low: number;
    median: number;
    high: number;
  };
  userProperty?: {
    lat: number;
    lng: number;
    price: number;
  };
}

export interface AffordabilityCalculatorData {
  income: number;
  currentRent: number;
  recommendedMax: number;
  savingsWithNegotiation: number;
  breakdown: {
    thirtyPercent: number;
    currentPercentage: number;
    postNegotiation: number;
  };
  recommendations: string[];
}

export interface MarketPositionIndicatorData {
  currentRent: number;
  marketMedian: number;
  percentile: number;
  status: 'excellent_deal' | 'good_value' | 'market_rate' | 'above_market' | 'overpriced';
  message: string;
  confidence: number;
}

export interface NeighborhoodInsightsData {
  location: string;
  metrics: {
    walkScore: number;
    transitScore: number;
    crimeIndex: 'low' | 'moderate' | 'high';
    schoolRating: number;
  };
  amenities: {
    restaurants: number;
    grocery: number;
    hospitals: number;
    parks: number;
  };
  marketDynamics: {
    averageRent: number;
    yearOverYear: number;
    inventory: 'low' | 'moderate' | 'high';
    daysOnMarket: number;
  };
}

export interface ChatResponseWithArtifacts {
  text: string;
  artifacts: VisualArtifact[];
  metadata: {
    contextUsed: string[];
    confidence: number;
    triggerWords: string[];
  };
}