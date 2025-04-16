
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

async function getLongTermRentEstimate(details: PropertyDetails) {
  console.log("Getting rent estimate for:", details);
  
  const response = await fetch(`${RENTCAST_API_URL}/ltRentEstimate`, {
    method: 'POST',
    headers: {
      'X-API-KEY': RENTCAST_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      address: details.address,
      bedrooms: details.bedrooms,
      bathrooms: details.bathrooms,
      propertyType: details.propertyType,
      squareFootage: details.squareFootage
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`RentCast API error (${response.status}):`, errorText);
    throw new Error(`RentCast rent estimate API error: ${response.status}`);
  }

  return response.json();
}

async function getComparableProperties(details: PropertyDetails) {
  console.log("Finding comparable properties for zip:", details.zipCode);
  
  // Using the rentcast search API instead of rental-comps
  const response = await fetch(`${RENTCAST_API_URL}/properties`, {
    method: 'POST',
    headers: {
      'X-API-KEY': RENTCAST_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      zip: details.zipCode,
      bedrooms: details.bedrooms,
      bathrooms: details.bathrooms,
      status: "Rental",
      limit: 10
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`RentCast API error (${response.status}):`, errorText);
    throw new Error(`RentCast search API error: ${response.status}`);
  }

  return response.json();
}

function analyzePrice(price: number, comps: any[]): {
  assessment: 'overpriced' | 'fair' | 'underpriced';
  percentDiff: number;
  averagePrice: number;
} {
  if (!comps || comps.length === 0) {
    return {
      assessment: 'fair',
      percentDiff: 0,
      averagePrice: price
    };
  }
  
  const compPrices = comps.map(c => c.price || 0).filter(p => p > 0);
  
  if (compPrices.length === 0) {
    return {
      assessment: 'fair',
      percentDiff: 0,
      averagePrice: price
    };
  }
  
  const averagePrice = compPrices.reduce((a, b) => a + b, 0) / compPrices.length;
  const percentDiff = ((price - averagePrice) / averagePrice) * 100;

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

function mapComparablesToResponseFormat(comps: any[]) {
  if (!comps) return [];
  
  return comps.map(comp => ({
    address: comp.formattedAddress || comp.address || 'Address unknown',
    price: comp.price || null,
    bedrooms: comp.bedrooms || null,
    bathrooms: comp.bathrooms || null,
    propertyType: comp.propertyType || 'Apartment',
    distance: comp.distance || 0,
    url: comp.detailUrl || '',
    squareFootage: comp.squareFootage || null
  })).filter(c => c.price !== null);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { propertyDetails } = await req.json();
    console.log("Analyzing property:", propertyDetails);

    // First try to get comparable properties
    let compsData, comparables;
    try {
      compsData = await getComparableProperties(propertyDetails);
      console.log("Got comparable properties:", compsData);
      comparables = mapComparablesToResponseFormat(compsData.properties || []);
    } catch (error) {
      console.error("Error getting comparable properties:", error);
      return new Response(JSON.stringify({
        success: false,
        error: `Failed to find comparable properties: ${error.message}`,
        technicalError: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If we have no comps, return early with an error
    if (!comparables || comparables.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: "No comparable properties found",
        technicalError: "Search returned zero properties"
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get rent estimate
    let rentEstimate;
    try {
      rentEstimate = await getLongTermRentEstimate(propertyDetails);
      console.log("Got rent estimate:", rentEstimate);
    } catch (error) {
      console.error("Error getting rent estimate, continuing with comps only:", error);
      // We'll continue with just the comps data
    }

    // Analyze the price
    const priceAnalysis = analyzePrice(propertyDetails.price, comparables);
    const negotiationStrategy = getNegotiationStrategy(priceAnalysis);

    // Count higher/lower priced properties
    const higherPriced = comparables.filter(c => (c.price || 0) > propertyDetails.price).length;
    const lowerPriced = comparables.filter(c => (c.price || 0) < propertyDetails.price).length;
    
    // Calculate price rank if possible
    let priceRank = null;
    if (comparables.length > 0) {
      const allPrices = [...comparables.map(c => c.price || 0), propertyDetails.price].sort((a, b) => a - b);
      const index = allPrices.indexOf(propertyDetails.price);
      priceRank = index !== -1 ? (index / allPrices.length) * 100 : null;
    }

    const response = {
      analysis: {
        subjectProperty: propertyDetails,
        averagePrice: priceAnalysis.averagePrice,
        higherPriced,
        lowerPriced,
        totalComparables: comparables.length,
        comparables,
        priceRank,
        priceAssessment: `${propertyDetails.propertyType} in this area typically rent for ${priceAnalysis.assessment === 'overpriced' ? 'less' : priceAnalysis.assessment === 'underpriced' ? 'more' : 'around this price'}. ${priceAnalysis.assessment === 'fair' ? 'Your price is competitive with the market.' : `The price is ${Math.abs(priceAnalysis.percentDiff).toFixed(1)}% ${priceAnalysis.assessment === 'overpriced' ? 'above' : 'below'} the average comparable rental in this area.`}`,
        negotiationStrategy,
        rentEstimate: rentEstimate || null
      }
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error in rental-analysis function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
