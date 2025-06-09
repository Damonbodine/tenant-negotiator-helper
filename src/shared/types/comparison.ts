
export interface PropertyDetails {
  address: string;
  zipCode: string;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  price: number;
  propertyType?: string;
  url?: string;
  // Enhanced market analysis from unified service
  marketAnalysis?: {
    verdict: 'under-priced' | 'over-priced' | 'priced right' | 'unknown';
    marketAverage?: number;
    deltaPercent?: string;
    rentcastAnalysis?: {
      estimate: number;
      confidence: number;
      comparables: Array<{
        address: string;
        rent: number;
        distance: number;
        bedrooms: number;
        bathrooms: number;
      }>;
      marketData?: {
        averageRent: number;
        medianRent: number;
        pricePerSqft: number;
      };
      verdict: string;
    };
    scrapingMethod?: string;
    unitId?: string;
  };
}

export interface PropertyComparisonResponse {
  properties: PropertyDetails[];
  analysis: string;
  recommendations?: string;
  bestValue?: number; // Index of the property considered the best value
}

export interface PropertyComparisonRequest {
  properties: PropertyDetails[];
}
