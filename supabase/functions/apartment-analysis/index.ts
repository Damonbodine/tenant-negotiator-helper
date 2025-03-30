
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to find comparables based on property details
async function findComparableProperties(
  zipCode: string, 
  propertyType: string,
  bedrooms: number,
  squareFootage: number
) {
  console.log(`Attempting to find comparable properties for zip: ${zipCode}`);
  const apifyApiKey = Deno.env.get("APIFY_API_KEY");
  if (!apifyApiKey) {
    throw new Error("APIFY_API_KEY not set for comp search");
  }

  // Use the Zillow zipcode search actor
  const searchZipUrl = "https://api.apify.com/v2/acts/maxcopell~zillow-zip-search/run-sync-get-dataset-items";

  const searchInput = {
    zipcode: zipCode,
    isForSale: false,
    isForRent: true
  };

  console.log("Calling zillow-zip-search actor with input:", JSON.stringify(searchInput));

  const response = await fetch(searchZipUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apifyApiKey}`
    },
    body: JSON.stringify(searchInput)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Apify zip search actor error: ${response.status} - ${errorText}`);
    throw new Error(`Apify zip search actor returned status ${response.status}`);
  }

  const data = await response.json();
  console.log(`Received ${data.length} items from zip search actor`);
  
  // Filter properties based on criteria
  const filteredComps = data.filter((comp: any) => {
    // Convert to same type for comparison
    const compPropertyType = (comp.homeType || comp.propertyType || "Unknown").toLowerCase();
    const targetPropertyType = propertyType.toLowerCase();
    
    // Match property type
    const typeMatches = compPropertyType.includes(targetPropertyType) || 
                       targetPropertyType.includes(compPropertyType) ||
                       (compPropertyType.includes("apartment") && targetPropertyType.includes("condo")) ||
                       (compPropertyType.includes("condo") && targetPropertyType.includes("apartment"));
    
    // Match bedrooms (exact match)
    const bedroomsMatch = (comp.beds || comp.bedrooms || 0) === bedrooms;
    
    // Square footage within range (±400 sq ft)
    const compSquareFootage = comp.livingArea || comp.area || 0;
    const sqftInRange = Math.abs(compSquareFootage - squareFootage) <= 400;
    
    return typeMatches && bedroomsMatch && sqftInRange;
  });
  
  console.log(`Filtered to ${filteredComps.length} comparable properties`);
  return filteredComps || [];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    const { propertyDetails } = requestData;

    if (!propertyDetails) {
      return new Response(JSON.stringify({ success: false, error: "Property details are required" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }

    const { address, zipCode, bedrooms, bathrooms, price, propertyType, squareFootage } = propertyDetails;
    
    if (!zipCode || !bedrooms || !propertyType || !squareFootage) {
      return new Response(JSON.stringify({ success: false, error: "Missing required property details" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }

    // --- API Key Check ---
    const apifyApiKey = Deno.env.get("APIFY_API_KEY");
    if (!apifyApiKey) {
       return new Response(JSON.stringify({ success: false, error: "APIFY_API_KEY is not configured" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
    }

    let comparablesData = [];
    let analysis;
    let message = null;

    // --- Find Comparable Properties ---
    try {
      console.log(`Attempting to find comparable properties`);
      comparablesData = await findComparableProperties(
        zipCode,
        propertyType,
        bedrooms,
        squareFootage
      );
    } catch(error) {
      console.error(`Error finding comparable properties: ${error.message}`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Failed to find comparable properties: ${error.message}`,
        technicalError: error.message
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
    }

    // --- Process Results and Generate Analysis ---
    if (comparablesData && comparablesData.length > 0) {
      console.log(`Processing ${comparablesData.length} comparables.`);
      
      // Transform raw comp data to the structure frontend expects
      const processedComparables = comparablesData.map((comp: any) => ({
        address: comp.address || "Unknown Address",
        price: comp.price || comp.unformattedPrice || parseInt(comp.price?.replace(/[^0-9]/g, "")) || null,
        bedrooms: comp.beds || comp.bedrooms || null,
        bathrooms: comp.baths || comp.bathrooms || null,
        propertyType: comp.homeType || comp.propertyType || "Unknown",
        distance: comp.distance || 0,
        url: comp.url || comp.detailUrl || "",
        squareFootage: comp.livingArea || comp.area || null
      }));

      // Calculate analysis metrics
      const prices = processedComparables.map(comp => comp.price || 0).filter(p => p > 0);
      const averagePrice = prices.length > 0 ? Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length) : 0;
      const subjectPrice = price || 0;
      const higherPriced = prices.filter(p => p > subjectPrice).length;
      const lowerPriced = prices.filter(p => p < subjectPrice).length;

      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
      const priceRange = maxPrice - minPrice;
      const priceRank = (priceRange > 0 && subjectPrice >= minPrice)
        ? Math.round(((subjectPrice - minPrice) / priceRange) * 100)
        : (prices.length > 0 ? (subjectPrice < minPrice ? 0 : 100) : 50);

      let priceAssessment = "";
      let negotiationStrategy = "";
      
      // Generate assessment/strategy based on priceRank
      if (priceRank < 33) {
        priceAssessment = "This property is priced competitively compared to similar listings.";
        negotiationStrategy = "Price may be firm due to competitive positioning. Focus on other terms or be prepared to offer asking price if market is hot.";
      } else if (priceRank < 66) {
        priceAssessment = "This property is priced around the average for similar listings.";
        negotiationStrategy = "A modest negotiation (1-3% below asking) might be possible. Highlight your strengths as a tenant.";
      } else {
        priceAssessment = "This property is priced at the higher end of the market compared to similar listings.";
        negotiationStrategy = "There's likely room for negotiation (3-7%+ below asking). Reference lower-priced comparable properties found.";
      }

      analysis = {
        subjectProperty: propertyDetails,
        averagePrice,
        higherPriced,
        lowerPriced,
        totalComparables: processedComparables.length,
        comparables: processedComparables,
        priceRank,
        priceAssessment,
        negotiationStrategy
      };
    } else {
      // If no comps found, return error
      return new Response(JSON.stringify({ 
        success: false, 
        error: "No comparable properties found for this listing",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 });
    }

    // --- Return Response ---
    return new Response(
      JSON.stringify({ success: true, analysis, message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    // --- Outer Error Handling ---
    console.error(`Unhandled error in apartment-analysis function: ${error.message}`);
    console.error(`Stack trace: ${error.stack}`);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `An unexpected error occurred: ${error.message}`
      }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
