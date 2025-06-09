
import { supabase } from "@/integrations/supabase/client";
import { PropertyComparisonResponse, PropertyDetails } from "@/shared/types/comparison";
import { toast } from "@/shared/hooks/use-toast";
import { unifiedPropertyService, type UnifiedPropertyData } from "@/services/unifiedPropertyService";

// Enhanced property extraction using unified service
export async function extractPropertyData(
  input: string, 
  userId?: string
): Promise<PropertyDetails> {
  try {
    console.log("🔍 Extracting property data from:", input);
    
    let unifiedData: UnifiedPropertyData;
    
    // Check if input is a URL or address/property details
    const urlRegex = /(https?:\/\/[^\s]+)/i;
    const isUrl = urlRegex.test(input);
    
    if (isUrl) {
      // Extract URL and analyze
      const urlMatch = input.match(urlRegex);
      const url = urlMatch?.[0];
      if (!url) throw new Error("Invalid URL format");
      
      unifiedData = await unifiedPropertyService.analyzePropertyUrl(url, {
        includeRentCast: true,
        includeComparables: true,
        saveToMemory: !!userId,
        userId
      });
    } else {
      // Parse manual property details
      const propertyDetails = parsePropertyDetails(input);
      
      unifiedData = await unifiedPropertyService.analyzePropertyDetails(propertyDetails, {
        includeRentCast: true,
        saveToMemory: !!userId,
        userId
      });
    }
    
    // Convert to PropertyDetails format for compatibility
    const propertyDetails: PropertyDetails = {
      address: unifiedData.address,
      zipCode: unifiedData.zipcode,
      bedrooms: typeof unifiedData.beds === 'number' ? unifiedData.beds : parseInt(unifiedData.beds?.toString() || '0'),
      bathrooms: typeof unifiedData.baths === 'number' ? unifiedData.baths : parseFloat(unifiedData.baths?.toString() || '0'),
      squareFootage: typeof unifiedData.sqft === 'number' ? unifiedData.sqft : parseInt(unifiedData.sqft?.toString() || '0'),
      price: unifiedData.rent,
      propertyType: unifiedData.propertyName ? 'Apartment' : undefined,
      url: unifiedData.sourceUrl,
      // Enhanced data from unified service
      marketAnalysis: {
        verdict: unifiedData.verdict,
        marketAverage: unifiedData.marketAverage,
        deltaPercent: unifiedData.deltaPercent,
        rentcastAnalysis: unifiedData.rentcastAnalysis,
        scrapingMethod: unifiedData.scrapingMethod,
        unitId: unifiedData.unitId
      }
    };
    
    console.log("✅ Property data extracted:", propertyDetails);
    return propertyDetails;
    
  } catch (error) {
    console.error("❌ Property extraction failed:", error);
    throw new Error(`Failed to extract property data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Parse manual property details from text input
function parsePropertyDetails(text: string): Partial<UnifiedPropertyData> {
  const details: Partial<UnifiedPropertyData> = {};
  
  // Extract rent
  const rentMatch = text.match(/\$?(\d{1,4}),?(\d{3})/);
  if (rentMatch) {
    details.rent = parseInt(rentMatch[1] + rentMatch[2]);
  }
  
  // Extract bedrooms
  const bedsMatch = text.match(/(\d+)\s*(?:bed|br|bedroom)/i);
  if (bedsMatch) {
    details.beds = parseInt(bedsMatch[1]);
  }
  
  // Extract bathrooms
  const bathsMatch = text.match(/(\d+(?:\.\d)?)\s*(?:bath|ba|bathroom)/i);
  if (bathsMatch) {
    details.baths = parseFloat(bathsMatch[1]);
  }
  
  // Extract square footage
  const sqftMatch = text.match(/(\d+)\s*(?:sq\.?\s?ft|sqft|square\s+feet)/i);
  if (sqftMatch) {
    details.sqft = parseInt(sqftMatch[1]);
  }
  
  // Extract address (anything that looks like an address)
  const addressMatch = text.match(/\d+\s+[A-Za-z\s]+(?:st|street|ave|avenue|dr|drive|rd|road|blvd|boulevard|way|lane|ln|ct|court|pl|place)\b.*/i);
  if (addressMatch) {
    details.address = addressMatch[0].trim();
  } else {
    // Fallback: use the whole text as address if no specific address pattern found
    details.address = text.trim();
  }
  
  // Extract zip code
  const zipMatch = text.match(/\b(\d{5}(?:-\d{4})?)\b/);
  if (zipMatch) {
    details.zipcode = zipMatch[1];
  }
  
  return details;
}

// Enhanced comparison with unified data
export async function compareProperties(properties: PropertyDetails[]): Promise<PropertyComparisonResponse> {
  try {
    console.log("🏠 Starting enhanced property comparison:", properties.length, "properties");
    
    // Log rich market data
    properties.forEach((prop, index) => {
      console.log(`Property ${index + 1}:`, {
        address: prop.address,
        price: prop.price,
        verdict: prop.marketAnalysis?.verdict,
        marketAverage: prop.marketAnalysis?.marketAverage,
        comparables: prop.marketAnalysis?.rentcastAnalysis?.comparables?.length || 0
      });
    });
    
    console.log("📊 Sending enhanced properties for comparison...");
    
    const { data, error } = await supabase.functions.invoke('property-comparison', {
      body: { properties }
    });

    if (error) {
      console.error("Error from property-comparison function:", error);
      throw new Error(error.message || "Error comparing properties");
    }

    if (!data) {
      throw new Error("No data returned from property comparison");
    }

    console.log("✅ Enhanced comparison results:", data);
    return data;
  } catch (error: any) {
    console.error("❌ Error in enhanced compareProperties:", error);
    
    toast({
      title: "Property Comparison Failed",
      description: error.message || "Unable to compare properties. Please try again.",
      variant: "destructive",
    });
    
    throw error;
  }
}
