
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
}

async function getRentalComps(details: PropertyDetails) {
  const response = await fetch(`${RENTCAST_API_URL}/rental-comps`, {
    method: 'POST',
    headers: {
      'X-API-KEY': RENTCAST_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      address: details.address,
      bedrooms: details.bedrooms,
      bathrooms: details.bathrooms,
      propertyType: "Apartment",
      squareFootage: details.squareFootage,
      limit: 10
    }),
  });

  if (!response.ok) {
    throw new Error(`RentCast API error: ${response.status}`);
  }

  return response.json();
}

async function getMarketStats(zipCode: string) {
  const response = await fetch(`${RENTCAST_API_URL}/markets?zipCode=${zipCode}`, {
    headers: {
      'X-API-KEY': RENTCAST_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`RentCast API error: ${response.status}`);
  }

  return response.json();
}

function analyzePrice(price: number, comps: any[]): {
  assessment: 'overpriced' | 'fair' | 'underpriced';
  percentDiff: number;
  averagePrice: number;
} {
  const compPrices = comps.map(c => c.price);
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { propertyDetails } = await req.json();
    console.log("Analyzing property:", propertyDetails);

    const [compsData, marketData] = await Promise.all([
      getRentalComps(propertyDetails),
      getMarketStats(propertyDetails.zipCode)
    ]);

    console.log("Got rental comps:", compsData);
    console.log("Got market data:", marketData);

    const priceAnalysis = analyzePrice(propertyDetails.price, compsData.properties || []);
    const negotiationStrategy = getNegotiationStrategy(priceAnalysis);

    const response = {
      analysis: {
        subjectProperty: propertyDetails,
        priceAnalysis,
        marketTrends: marketData,
        comparables: compsData.properties || [],
        negotiationStrategy
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
