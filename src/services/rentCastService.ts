/**
 * RentCast API Integration Service
 * 
 * Provides comprehensive rental market data and pricing analysis
 * using RentCast's 140+ million property database
 */

const RENTCAST_API_KEY = '2dcfee21025c4888984b78fdf7dd45c9';
const RENTCAST_BASE_URL = 'https://api.rentcast.io/v1';

export interface RentCastPropertyDetails {
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  propertyType?: 'Single Family' | 'Condo' | 'Townhouse' | 'Manufactured' | 'Multi-Family' | 'Apartment' | 'Land';
  latitude?: number;
  longitude?: number;
}

export interface RentCastEstimate {
  estimate: number;
  confidence: number;
  rentRange: {
    min: number;
    max: number;
  };
  pricePerSquareFoot?: number;
  comparables: RentCastComparable[];
  marketTrends?: {
    averageRent: number;
    priceChange30Days: number;
    priceChange90Days: number;
  };
}

export interface RentCastComparable {
  address: string;
  rent: number;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  distance: number; // in miles
  correlation: number; // similarity score
  propertyType: string;
  listingDate?: string;
}

export interface RentCastMarketData {
  zipCode: string;
  averageRent: number;
  medianRent: number;
  rentTrend30Days: number;
  rentTrend90Days: number;
  activeListings: number;
  pricePerSquareFoot: number;
}

