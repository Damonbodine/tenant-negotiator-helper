
export interface ListingAnalysisResponse {
  address?: string;
  rent?: number;
  beds?: number | string;
  baths?: number | string;
  sqft?: number | string;
  zipcode?: string;
  marketAverage?: number;
  deltaPercent?: string;
  verdict?: string;
  sourceUrl?: string;
  propertyName?: string;
  message?: string;
  error?: string;
}

export interface AddressAnalysisRequest {
  address: string;
}

export interface AddressAnalysisResponse {
  address: string;
  text: string;
  model?: string;
  error?: string;
  message?: string;
}
