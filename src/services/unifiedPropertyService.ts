/**
 * Unified Property Analysis Service
 * 
 * Combines Firecrawl scraping, RentCast market data, and property extraction
 * into a single, reliable service for both listing analysis and property comparison
 */

import { rentCastService, type RentCastPropertyDetails } from './rentCastService';
import { supabase } from '@/integrations/supabase/client';

export interface UnifiedPropertyData {
  // Basic property information
  address: string;
  city?: string;
  state?: string;
  propertyName?: string;
  rent: number;
  beds: number | string;
  baths: number | string;
  sqft: number | string;
  zipcode: string;
  
  // Enhanced data
  sourceUrl?: string;
  unitId?: string;
  scrapingMethod?: string;
  
  // Market analysis
  verdict: 'under-priced' | 'over-priced' | 'priced right' | 'unknown';
  marketAverage?: number;
  deltaPercent?: string;
  
  // RentCast data
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
  
  // Error handling
  error?: string;
  message?: string;
}

export interface PropertyExtractionOptions {
  includeRentCast?: boolean;
  includeComparables?: boolean;
  saveToMemory?: boolean;
  userId?: string;
}

class UnifiedPropertyService {
  /**
   * Parse city and state from address string
   */
  private parseAddressComponents(address: string): { city: string; state: string } {
    // Simple regex to extract city and state from addresses like "123 Main St, Austin, TX 78753"
    const match = address.match(/,\s*([^,]+),\s*([A-Z]{2})\s*\d{5}/);
    
    if (match) {
      return {
        city: match[1].trim(),
        state: match[2].trim()
      };
    }
    
    // Fallback: try to extract just city, state pattern
    const simpleMatch = address.match(/,\s*([^,]+),\s*([A-Z]{2})/);
    if (simpleMatch) {
      return {
        city: simpleMatch[1].trim(),
        state: simpleMatch[2].trim()
      };
    }
    
    return { city: '', state: '' };
  }

  /**
   * Analyze a property URL using enhanced scraping and market data
   */
  async analyzePropertyUrl(
    url: string, 
    options: PropertyExtractionOptions = { includeRentCast: true, includeComparables: true }
  ): Promise<UnifiedPropertyData> {
    try {
      console.log('🚀 Starting unified property analysis for:', url);
      
      // Use the enhanced listing analyzer edge function
      const { data, error } = await supabase.functions.invoke('listing-analyzer', {
        body: { url }
      });
      
      if (error) {
        throw new Error(error.message || 'Failed to analyze property URL');
      }
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      console.log('✅ Property extraction completed:', data);
      
      // Convert to unified format
      const unifiedData: UnifiedPropertyData = {
        address: data.address || '',
        propertyName: data.propertyName,
        rent: data.rent || 0,
        beds: data.beds || 0,
        baths: data.baths || 0,
        sqft: data.sqft || 0,
        zipcode: data.zipcode || '',
        sourceUrl: data.sourceUrl || url,
        unitId: data.unitId,
        scrapingMethod: data.scrapingMethod,
        verdict: data.verdict || 'unknown',
        marketAverage: data.marketAverage,
        deltaPercent: data.deltaPercent,
        rentcastAnalysis: data.rentcastAnalysis,
        message: data.message
      };
      
      // Save to memory if requested and user provided
      if (options.saveToMemory && options.userId) {
        await this.savePropertyToMemory(unifiedData, options.userId);
      }
      
      return unifiedData;
      
    } catch (error) {
      console.error('Error in unified property analysis:', error);
      throw error;
    }
  }
  
  /**
   * Analyze property details using address/manual input
   */
  async analyzePropertyDetails(
    propertyDetails: Partial<UnifiedPropertyData>,
    options: PropertyExtractionOptions = { includeRentCast: true }
  ): Promise<UnifiedPropertyData> {
    try {
      console.log('🏠 Analyzing property details:', propertyDetails);
      
      // Parse city and state from address if not provided
      const { city, state } = this.parseAddressComponents(propertyDetails.address || '');
      
      let result: UnifiedPropertyData = {
        address: propertyDetails.address || '',
        city: propertyDetails.city || city,
        state: propertyDetails.state || state,
        propertyName: propertyDetails.propertyName,
        rent: propertyDetails.rent || 0,
        beds: propertyDetails.beds || 0,
        baths: propertyDetails.baths || 0,
        sqft: propertyDetails.sqft || 0,
        zipcode: propertyDetails.zipcode || '',
        verdict: 'unknown'
      };
      
      // Get RentCast analysis if enabled and we have enough data
      if (options.includeRentCast && (result.address || result.zipcode)) {
        try {
          const rentCastProperty: RentCastPropertyDetails = {
            address: result.address,
            zipCode: result.zipcode,
            bedrooms: typeof result.beds === 'number' ? result.beds : parseInt(result.beds?.toString() || '0'),
            bathrooms: typeof result.baths === 'number' ? result.baths : parseFloat(result.baths?.toString() || '0'),
            squareFootage: typeof result.sqft === 'number' ? result.sqft : parseInt(result.sqft?.toString() || '0'),
            propertyType: 'Apartment'
          };
          
          const rentCastData = await rentCastService.getComprehensiveAnalysis(rentCastProperty);
          
          if (rentCastData.rentEstimate.estimate > 0 && result.rent > 0) {
            const delta = ((result.rent - rentCastData.rentEstimate.estimate) / rentCastData.rentEstimate.estimate) * 100;
            result.verdict = delta < -5 ? 'under-priced' : delta > 5 ? 'over-priced' : 'priced right';
            result.marketAverage = rentCastData.rentEstimate.estimate;
            result.deltaPercent = delta.toFixed(1);
            
            result.rentcastAnalysis = {
              estimate: rentCastData.rentEstimate.estimate,
              confidence: rentCastData.rentEstimate.confidence,
              comparables: rentCastData.rentEstimate.comparables,
              verdict: result.verdict,
              marketData: rentCastData.marketData ? {
                averageRent: rentCastData.marketData.averageRent,
                medianRent: rentCastData.marketData.medianRent,
                pricePerSqft: rentCastData.marketData.pricePerSquareFoot
              } : undefined
            };
          }
        } catch (rentCastError) {
          console.warn('RentCast analysis failed:', rentCastError);
          // Continue without RentCast data
        }
      }
      
      // Save to memory if requested and user provided
      if (options.saveToMemory && options.userId) {
        await this.savePropertyToMemory(result, options.userId);
      }
      
      return result;
      
    } catch (error) {
      console.error('Error analyzing property details:', error);
      throw error;
    }
  }
  
