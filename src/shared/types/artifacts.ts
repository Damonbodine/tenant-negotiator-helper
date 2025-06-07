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
  | 'lease-analyzer'
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
  currentRent: number;
  targetRent: number;
  strategy: string;
  steps: Array<{
    step: number;
    action: string;
    status: 'completed' | 'in_progress' | 'pending';
    details?: string;
  }>;
  templates: {
    email?: string;
    phoneScript?: string;
    followUp?: string;
  };
  timeline: string;
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