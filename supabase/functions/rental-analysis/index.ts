
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RENTCAST_API_KEY = Deno.env.get('RENTCAST_API_KEY')!;
const RENTCAST_API_URL = "https://api.rentcast.io/v1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PropertyDetails {
  address: string;
  zipCode: string;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  price: number;
  propertyType: string;
}

async function getPropertyDetails(details: PropertyDetails) {
  console.log("Searching for property details:", details);
  
  // Format property type for RentCast API
  const propertyTypeMap: Record<string, string> = {
    "Apartment": "apartment",
    "Condo": "condo",
    "House": "single_family",
    "Townhouse": "townhome",
    "Loft": "apartment",
    "Duplex": "apartment"
  };
  
  const mappedPropertyType = propertyTypeMap[details.propertyType] || "apartment";
  
  const queryParams = new URLSearchParams({
    zip: details.zipCode,
    bedrooms: details.bedrooms.toString(),
    bathrooms: details.bathrooms.toString(),
    propertyType: mappedPropertyType,
    limit: "10"
  });
  
  const url = `${RENTCAST_API_URL}/properties?${queryParams}`;
  console.log("Calling RentCast properties API with URL:", url);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-KEY': RENTCAST_API_KEY,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`RentCast API error (${response.status}):`, errorText);
      
      // Try alternative search if property search fails
      if (response.status === 404 || response.status === 400) {
        console.log("Attempting fallback property search by zip code only");
        return getFallbackPropertiesByZip(details.zipCode, details.bedrooms);
      }
      
      throw new Error(`RentCast search API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error in getPropertyDetails:", error);
    // Try alternative search if property search fails
    return getFallbackPropertiesByZip(details.zipCode, details.bedrooms);
  }
}

async function getFallbackPropertiesByZip(zipCode: string, bedrooms: number) {
  console.log("Using fallback property search with zip code only:", zipCode);
  
  const queryParams = new URLSearchParams({
    zip: zipCode,
    limit: "10"
  });
  
  const url = `${RENTCAST_API_URL}/properties?${queryParams}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-API-KEY': RENTCAST_API_KEY,
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Fallback RentCast API error (${response.status}):`, errorText);
    return { properties: [] };  // Return empty array as fallback
  }

  const data = await response.json();
  
  // Filter by bedrooms if we have results
  if (data && data.properties && data.properties.length > 0) {
    data.properties = data.properties.filter((p: any) => {
      // Allow properties with the same number of bedrooms or +/- 1
      return !p.bedrooms || Math.abs(p.bedrooms - bedrooms) <= 1;
    });
  }
  
  return data;
}

async function getRentEstimate(details: PropertyDetails) {
  console.log("Getting rent estimate:", details);
  
  try {
    // Format the address for the API call
    const formattedAddress = encodeURIComponent(
      `${details.address}, ${details.zipCode}`
    );
    
    // Format property type for RentCast API
    const propertyTypeMap: Record<string, string> = {
      "Apartment": "apartment",
      "Condo": "condo",
      "House": "single_family",
      "Townhouse": "townhome",
      "Loft": "apartment",
      "Duplex": "apartment"
    };
    
    const mappedPropertyType = propertyTypeMap[details.propertyType] || "apartment";
    
    const url = `${RENTCAST_API_URL}/rental-estimate?address=${formattedAddress}&bedrooms=${details.bedrooms}&bathrooms=${details.bathrooms}&propertyType=${mappedPropertyType}`;
    console.log("Calling RentCast rental-estimate API with URL:", url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-KEY': RENTCAST_API_KEY,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`RentCast estimate API error (${response.status}):`, errorText);
      return null; // Return null instead of throwing to allow the function to continue
    }

    return await response.json();
  } catch (error) {
    console.error("Error in getRentEstimate:", error);
    return null; // Return null instead of throwing to allow the function to continue
  }
}

function analyzePrice(inputPrice: number, comparables: any[]): {
  assessment: 'overpriced' | 'fair' | 'underpriced';
  percentDiff: number;
  averagePrice: number;
} {
  if (!comparables || comparables.length === 0) {
    return {
      assessment: 'fair',
      percentDiff: 0,
      averagePrice: inputPrice
    };
  }
  
  const compPrices = comparables
    .map(c => c.rentalPrice || c.price || 0)
    .filter(p => p > 0);
  
  if (compPrices.length === 0) {
    return {
      assessment: 'fair',
      percentDiff: 0,
      averagePrice: inputPrice
    };
  }
  
  const averagePrice = compPrices.reduce((a, b) => a + b, 0) / compPrices.length;
  const percentDiff = ((inputPrice - averagePrice) / averagePrice) * 100;

  let assessment: 'overpriced' | 'fair' | 'underpriced';
  if (percentDiff > 5) {
    assessment = 'overpriced';
  } else if (percentDiff < -5) {
    assessment = 'underpriced';
  } else {
    assessment = 'fair';
  }

  return {
    assessment,
    percentDiff,
    averagePrice
  };
}

function getNegotiationStrategy(analysis: {
  assessment: 'overpriced' | 'fair' | 'underpriced';
  percentDiff: number;
  averagePrice: number;
}): string {
  switch (analysis.assessment) {
    case 'overpriced':
      return `This unit appears to be overpriced by ${Math.abs(analysis.percentDiff).toFixed(1)}%. 
      Consider negotiating with these points:
      1. Show comparable units in the area averaging $${Math.round(analysis.averagePrice)}
      2. Offer to sign a longer lease term for a lower rate
      3. Ask about move-in specials or rent concessions
      4. Request some utilities to be included`;
    
    case 'fair':
      return `The price appears fair for the market. While major price negotiations might be difficult, you could:
      1. Ask about included utilities or amenities
      2. Negotiate lease length for better terms
      3. Request minor upgrades or maintenance
      4. Ask about reduced security deposit`;
    
    case 'underpriced':
      return `This unit is priced ${Math.abs(analysis.percentDiff).toFixed(1)}% below market average. 
      Recommended actions:
      1. Act quickly as this is a good deal
      2. Have your application and documents ready
      3. Verify the listing is legitimate
      4. Consider offering a longer lease term to secure the rate`;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { propertyDetails } = await req.json();
    console.log("Analyzing property:", propertyDetails);

    // Check if required API key is available
    if (!RENTCAST_API_KEY) {
      console.error("Missing required RENTCAST_API_KEY");
      return new Response(JSON.stringify({
        success: false,
        error: "API configuration error: Missing RentCast API key"
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check for required property details
    if (!propertyDetails || !propertyDetails.zipCode || !propertyDetails.bedrooms) {
      console.error("Missing required property details");
      return new Response(JSON.stringify({
        success: false,
        error: "Missing required property details. ZIP code and bedrooms are required."
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch property details and rent estimate
    let propertySearchData;
    try {
      propertySearchData = await getPropertyDetails(propertyDetails);
      console.log("Property search results received, properties count:", 
        propertySearchData?.properties?.length || 0);
    } catch (error) {
      console.error("Error fetching RentCast property data:", error);
      return new Response(JSON.stringify({
        success: false,
        error: `Failed to fetch property data: ${error.message}`,
        technicalError: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Get rent estimate (optional - might be null)
    const rentEstimateData = await getRentEstimate(propertyDetails);
    if (rentEstimateData) {
      console.log("Rent estimate results received:", 
        JSON.stringify(rentEstimateData).substring(0, 200) + "...");
    } else {
      console.log("No rent estimate available for this property");
    }

    // Map comparable properties from the search results
    const properties = propertySearchData?.properties || [];
    if (properties.length === 0) {
      console.log("No comparable properties found");
    }
    
    const comparables = properties.map(prop => ({
      address: prop.formattedAddress || prop.address || 'Unknown Address',
      price: prop.rentalPrice || prop.price || null,
      bedrooms: prop.bedrooms || null,
      bathrooms: prop.bathrooms || null,
      propertyType: prop.propertyType || 'Apartment',
      distance: prop.distance || 0,
      url: prop.detailUrl || '',
      squareFootage: prop.squareFootage || null
    }))
    .filter(c => c.price !== null);

    console.log(`Processed ${comparables.length} comparable properties`);

    // Analyze price
    const priceAnalysis = analyzePrice(propertyDetails.price, comparables);
    const negotiationStrategy = getNegotiationStrategy(priceAnalysis);

    // Prepare response
    const response = {
      analysis: {
        subjectProperty: propertyDetails,
        averagePrice: priceAnalysis.averagePrice,
        higherPriced: comparables.filter(c => (c.price || 0) > propertyDetails.price).length,
        lowerPriced: comparables.filter(c => (c.price || 0) < propertyDetails.price).length,
        totalComparables: comparables.length,
        comparables,
        priceRank: comparables.length > 0 ? 
          Math.round((comparables.filter(c => (c.price || 0) < propertyDetails.price).length / comparables.length) * 100) : 
          50,
        priceAssessment: `${propertyDetails.propertyType} in this area typically rent for ${priceAnalysis.assessment === 'overpriced' ? 'less' : priceAnalysis.assessment === 'underpriced' ? 'more' : 'around this price'}. ${priceAnalysis.assessment === 'fair' ? 'Your price is competitive with the market.' : `The price is ${Math.abs(priceAnalysis.percentDiff).toFixed(1)}% ${priceAnalysis.assessment === 'overpriced' ? 'above' : 'below'} the average comparable rental in this area.`}`,
        negotiationStrategy,
        rentEstimate: rentEstimateData || null
      }
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Unexpected error in rental-analysis function:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
