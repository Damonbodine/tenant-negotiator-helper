
export interface PropertyDetails {
  address: string;
  zipCode: string;
  bedrooms: number;
  bathrooms: number;
  price: number;
  propertyType: string;
  squareFootage: number;
  url?: string;
}

export interface Comparable {
  address: string;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  propertyType: string;
  distance: number;
  url: string;
  squareFootage: number | null;
}

export interface AnalysisResult {
  subjectProperty: PropertyDetails;
  averagePrice: number;
  higherPriced: number;
  lowerPriced: number;
  totalComparables: number;
  comparables: Comparable[];
  priceRank: number | null;
  priceAssessment: string;
  negotiationStrategy: string;
}