  /**
   * Compare multiple properties using unified analysis
   */
  async compareProperties(
    properties: Array<string | Partial<UnifiedPropertyData>>,
    options: PropertyExtractionOptions = { includeRentCast: true, includeComparables: true }
  ): Promise<UnifiedPropertyData[]> {
    console.log('📊 Starting property comparison for', properties.length, 'properties');
    
    const results: UnifiedPropertyData[] = [];
    
    for (let i = 0; i < properties.length; i++) {
      const property = properties[i];
      
      try {
        let analysis: UnifiedPropertyData;
        
        if (typeof property === 'string') {
          // URL analysis
          analysis = await this.analyzePropertyUrl(property, options);
        } else {
          // Property details analysis
          analysis = await this.analyzePropertyDetails(property, options);
        }
        
        results.push(analysis);
        console.log(`✅ Property ${i + 1} analyzed:`, analysis.address);
        
      } catch (error) {
        console.error(`❌ Property ${i + 1} analysis failed:`, error);
        results.push({
          address: typeof property === 'string' ? property : property.address || 'Unknown',
          rent: 0,
          beds: 0,
          baths: 0,
          sqft: 0,
          zipcode: '',
          verdict: 'unknown',
          error: error instanceof Error ? error.message : 'Analysis failed'
        });
      }
    }
    
    console.log('🏁 Property comparison complete:', results.length, 'properties analyzed');
    return results;
  }
  
  /**
   * Save property to user memory system
   */
  private async savePropertyToMemory(property: UnifiedPropertyData, userId: string): Promise<void> {
    try {
      console.log('💾 Saving property to memory for user:', userId);
      
      // Save to properties table - using correct column names for actual database schema
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .upsert({
          address: property.address,
          city: property.city || 'Unknown',
          state: property.state || 'Unknown', 
          zip_code: property.zipcode,
          rent_amount: Math.round(property.rent * 100), // Store in cents
          bedrooms: typeof property.beds === 'number' ? property.beds : parseInt(property.beds?.toString() || '0'),
          bathrooms: typeof property.baths === 'number' ? property.baths : parseFloat(property.baths?.toString() || '0'),
          square_feet: typeof property.sqft === 'number' ? property.sqft : parseInt(property.sqft?.toString() || '0'),
          listing_url: property.sourceUrl,
          property_type: 'apartment', // Default type
          property_source: 'listing_analyzer',
          market_analysis: {
            verdict: property.verdict,
            marketAverage: property.marketAverage,
            deltaPercent: property.deltaPercent,
            rentcastAnalysis: property.rentcastAnalysis
          }
        })
        .select()
        .single();
      
      if (propertyError) {
        console.error('Error saving property:', propertyError);
        return;
      }
      
      // Link to user - check if already exists first
      const { data: existingLink } = await supabase
        .from('user_properties')
        .select('id')
        .eq('user_id', userId)
        .eq('property_id', propertyData.id)
        .single();

      if (!existingLink) {
        const { error: linkError } = await supabase
          .from('user_properties')
          .insert({
            user_id: userId,
            property_id: propertyData.id,
            relationship_type: 'analyzed',
            status: 'active',
            priority_level: 1
          });
        
        if (linkError) {
          console.error('Error linking property to user:', linkError);
        } else {
          console.log('✅ Property linked to user successfully');
        }
      } else {
        console.log('✅ Property already linked to user');
      }
      
      console.log('✅ Property saved to memory successfully');
      
    } catch (error) {
      console.error('Error saving property to memory:', error);
    }
  }
}

// Export singleton instance
export const unifiedPropertyService = new UnifiedPropertyService();
export default unifiedPropertyService;