class RentCastService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = RENTCAST_API_KEY;
    this.baseUrl = RENTCAST_BASE_URL;
  }

  /**
   * Get rent estimate for a specific property
   * Primary endpoint for property valuation
   */
  async getRentEstimate(property: RentCastPropertyDetails): Promise<RentCastEstimate> {
    try {
      console.log('🏠 Getting RentCast estimate for:', property.address);
      
      const params = new URLSearchParams();
      
      // Required: Address or coordinates
      if (property.address) {
        params.append('address', property.address);
      } else if (property.latitude && property.longitude) {
        params.append('latitude', property.latitude.toString());
        params.append('longitude', property.longitude.toString());
      } else {
        throw new Error('Address or coordinates required for rent estimate');
      }
      
      // Optional but recommended for accuracy
      if (property.propertyType) params.append('propertyType', property.propertyType);
      if (property.bedrooms !== undefined) params.append('bedrooms', property.bedrooms.toString());
      if (property.bathrooms !== undefined) params.append('bathrooms', property.bathrooms.toString());
      if (property.squareFootage) params.append('squareFootage', property.squareFootage.toString());
      
      const response = await fetch(`${this.baseUrl}/avm/rent/long-term?${params}`, {
        headers: {
          'X-Api-Key': this.apiKey,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('RentCast API error:', response.status, errorText);
        throw new Error(`RentCast API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ RentCast estimate received:', data);
      
      return this.formatRentEstimate(data);
    } catch (error) {
      console.error('Error getting RentCast estimate:', error);
      throw error;
    }
  }

  /**
   * Search for active rental listings in an area
   * Used for market validation and additional comparables
   */
  async getActiveRentals(property: RentCastPropertyDetails, radius: number = 2): Promise<RentCastComparable[]> {
    try {
      console.log('🔍 Searching active rentals near:', property.address);
      
      const params = new URLSearchParams();
      
      // Location parameters
      if (property.address) {
        params.append('address', property.address);
      } else if (property.city && property.state) {
        params.append('city', property.city);
        params.append('state', property.state);
      } else if (property.zipCode) {
        params.append('zipCode', property.zipCode);
      }
      
      params.append('radius', radius.toString());
      params.append('limit', '20'); // Get top 20 comparables
      
      // Property filters for better matching
      if (property.bedrooms !== undefined) params.append('bedrooms', property.bedrooms.toString());
      if (property.bathrooms !== undefined) params.append('bathrooms', property.bathrooms.toString());
      if (property.propertyType) params.append('propertyType', property.propertyType);

      const response = await fetch(`${this.baseUrl}/listings/rental/long-term?${params}`, {
        headers: {
          'X-Api-Key': this.apiKey,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('RentCast listings API error:', response.status, errorText);
        throw new Error(`RentCast listings API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Found ${data.length} active rental listings`);
      
      return this.formatActiveRentals(data);
    } catch (error) {
      console.error('Error getting active rentals:', error);
      // Return empty array instead of throwing - this is supplementary data
      return [];
    }
  }

  /**
   * Get market statistics for a zip code
   * Provides broader market context
   */
  async getMarketData(zipCode: string): Promise<RentCastMarketData | null> {
    try {
      console.log('📊 Getting market data for zip:', zipCode);
      
      const response = await fetch(`${this.baseUrl}/markets/statistics?zipCode=${zipCode}`, {
        headers: {
          'X-Api-Key': this.apiKey,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn('RentCast market data not available for zip:', zipCode);
        return null;
      }

      const data = await response.json();
      console.log('✅ Market data received for:', zipCode);
      
      return this.formatMarketData(data, zipCode);
    } catch (error) {
      console.warn('Error getting market data:', error);
      return null;
    }
  }

  /**
   * Comprehensive property analysis combining all RentCast data
   */
  async getComprehensiveAnalysis(property: RentCastPropertyDetails): Promise<{
    rentEstimate: RentCastEstimate;
    activeRentals: RentCastComparable[];
    marketData: RentCastMarketData | null;
    analysisTime: number;
  }> {
    const startTime = Date.now();
    
    try {
      console.log('🚀 Starting comprehensive RentCast analysis...');
      
      // Run all API calls in parallel for speed
      const [rentEstimate, activeRentals, marketData] = await Promise.allSettled([
        this.getRentEstimate(property),
        this.getActiveRentals(property),
        property.zipCode ? this.getMarketData(property.zipCode) : Promise.resolve(null)
      ]);

      const analysisTime = Date.now() - startTime;
      console.log(`⚡ RentCast analysis completed in ${analysisTime}ms`);

      return {
        rentEstimate: rentEstimate.status === 'fulfilled' ? rentEstimate.value : this.getDefaultEstimate(),
        activeRentals: activeRentals.status === 'fulfilled' ? activeRentals.value : [],
        marketData: marketData.status === 'fulfilled' ? marketData.value : null,
        analysisTime
      };
    } catch (error) {
      console.error('Error in comprehensive analysis:', error);
      throw error;
    }
  }

  // Private helper methods

  private formatRentEstimate(data: any): RentCastEstimate {
    return {
      estimate: data.rent || data.estimate || 0,
      confidence: data.confidence || 0.8,
      rentRange: {
        min: data.rentRangeLow || (data.rent ? data.rent * 0.9 : 0),
        max: data.rentRangeHigh || (data.rent ? data.rent * 1.1 : 0)
      },
      pricePerSquareFoot: data.pricePerSquareFoot,
      comparables: (data.comparables || []).map(this.formatComparable).slice(0, 10),
      marketTrends: data.marketTrends ? {
        averageRent: data.marketTrends.averageRent,
        priceChange30Days: data.marketTrends.priceChange30Days,
        priceChange90Days: data.marketTrends.priceChange90Days
      } : undefined
    };
  }

  private formatComparable(comp: any): RentCastComparable {
    return {
      address: comp.address || 'Address not available',
      rent: comp.rent || comp.price || 0,
      bedrooms: comp.bedrooms || 0,
      bathrooms: comp.bathrooms || 0,
      squareFootage: comp.squareFootage || 0,
      distance: comp.distance || 0,
      correlation: comp.correlation || 0.5,
      propertyType: comp.propertyType || 'Unknown',
      listingDate: comp.listingDate
    };
  }

  private formatActiveRentals(data: any[]): RentCastComparable[] {
    return data.map(this.formatComparable).slice(0, 15);
  }

  private formatMarketData(data: any, zipCode: string): RentCastMarketData {
    return {
      zipCode,
      averageRent: data.averageRent || 0,
      medianRent: data.medianRent || 0,
      rentTrend30Days: data.rentTrend30Days || 0,
      rentTrend90Days: data.rentTrend90Days || 0,
      activeListings: data.activeListings || 0,
      pricePerSquareFoot: data.pricePerSquareFoot || 0
    };
  }

  private getDefaultEstimate(): RentCastEstimate {
    return {
      estimate: 0,
      confidence: 0,
      rentRange: { min: 0, max: 0 },
      comparables: []
    };
  }
}

// Export singleton instance
export const rentCastService = new RentCastService();
export default rentCastService;