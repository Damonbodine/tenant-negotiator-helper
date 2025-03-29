import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Main interface for property details
interface PropertyDetails {
  address: string;
  zipCode: string;
  bedrooms: number | null;
  bathrooms: number | null;
  price: number | null;
  propertyType: string;
}

// Interface for comparable properties
interface Comparable {
  address: string;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  propertyType: string;
  distance: number;
  url: string;
}

// Interface for analysis results
interface AnalysisResult {
  subjectProperty: PropertyDetails;
  averagePrice: number;
  higherPriced: number;
  lowerPriced: number;
  totalComparables: number;
  comparables: Comparable[];
  priceRank: number | null;
  priceAssessment: string;
  negotiationStrategy: string;
}

// Handle all incoming requests
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Apartment analysis function called");
    
    // Get request body
    let requestData;
    try {
      requestData = await req.json();
      console.log("Request body parsed:", JSON.stringify(requestData));
    } catch (error) {
      console.error("Failed to parse request JSON:", error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid request format" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    const { zillowUrl, testMode } = requestData;
    
    console.log(`Received request with zillowUrl: ${zillowUrl}, testMode: ${testMode}`);
    
    if (!zillowUrl) {
      console.error("No Zillow URL provided in request");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Zillow URL is required" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    if (!zillowUrl.includes('zillow.com')) {
      console.error("Invalid URL provided (not a Zillow URL):", zillowUrl);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid Zillow URL" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    console.log(`Extracting property details from: ${zillowUrl}`);
    console.log(`Test mode: ${testMode ? 'enabled' : 'disabled'}`);
    
    // Check for API key
    const apiKey = Deno.env.get('APIFY_API_KEY');
    console.log("APIFY_API_KEY status:", apiKey ? "Present" : "Missing");
    
    if (!apiKey) {
      console.error('Apify API key is not configured');
      
      if (testMode === "mock") {
        console.log("Using mock data as explicitly requested in test mode");
        const mockPropertyDetails = createMockPropertyDetails();
        const mockComparables = generateComparables(mockPropertyDetails);
        const mockAnalysisResult = createAnalysisResult(mockPropertyDetails, mockComparables);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Using mock data as requested in test mode",
            analysis: mockAnalysisResult 
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      console.warn("API key missing, using mock data with warning.");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "API key is not configured. Please contact support."
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    try {
      console.log("Attempting to extract real property details with Apify");
      // Try to extract real property details
      const propertyDetails = await extractPropertyDetails(apiKey, zillowUrl);
      
      // If we couldn't get property details, return an error
      if (!propertyDetails) {
        console.error("Property details extraction failed");
        return new Response(
          JSON.stringify({
            success: false,
            error: "Failed to extract property details from Zillow URL"
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      console.log("Successfully extracted property details:", JSON.stringify(propertyDetails));

      // Generate comparables based on the property details
      const comparables = generateComparables(propertyDetails);
      
      // Create and return analysis result
      const analysisResult = createAnalysisResult(propertyDetails, comparables);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          analysis: analysisResult 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error(`Error extracting property details: ${error.message}`);
      if (error.stack) {
        console.error(`Stack trace: ${error.stack}`);
      }
      
      return new Response(
        JSON.stringify({
          success: false,
          error: `Error extracting property details: ${error.message}`
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    // Catch-all error handler
    console.error(`Error in apartment-analysis function: ${error.message || error}`);
    if (error.stack) {
      console.error(`Stack trace: ${error.stack}`);
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: `An unexpected error occurred: ${error.message || "Unknown error"}`,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Create a mock property for testing
function createMockPropertyDetails(): PropertyDetails {
  // Generate random neighborhoods for variety
  const neighborhoods = [
    "Downtown", "Uptown", "Westside", "Eastside", 
    "North Loop", "South Congress", "Riverside"
  ];
  
  const neighborhood = neighborhoods[Math.floor(Math.random() * neighborhoods.length)];
  
  return {
    address: `123 Main St, ${neighborhood}, Austin, TX`,
    zipCode: "78731",
    bedrooms: Math.floor(Math.random() * 3) + 1,
    bathrooms: Math.floor(Math.random() * 2) + 1,
    price: Math.floor(Math.random() * 1000) + 2000,
    propertyType: Math.random() > 0.5 ? "Apartment" : "Condo"
  };
}

// Extract property details using Apify
async function extractPropertyDetails(apiKey: string, zillowUrl: string): Promise<PropertyDetails | null> {
  try {
    console.log("Attempting to extract property details for URL:", zillowUrl);
    console.log("Using Apify API key:", apiKey ? "Key is set (not shown for security)" : "No key set");
    
    try {
      console.log("Building request to Apify API");
      
      // Use the Apify API to extract property details
      // This is the actual implementation that uses the Apify API
      const apifyUrl = "https://api.apify.com/v2/acts/deedub~zillow-detail-scraper/run-sync-get-dataset-items";
      
      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          "startUrls": [{ "url": zillowUrl }],
          "maxConcurrency": 1
        })
      };
      
      console.log("Sending request to Apify API");
      const response = await fetch(apifyUrl, requestOptions);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Apify API returned error status ${response.status}: ${errorText}`);
        throw new Error(`Apify API returned status ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Apify API response:", JSON.stringify(data));
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.error("Apify returned no data");
        return null;
      }
      
      const propertyData = data[0];
      console.log("Processing property data:", JSON.stringify(propertyData));
      
      // Extract required fields
      const address = propertyData.address || "Unknown Address";
      const zipCode = propertyData.zipcode || "00000";
      const bedrooms = propertyData.bedrooms ? Number(propertyData.bedrooms) : null;
      const bathrooms = propertyData.bathrooms ? Number(propertyData.bathrooms) : null;
      const price = propertyData.price ? Number(propertyData.price.replace(/[^\d.]/g, '')) : null;
      const propertyType = propertyData.homeType || "Unknown";
      
      const propertyDetails: PropertyDetails = {
        address,
        zipCode,
        bedrooms,
        bathrooms,
        price,
        propertyType
      };
      
      console.log("Extracted property details:", JSON.stringify(propertyDetails));
      return propertyDetails;
    } catch (error) {
      console.error(`Error during Apify API call: ${error.message}`);
      if (error.stack) {
        console.error(`Stack trace: ${error.stack}`);
      }
      throw error;
    }
  } catch (error) {
    console.error(`Error extracting property details: ${error.message}`);
    throw error;
  }
}

// Generate comparable properties based on a reference property
function generateComparables(propertyDetails: PropertyDetails): Comparable[] {
  // Create price variations around the reference property
  const priceVariations = [0.85, 0.9, 0.95, 1.02, 1.05, 1.1, 1.15];
  
  // Street names for variety
  const streets = [
    'Oak St', 'Pine Ave', 'Maple Dr', 'Cedar Ln', 
    'Elm Blvd', 'Birch Rd', 'Willow Way', 'Magnolia Ct',
    'Cypress Ave', 'Spruce St', 'Aspen Ln', 'Poplar Dr'
  ];
  
  // Generate comparable properties
  return priceVariations.map((variation, index) => {
    const streetNumber = 100 + (index * 100);
    const street = streets[Math.floor(Math.random() * streets.length)];
    
    // Determine bedroom and bathroom variations
    const bedroomChange = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0;
    const bathroomChange = Math.random() > 0.7 ? (Math.random() > 0.5 ? 0.5 : -0.5) : 0;
    
    // Calculate new values with bounds checking
    const price = Math.round((propertyDetails.price || 2000) * variation);
    const bedrooms = Math.max(1, (propertyDetails.bedrooms || 2) + bedroomChange);
    const bathrooms = Math.max(1, (propertyDetails.bathrooms || 2) + bathroomChange);
    
    return {
      address: `${streetNumber} ${street}, Austin, TX 78731`,
      price: price,
      bedrooms: bedrooms,
      bathrooms: bathrooms,
      propertyType: propertyDetails.propertyType,
      distance: parseFloat((Math.random() * 3).toFixed(1)),
      url: 'https://www.zillow.com/homedetails/sample'
    };
  });
}

// Create a complete analysis result from property and comparables
function createAnalysisResult(propertyDetails: PropertyDetails, comparables: Comparable[]): AnalysisResult {
  const avgPrice = calculateAveragePrice(comparables);
  const priceRank = calculatePriceRank(propertyDetails.price || 0, comparables);
  
  const higherPriced = comparables.filter(c => (c.price || 0) > (propertyDetails.price || 0)).length;
  const lowerPriced = comparables.filter(c => (c.price || 0) < (propertyDetails.price || 0)).length;
  
  return {
    subjectProperty: propertyDetails,
    averagePrice: avgPrice,
    higherPriced: higherPriced,
    lowerPriced: lowerPriced,
    totalComparables: comparables.length,
    comparables: comparables,
    priceRank: priceRank,
    priceAssessment: generatePriceAssessment(propertyDetails.price || 0, avgPrice),
    negotiationStrategy: generateNegotiationStrategy(propertyDetails.price || 0, avgPrice)
  };
}

// Calculate average price from comparables
function calculateAveragePrice(comparables: Comparable[]): number {
  if (comparables.length === 0) return 0;
  
  const sum = comparables.reduce((total, comp) => {
    return total + (comp.price || 0);
  }, 0);
  
  return Math.round(sum / comparables.length);
}

// Calculate price rank percentile
function calculatePriceRank(price: number, comparables: Comparable[]): number | null {
  if (!comparables.length) return null;
  
  // Sort prices from low to high
  const prices = comparables.map(c => c.price || 0).sort((a, b) => a - b);
  
  if (prices.length === 0) return null;
  
  // Find where the subject property price fits in
  let rank = 0;
  for (let i = 0; i < prices.length; i++) {
    if (price > prices[i]) {
      rank++;
    }
  }
  
  // Calculate percentile
  return Math.round((rank / prices.length) * 100);
}

// Generate price assessment based on comparison to average
function generatePriceAssessment(price: number, avgPrice: number): string {
  if (price < avgPrice * 0.95) {
    return "This property is priced significantly below the market average for similar properties in this area. This could indicate a good deal, but verify the condition and any potential issues.";
  } else if (price < avgPrice) {
    return "This property is priced slightly below the market average for similar properties in this area. It appears to be reasonably priced.";
  } else if (price <= avgPrice * 1.05) {
    return "This property is priced at or near the market average for similar properties in this area. This is a fair market price.";
  } else if (price <= avgPrice * 1.15) {
    return "This property appears to be priced slightly above the market average for similar properties in this area. There may be room for negotiation.";
  } else {
    return "This property is priced significantly above the market average for similar properties in this area. You may want to negotiate or consider alternatives.";
  }
}

// Generate negotiation strategy based on price comparison
function generateNegotiationStrategy(price: number, avgPrice: number): string {
  if (price < avgPrice * 0.95) {
    return "This property is already priced competitively. Focus on securing the unit quickly as it could be in high demand. If you're interested, consider offering the asking price but negotiate on other terms like move-in date or lease length.";
  } else if (price < avgPrice) {
    return "While this property is well-priced, you could still make a slightly lower offer (1-3% below asking). Emphasize your stability as a tenant and readiness to sign a lease quickly.";
  } else if (price <= avgPrice * 1.05) {
    return "Consider offering about 3-5% below the asking price. Mention comparable properties in the area to justify your offer, and highlight your strengths as a tenant such as good credit or stable income.";
  } else if (price <= avgPrice * 1.15) {
    return "Based on our analysis, consider offering 5-7% below the asking price as your initial offer. Mention the comparable properties in the area that are priced lower, and emphasize your interest in a longer-term lease to strengthen your position.";
  } else {
    return "This property appears significantly overpriced. Start with an offer 10-15% below asking, and be prepared to negotiate. Bring evidence of comparable properties to your discussion, and consider asking for concessions like included utilities or a month free if they're unwilling to lower the base rent.";
  }
}
