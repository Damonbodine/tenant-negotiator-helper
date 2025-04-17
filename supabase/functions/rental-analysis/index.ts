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
  
  const queryParams = new URLSearchParams({
    zip: details.zipCode,
    bedrooms: details.bedrooms.toString(),
    bathrooms: details.bathrooms.toString(),
    propertyType: details.propertyType,
    limit: "10"
  });
  
  const url = `${RENTCAST_API_URL}/properties?${queryParams}`;
  console.log("Calling RentCast API with URL:", url);
  
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
    throw new Error(`RentCast search API error: ${response.status}`);
  }

  return response.json();
}

async function getRentEstimate(details: PropertyDetails) {
  console.log("Getting rent estimate:", details);
  
  const queryParams = new URLSearchParams({
    address: details.address,
    bedrooms: details.bedrooms.toString(),
    bathrooms: details.bathrooms.toString(),
    propertyType: details.propertyType
  });
  
  const url = `${RENTCAST_API_URL}/rental-estimate?${queryParams}`;
  console.log("Calling RentCast API with URL:", url);
  
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
    throw new Error(`RentCast estimate API error: ${response.status}`);
  }

  return response.json();
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

    // Fetch property details and rent estimate
    let propertySearchData, rentEstimateData;
    try {
      propertySearchData = await getPropertyDetails(propertyDetails);
      rentEstimateData = await getRentEstimate(propertyDetails);
      
      console.log("Property search results:", JSON.stringify(propertySearchData).substring(0, 200) + "...");
      console.log("Rent estimate results:", JSON.stringify(rentEstimateData).substring(0, 200) + "...");
    } catch (error) {
      console.error("Error fetching RentCast data:", error);
      return new Response(JSON.stringify({
        success: false,
        error: `Failed to fetch property data: ${error.message}`,
        technicalError: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Map comparable properties from the search results
    // Adjust this based on actual RentCast API response format
    const comparables = (propertySearchData.records || propertySearchData.properties || [])
      .map(prop => ({
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
