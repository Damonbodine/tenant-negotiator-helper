
export interface PropertyDetails {
  address: string;
  zipCode: string;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  price: number;
  propertyType?: string;
  url?: string;
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
