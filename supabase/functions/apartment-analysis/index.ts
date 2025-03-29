import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to sanitize a URL parameter
function sanitizeUrlParam(url: string): string {
  return encodeURIComponent(url.trim());
}

// Function to generate realistic but synthetic data for testing or fallback
function generateFallbackData(zipCode: string, address: string) {
  console.log(`Created fallback property with zip: ${zipCode}, area: ${address}`);
  
  // Extract base price from the zip code (making it somewhat realistic per area)
  const basePrice = parseInt(zipCode) % 100 * 20 + 1500;
  
  // Create synthetic property
  const subjectProperty = {
    address: `297 Main St, ${address}, Austin, TX`,
    zipCode: zipCode || "78705",
    bedrooms: 1,
    bathrooms: 1,
    price: basePrice + 63,
    propertyType: "Condo",
    squareFootage: 730
  };
  
  // Create synthetic comparables
  const comparables = [
    {
      address: "100 Cypress Ave, Austin, TX 78731",
      price: basePrice - 264,
      bedrooms: 1,
      bathrooms: 1,
      propertyType: "Condo",
      distance: 0.1,
      url: "https://www.zillow.com/homedetails/sample",
      squareFootage: 660
    },
    {
      address: "200 Willow Way, Austin, TX 78731",
      price: basePrice - 176,
      bedrooms: 2,
      bathrooms: 1,
      propertyType: "Condo",
      distance: 0.6,
      url: "https://www.zillow.com/homedetails/sample",
      squareFootage: 805
    },
    {
      address: "300 Maple Dr, Austin, TX 78731",
      price: basePrice - 88,
      bedrooms: 2,
      bathrooms: 1.5,
      propertyType: "Condo",
      distance: 2.4,
      url: "https://www.zillow.com/homedetails/sample",
      squareFootage: 689
    },
    {
      address: "400 Spruce St, Austin, TX 78731",
      price: basePrice + 35,
      bedrooms: 1,
      bathrooms: 1,
      propertyType: "Condo",
      distance: 0.4,
      url: "https://www.zillow.com/homedetails/sample",
      squareFootage: 819
    },
    {
      address: "500 Magnolia Ct, Austin, TX 78731",
      price: basePrice + 88,
      bedrooms: 1,
      bathrooms: 1,
      propertyType: "Condo",
      distance: 2.1,
      url: "https://www.zillow.com/homedetails/sample",
      squareFootage: 717
    },
    {
      address: "600 Spruce St, Austin, TX 78731",
      price: basePrice + 176,
      bedrooms: 1,
      bathrooms: 1.5,
      propertyType: "Condo",
      distance: 2.6,
      url: "https://www.zillow.com/homedetails/sample",
      squareFootage: 681
    },
    {
      address: "700 Aspen Ln, Austin, TX 78731",
      price: basePrice + 264,
      bedrooms: 2,
      bathrooms: 1,
      propertyType: "Condo",
      distance: 2.5,
      url: "https://www.zillow.com/homedetails/sample",
      squareFootage: 703
    }
  ];
  
  // Calculate analysis metrics
  const prices = comparables.map(comp => comp.price || 0);
  const averagePrice = Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length);
  const higherPriced = comparables.filter(comp => (comp.price || 0) > (subjectProperty.price || 0)).length;
  const lowerPriced = comparables.filter(comp => (comp.price || 0) < (subjectProperty.price || 0)).length;
  
  // Calculate where the property stands in the price range
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  const relativePricePosition = priceRange > 0 
    ? Math.round(((subjectProperty.price || 0) - minPrice) / priceRange * 100) 
    : 50;
  
  // Generate analysis text based on the price position
  let priceAssessment = "";
  let negotiationStrategy = "";
  
  if (relativePricePosition < 33) {
    priceAssessment = "This property is priced on the lower end compared to similar properties in this area. It appears to be a good value.";
    negotiationStrategy = "Given the property's already competitive pricing, focus on non-price negotiation points like move-in date flexibility or amenities. The landlord may be less willing to lower the price since it's already below market.";
  } else if (relativePricePosition < 66) {
    priceAssessment = "This property is priced slightly below the market average for similar properties in this area. It appears to be reasonably priced.";
    negotiationStrategy = "While this property is well-priced, you could still make a slightly lower offer (1-3% below asking). Emphasize your stability as a tenant and readiness to sign a lease quickly.";
  } else {
    priceAssessment = "This property is priced on the higher end compared to similar properties in the area. There may be room for negotiation.";
    negotiationStrategy = "Given the higher relative price, you have leverage to negotiate. Consider offering 5-7% below asking and highlighting comparable properties at lower price points. Emphasize any periods of vacancy as a cost to the landlord.";
  }
  
  return {
    subjectProperty,
    averagePrice,
    higherPriced,
    lowerPriced,
    totalComparables: comparables.length,
    comparables,
    priceRank: relativePricePosition,
    priceAssessment,
    negotiationStrategy
  };
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

