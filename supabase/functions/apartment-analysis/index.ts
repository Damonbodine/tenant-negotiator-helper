
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to sanitize a URL parameter
function sanitizeUrlParam(url: string): string {
  return encodeURIComponent(url.trim());
}

// Extract property details from URL using the Zillow scraper
async function extractPropertyDetails(url: string) {
  try {
    console.log(`Attempting to extract property details for URL: ${url}`);
    
    // Get the APIFY API key from environment variables
    const apifyApiKey = Deno.env.get("APIFY_API_KEY");
    
    if (!apifyApiKey) {
      console.error("APIFY_API_KEY not set");
      throw new Error("APIFY_API_KEY not set");
    }
    
    // Extract the zipcode for later
    const zipCodeMatch = url.match(/-(\d{5})\//) || ["", "78705"];
    
    // First try with the detail scraper which is better for individual property listings
    console.log("Using detail scraper first (better for property details)");
    const detailScraperUrl = "https://api.apify.com/v2/acts/maxcopell~zillow-detail-scraper/run-sync-get-dataset-items";
    
    const detailResponse = await fetch(detailScraperUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apifyApiKey}`
      },
      body: JSON.stringify({
        "propertyUrls": [url]
      })
    });
    
    if (!detailResponse.ok) {
      const errorText = await detailResponse.text();
      console.error(`Apify detail scraper error: ${detailResponse.status} - ${errorText}`);
      throw new Error(`Apify detail scraper returned status ${detailResponse.status}`);
    }
    
    const detailData = await detailResponse.json();
    console.log(`Received ${detailData.length} items from detail scraper`);
    
    if (detailData && detailData.length > 0) {
      const propertyData = detailData[0];
      console.log("Detail scraper property data:", JSON.stringify(propertyData));
      
      return {
        address: propertyData.address || `Unknown Address, ${zipCodeMatch[1]}`,
        zipCode: zipCodeMatch[1],
        bedrooms: propertyData.beds || propertyData.bedrooms || 1,
        bathrooms: propertyData.baths || propertyData.bathrooms || 1,
        price: propertyData.price || 1500,
        propertyType: (propertyData.homeType || propertyData.propertyType || "Condo"),
        squareFootage: propertyData.livingArea || propertyData.area || 700
      };
    }
    
    // Fallback to the search scraper
    console.log("Detail scraper returned no data, trying search scraper");
    const searchScraperUrl = "https://api.apify.com/v2/acts/maxcopell~zillow-scraper/run-sync-get-dataset-items";
    
    const searchResponse = await fetch(searchScraperUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apifyApiKey}`
      },
      body: JSON.stringify({
        "searchUrls": [url],
        "maxItems": 1
      })
    });
    
    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error(`Apify search scraper error: ${searchResponse.status} - ${errorText}`);
      throw new Error(`Apify search scraper returned status ${searchResponse.status}`);
    }
    
    const searchData = await searchResponse.json();
    console.log(`Received ${searchData.length} items from search scraper`);
    
    if (searchData && searchData.length > 0) {
      const propertyData = searchData[0];
      console.log("Search scraper property data:", JSON.stringify(propertyData));
      
      return {
        address: propertyData.address || `Unknown Address, ${zipCodeMatch[1]}`,
        zipCode: zipCodeMatch[1],
        bedrooms: propertyData.beds || 1,
        bathrooms: propertyData.baths || 1,
        price: propertyData.unformattedPrice || parseInt(propertyData.price?.replace(/[^0-9]/g, "")) || 1500,
        propertyType: propertyData.statusText?.includes("Condo") ? "Condo" : 
                   propertyData.statusText?.includes("Apartment") ? "Apartment" : "House",
        squareFootage: propertyData.area || 700
      };
    }
    
    // If we get here, neither scraper worked
    throw new Error("No property data returned from any scraper");
  } catch (error) {
    console.error("Error extracting property details:", error.message);
    console.error("Stack trace:", error.stack);
    throw error;
  }
}

// Function to find comparables
async function findComparableProperties(zipCode: string, propertyType?: string, bedrooms?: number | null) {
  console.log(`Attempting to find comparable properties for zip: ${zipCode}`);
  const apifyApiKey = Deno.env.get("APIFY_API_KEY");
  if (!apifyApiKey) {
    throw new Error("APIFY_API_KEY not set for comp search");
  }

  const searchScraperUrl = "https://api.apify.com/v2/acts/maxcopell~zillow-scraper/run-sync-get-dataset-items";

  const searchZillowUrl = `https://www.zillow.com/homes/for_rent/${zipCode}_rb/`;
  const searchInput = {
    searchUrls: [searchZillowUrl],
    maxItems: 15
  };

  console.log("Calling zillow-scraper with input:", JSON.stringify(searchInput));

  const response = await fetch(searchScraperUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apifyApiKey}`
    },
    body: JSON.stringify(searchInput)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Apify search scraper error for comps: ${response.status} - ${errorText}`);
    throw new Error(`Apify search scraper for comps returned status ${response.status}`);
  }

  const data = await response.json();
  console.log(`Received ${data.length} items from search scraper for comps`);
  return data || [];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    const { zillowUrl } = requestData;

    if (!zillowUrl) {
      return new Response(JSON.stringify({ success: false, error: "Zillow URL is required" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }

    // --- API Key Check ---
    const apifyApiKey = Deno.env.get("APIFY_API_KEY");
    if (!apifyApiKey) {
       return new Response(JSON.stringify({ success: false, error: "APIFY_API_KEY is not configured" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
    }

    let subjectPropertyDetails;
    let realComparablesData = [];
    let analysis;
    let message = null;

    // --- Step 1: Extract Subject Property Details ---
    try {
      console.log(`Attempting to extract real property details using Apify`);
      subjectPropertyDetails = await extractPropertyDetails(zillowUrl);
    } catch (error) {
      console.error(`Error extracting subject property details: ${error.message}`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Failed to extract property details: ${error.message}`,
        technicalError: error.message
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
    }

    // --- Step 2: Find Real Comparable Properties ---
    try {
       if (subjectPropertyDetails?.zipCode) {
          console.log(`Attempting to find real comparable properties`);
          realComparablesData = await findComparableProperties(
             subjectPropertyDetails.zipCode,
             subjectPropertyDetails.propertyType,
             subjectPropertyDetails.bedrooms
          );
       } else {
          console.warn("Cannot search for comps, missing zip code from subject property.");
          return new Response(JSON.stringify({ 
            success: false, 
            error: "Missing zip code from property details"
          }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
       }
    } catch(error) {
       console.error(`Error finding comparable properties: ${error.message}`);
       return new Response(JSON.stringify({ 
         success: false, 
         error: `Failed to find comparable properties: ${error.message}`,
         technicalError: error.message
       }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
    }

    // --- Step 3: Process Results and Generate Analysis ---
    if (realComparablesData && realComparablesData.length > 0) {
      console.log(`Processing ${realComparablesData.length} real comparables.`);
      // Filter out the subject property itself if it appears in comps
      const filteredComps = realComparablesData.filter(comp => comp.address !== subjectPropertyDetails.address);

       // Transform raw comp data to the structure frontend expects
       const processedComparables = filteredComps.map(comp => ({
         address: comp.address || "Unknown Address",
         price: comp.unformattedPrice || parseInt(comp.price?.replace(/[^0-9]/g, "")) || null,
         bedrooms: comp.beds || comp.bedrooms || null,
         bathrooms: comp.baths || comp.bathrooms || null,
         propertyType: comp.homeType || comp.propertyType || "Unknown",
         distance: comp.distance || 0,
         url: comp.url || comp.detailUrl || "",
         squareFootage: comp.livingArea || comp.area || null
       }));

       // Calculate analysis metrics based on REAL comparables
       const prices = processedComparables.map(comp => comp.price || 0).filter(p => p > 0);
       const averagePrice = prices.length > 0 ? Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length) : 0;
       const subjectPrice = subjectPropertyDetails.price || 0;
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
       
       // Generate assessment/strategy based on REAL priceRank
        if (priceRank < 33) {
           priceAssessment = "This property is priced competitively compared to recent listings.";
           negotiationStrategy = "Price may be firm due to competitive positioning. Focus on other terms or be prepared to offer asking price if market is hot.";
        } else if (priceRank < 66) {
           priceAssessment = "This property is priced around the average for similar listings.";
           negotiationStrategy = "A modest negotiation (1-3% below asking) might be possible. Highlight your strengths as a tenant.";
        } else {
           priceAssessment = "This property is priced at the higher end of the market compared to similar listings.";
           negotiationStrategy = "There's likely room for negotiation (3-7%+ below asking). Reference lower-priced comparable properties found.";
        }

       analysis = {
         subjectProperty: subjectPropertyDetails,
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
       // If no real comps found, return error
       return new Response(JSON.stringify({ 
         success: false, 
         error: "No comparable properties found for this listing",
       }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 });
    }

    // --- Step 4: Return Response ---
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