// NEW function to find comparables
async function findComparableProperties(zipCode: string, propertyType?: string, bedrooms?: number | null /* add other criteria? */) {
  console.log(`Attempting to find comparable properties for zip: ${zipCode}`);
  const apifyApiKey = Deno.env.get("APIFY_API_KEY");
  if (!apifyApiKey) {
    throw new Error("APIFY_API_KEY not set for comp search");
  }

  const searchScraperUrl = "https://api.apify.com/v2/acts/maxcopell~zillow-scraper/run-sync-get-dataset-items";

  // === INPUT CONSTRUCTION - CRITICAL - Needs verification from Apify Docs ===
  // Option A: If scraper takes parameters (Hypothetical - USE ACTUAL SCHEMA)
  const searchInput = {
     // What parameters does it REALLY take? zipcode? city? search? query? statusForSaleForRent?
     zipcode: zipCode, // Or maybe 'query': zipCode, or 'location': zipCode ?
     // Add other filters if possible based on actor docs and subject property
     // propertyType: propertyType, // Does it support this?
     // beds: bedrooms,          // Does it support this?
     statusForSaleForRent: "forRent", // Or maybe 'listing_type'? Check docs!
     maxItems: 15, // Get a decent number of comps
     // ... other necessary parameters from actor docs
  };

  // Option B: If scraper takes search URLs
  // const searchZillowUrl = `https://www.zillow.com/homes/for_rent/${zipCode}_rb/`; // Adjust URL structure as needed
  // const searchInput = {
  //   searchUrls: [searchZillowUrl],
  //   maxItems: 15
  // };
  // === END INPUT CONSTRUCTION ===


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
  return data || []; // Return the array of property objects found
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    const { zillowUrl, testMode } = requestData;

    if (!zillowUrl) {
      return new Response(JSON.stringify({ success: false, error: "Zillow URL is required" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }

    // --- Test Mode Handling (Keep as is) ---
    if (testMode === "mock") {
      console.log("Using mock data as requested");
      const zipMatch = zillowUrl.match(/-(\d{5})\//) || ["", "78705"];
      const addressMatch = zillowUrl.match(/\/([^\/]+?)\//) || ["", "Unknown Address"];
      const mockAnalysis = generateFallbackData(zipMatch[1], addressMatch[1]); // Use existing mock generator
      return new Response(JSON.stringify({ success: true, message: "Using mock data as requested", analysis: mockAnalysis }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // --- API Key Check (Keep as is) ---
    const apifyApiKey = Deno.env.get("APIFY_API_KEY");
    if (!apifyApiKey) {
       return new Response(JSON.stringify({ success: false, error: "APIFY_API_KEY is not configured" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
    }


    let subjectPropertyDetails;
    let realComparablesData = [];
    let analysis;
    let message = null; // Optional message for frontend

    // --- Step 1: Extract Subject Property Details ---
    try {
      console.log(`Attempting to extract real property details using Apify`);
      subjectPropertyDetails = await extractPropertyDetails(zillowUrl);
    } catch (error) {
      console.error(`Error extracting subject property details: ${error.message}`);
      // Fallback to mock data if subject extraction fails
      console.log(`Using fallback data due to subject extraction error: ${error.message}`);
      const zipMatch = zillowUrl.match(/-(\d{5})\//) || ["", "78705"];
      const addressMatch = zillowUrl.match(/\/([^\/]+?)-/) || ["", "Unknown Address"];
      analysis = generateFallbackData(zipMatch[1], addressMatch[1]);
      message = `Zillow data extraction error: ${error.message}. Using estimated data.`;

      return new Response(JSON.stringify({ success: true, message, analysis, technicalError: error.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
       }
    } catch(error) {
       console.error(`Error finding comparable properties: ${error.message}. Will use fallback analysis.`);
       message = `Could not fetch real comparable properties: ${error.message}. Analysis is based on estimates.`;
       // Keep subject details, but use fallback for comps/analysis if desired, or return error
    }

    // --- Step 3: Process Results and Generate Analysis ---
    if (realComparablesData && realComparablesData.length > 0) {
      console.log(`Processing ${realComparablesData.length} real comparables.`);
      // Filter out the subject property itself if it appears in comps
      const filteredComps = realComparablesData.filter(comp => comp.address !== subjectPropertyDetails.address);

       // Transform raw comp data to the structure frontend expects (Comparable interface)
       // NOTE: This mapping DEPENDS HEAVILY on the actual fields returned by maxcopell~zillow-scraper
       const processedComparables = filteredComps.map(comp => ({
         address: comp.address || "Unknown Address",
         // Adjust price parsing based on scraper output
         price: comp.unformattedPrice || parseInt(comp.price?.replace(/[^0-9]/g, "")) || null,
         bedrooms: comp.beds || comp.bedrooms || null,
         bathrooms: comp.baths || comp.bathrooms || null,
         propertyType: comp.homeType || comp.propertyType || "Unknown", // Adjust field names
         distance: comp.distance || 0, // Distance is likely NOT available, set to 0 or calculate if possible
         url: comp.url || comp.detailUrl || "", // Adjust field names
         squareFootage: comp.livingArea || comp.area || null // Adjust field names
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
         : (prices.length > 0 ? (subjectPrice < minPrice ? 0 : 100) : 50); // Handle edge cases

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
       // If no real comps found OR comp search failed previously, use fallback data
       console.log("No real comparables found or error occurred, using fallback analysis.");
       // Use the original fallback generator, but ensure subject property is the real one
       analysis = generateFallbackData(subjectPropertyDetails.zipCode || "78705", subjectPropertyDetails.address || "Unknown");
       analysis.subjectProperty = subjectPropertyDetails; // Override subject property
       if (!message) { // Add message if not already set by comp search error
         message = "Could not find sufficient comparable properties. Analysis is based on estimates.";
       }
    }

    // --- Step 4: Return Response ---
    return new Response(
      JSON.stringify({ success: true, analysis, message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    // --- Outer Error Handling (Keep mostly as is) ---
    console.error(`Unhandled error in apartment-analysis function: ${error.message}`);
    console.error(`Stack trace: ${error.stack}`);
    // Consider if generating fallback data here is appropriate or just return error
    return new Response(JSON.stringify({ success: false, error: `An unexpected error occurred: ${error.message}` }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
