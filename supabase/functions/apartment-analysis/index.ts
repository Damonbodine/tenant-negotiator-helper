
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
  squareFootage: number | null;
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
  squareFootage: number | null;
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
    
    // If API key is missing or test mode is explicitly set to "mock", use mock data
    if (!apiKey || testMode === "mock") {
      const useReasonMessage = !apiKey ? 
        "API key is missing, using mock data." : 
        "Using mock data as explicitly requested in test mode";
      
      console.log(useReasonMessage);
      
      // Create mock property details for testing
      const mockPropertyDetails = createMockPropertyDetails();
      const mockComparables = generateComparables(mockPropertyDetails);
      const mockAnalysisResult = createAnalysisResult(mockPropertyDetails, mockComparables);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: useReasonMessage,
          analysis: mockAnalysisResult 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    try {
      console.log("Attempting to extract real property details using direct Apify API call");
      
      // Extract property details using the generic Apify API rather than a specific task
      const propertyDetails = await extractPropertyDetailsGeneric(apiKey, zillowUrl);
      
      // If we couldn't get property details, try using our fallback method
      if (!propertyDetails) {
        console.warn("Property details extraction failed, using fallback method");
        // Extract neighborhood/zip from URL for better mock data
        const fallbackDetails = createFallbackPropertyDetails(zillowUrl);
        const comparables = generateComparables(fallbackDetails);
        const analysisResult = createAnalysisResult(fallbackDetails, comparables);
        
        return new Response(
          JSON.stringify({
            success: true,
            message: "Zillow data extraction failed. Using estimated data based on location.",
            analysis: analysisResult
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      console.log("Successfully extracted property details:", JSON.stringify(propertyDetails));

      // Get comparable properties by ZIP code search
      console.log("Finding comparable properties using direct Apify API call");
      const comparables = await findComparablePropertiesGeneric(
        apiKey, 
        propertyDetails.zipCode, 
        propertyDetails.bedrooms, 
        propertyDetails.propertyType,
        propertyDetails.squareFootage
      );
      
      if (!comparables || comparables.length === 0) {
        console.log("No comparable properties found, generating mock comparables");
        // If no comparables found, generate mock ones based on the real property details
        const mockComparables = generateComparables(propertyDetails);
        const analysisResult = createAnalysisResult(propertyDetails, mockComparables);
        
        return new Response(
          JSON.stringify({
            success: true,
            message: "Could not find comparable properties. Using generated comparables.",
            analysis: analysisResult
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      // Create and return analysis result with real data
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
      console.error(`Error processing property details: ${error.message}`);
      if (error.stack) {
        console.error(`Stack trace: ${error.stack}`);
      }
      
      // If we face an error processing the property details, use fallback mock data
      console.log("Using fallback data due to error:", error.message);
      const fallbackDetails = createFallbackPropertyDetails(zillowUrl);
      const comparables = generateComparables(fallbackDetails);
      const analysisResult = createAnalysisResult(fallbackDetails, comparables);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: `Zillow data extraction error: ${error.message}. Using estimated data.`,
          analysis: analysisResult,
          technicalError: error.message,
          apiStatus: error.status || null
        }),
        {
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
    
    // Generate mock data even in case of fatal errors
    const mockPropertyDetails = createMockPropertyDetails();
    const mockComparables = generateComparables(mockPropertyDetails);
    const mockAnalysisResult = createAnalysisResult(mockPropertyDetails, mockComparables);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "An error occurred during analysis. Using estimated data.",
        analysis: mockAnalysisResult,
        error: `${error.message || "Unknown error"}`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Create a fallback property based on URL information
function createFallbackPropertyDetails(zillowUrl: string): PropertyDetails {
  let zipCode = "00000";
  let neighborhood = "Unknown";
  
  // Try to extract zip code from URL
  const zipMatch = zillowUrl.match(/TX-(\d{5})/);
  if (zipMatch && zipMatch[1]) {
    zipCode = zipMatch[1];
  }
  
  // Try to extract location name from URL
  const locationMatch = zillowUrl.match(/homedetails\/([^\/]+)/);
  if (locationMatch && locationMatch[1]) {
    const locationParts = locationMatch[1].split('-');
    if (locationParts.length > 3) {
      // Guess at city from URL
      neighborhood = locationParts.slice(0, -3).join(' ')
        .replace(/-/g, ' ')
        .replace(/(\w)(\w*)/g, (g0, g1, g2) => g1.toUpperCase() + g2);
    }
  }
  
  console.log(`Created fallback property with zip: ${zipCode}, area: ${neighborhood}`);
  
  return {
    address: `${Math.floor(Math.random() * 1000) + 100} Main St, ${neighborhood}, Austin, TX`,
    zipCode: zipCode,
    bedrooms: Math.floor(Math.random() * 2) + 1,
    bathrooms: Math.floor(Math.random() * 2) + 1,
    price: Math.floor(Math.random() * 1000) + 1500,
    propertyType: Math.random() > 0.5 ? "Apartment" : "Condo",
    squareFootage: Math.floor(Math.random() * 500) + 600
  };
}

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
    propertyType: Math.random() > 0.5 ? "Apartment" : "Condo",
    squareFootage: Math.floor(Math.random() * 500) + 700
  };
}

// Extract property details using generic Apify API
async function extractPropertyDetailsGeneric(apiKey: string, zillowUrl: string): Promise<PropertyDetails | null> {
  try {
    console.log("Attempting to extract property details for URL:", zillowUrl);
    console.log("Using Apify API key:", apiKey ? "Key is set (not shown for security)" : "No key set");
    
    // Use the direct Apify API call to the zillow-scraper actor
    const apifyUrl = "https://api.apify.com/v2/acts/dtrungtin~zillow-api/runs?token=" + apiKey;
    
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "startUrls": [{ "url": zillowUrl }],
        "includeImages": false,
        "simple": false,
        "proxyConfiguration": {
          "useApifyProxy": true
        }
      })
    };
    
    console.log("Sending request to Apify direct API");
    const response = await fetch(apifyUrl, requestOptions);
    
    const responseStatus = response.status;
    console.log(`Apify API response status: ${responseStatus}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Apify API returned error status ${responseStatus}: ${errorText}`);
      throw new Error(`Apify API returned status ${responseStatus}`);
    }
    
    // Get the run ID from the response
    const runData = await response.json();
    console.log("Run data:", JSON.stringify(runData));
    const runId = runData.data.id;
    console.log("Run ID:", runId);
    
    // Wait for the run to finish (poll status)
    let isFinished = false;
    let retryCount = 0;
    let dataset = null;
    
    while (!isFinished && retryCount < 10) {
      // Wait for 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check run status
      const statusUrl = `https://api.apify.com/v2/actor-runs/${runId}?token=${apiKey}`;
      const statusResponse = await fetch(statusUrl);
      
      if (!statusResponse.ok) {
        console.warn(`Error checking run status: ${statusResponse.status}`);
        retryCount++;
        continue;
      }
      
      const statusData = await statusResponse.json();
      console.log(`Run status: ${statusData.data.status}`);
      
      if (statusData.data.status === 'SUCCEEDED') {
        isFinished = true;
        
        // Get dataset items
        const datasetId = statusData.data.defaultDatasetId;
        const datasetUrl = `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apiKey}`;
        const datasetResponse = await fetch(datasetUrl);
        
        if (!datasetResponse.ok) {
          console.error(`Error fetching dataset: ${datasetResponse.status}`);
          throw new Error(`Failed to fetch dataset: ${datasetResponse.status}`);
        }
        
        dataset = await datasetResponse.json();
        console.log("Dataset items:", dataset.length || 0);
      } else if (statusData.data.status === 'FAILED' || statusData.data.status === 'TIMED-OUT' || statusData.data.status === 'ABORTED') {
        throw new Error(`Apify run ${statusData.data.status.toLowerCase()}`);
      }
      
      retryCount++;
    }
    
    if (!dataset || dataset.length === 0) {
      console.error("No data returned from Apify");
      return null;
    }
    
    const propertyData = dataset[0];
    console.log("Processing property data:", JSON.stringify(propertyData));
    
    // Extract required fields from the Zillow Scraper response
    const address = propertyData.address || "Unknown Address";
    const zipCode = propertyData.zipCode || extractZipFromAddress(address) || 
                   extractZipFromUrl(zillowUrl) || "00000";
    
    // Parse price
    let price = null;
    if (propertyData.price) {
      price = parsePriceFromString(propertyData.price);
    }
    
    // Parse bedrooms and bathrooms
    const bedrooms = parseNumberFromString(propertyData.bedrooms) || 
                    (propertyData.facts && propertyData.facts.beds ? 
                     parseNumberFromString(propertyData.facts.beds) : null);
                     
    const bathrooms = parseNumberFromString(propertyData.bathrooms) || 
                     (propertyData.facts && propertyData.facts.baths ? 
                      parseNumberFromString(propertyData.facts.baths) : null);
    
    // Parse square footage
    let squareFootage = null;
    if (propertyData.livingArea) {
      squareFootage = parseNumberFromString(propertyData.livingArea);
    } else if (propertyData.facts && propertyData.facts.sqft) {
      squareFootage = parseNumberFromString(propertyData.facts.sqft);
    } else if (propertyData.description && propertyData.description.includes('sqft')) {
      const sqftMatch = propertyData.description.match(/(\d[,\d]*)[ ]+sqft/);
      if (sqftMatch && sqftMatch[1]) {
        squareFootage = parseNumberFromString(sqftMatch[1]);
      }
    }
    
    // Determine property type
    let propertyType = "Unknown";
    if (propertyData.homeType) {
      propertyType = propertyData.homeType;
    } else if (propertyData.type) {
      propertyType = propertyData.type;
    } else if (propertyData.description) {
      if (propertyData.description.toLowerCase().includes('apartment')) {
        propertyType = "Apartment";
      } else if (propertyData.description.toLowerCase().includes('condo')) {
        propertyType = "Condo";
      } else if (propertyData.description.toLowerCase().includes('house')) {
        propertyType = "House";
      }
    }
    
    const propertyDetails: PropertyDetails = {
      address,
      zipCode,
      bedrooms,
      bathrooms,
      price,
      propertyType,
      squareFootage
    };
    
    console.log("Extracted property details:", JSON.stringify(propertyDetails));
    return propertyDetails;
  } catch (error) {
    console.error(`Error extracting property details: ${error.message}`);
    if (error.stack) {
      console.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

// Extract ZIP code from URL
function extractZipFromUrl(url: string): string | null {
  // Several patterns to try
  const patterns = [
    /\/TX-(\d{5})\//, // Format: /TX-12345/
    /TX[_-](\d{5})/, // Format: TX-12345 or TX_12345
    /-TX-(\d{5})/ // Format: -TX-12345
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

// Find comparable properties by ZIP code search
async function findComparablePropertiesGeneric(
  apiKey: string, 
  zipCode: string, 
  bedrooms: number | null, 
  propertyType: string,
  squareFootage: number | null
): Promise<Comparable[] | null> {
  try {
    if (!zipCode || zipCode === "00000") {
      console.log("Invalid ZIP code, cannot find comparables");
      return null;
    }
    
    console.log(`Searching for comparables in ZIP: ${zipCode}, Bedrooms: ${bedrooms}, Type: ${propertyType}`);
    
    // Build filter for bedrooms (allow +/- 1 bedroom)
    const minBedrooms = bedrooms ? Math.max(1, bedrooms - 1) : 1;
    const maxBedrooms = bedrooms ? bedrooms + 1 : 3;
    
    // Determine property type filter based on our internal type
    let zillowHomeType = "";
    if (propertyType.toLowerCase().includes("apartment")) {
      zillowHomeType = "Apartment";
    } else if (propertyType.toLowerCase().includes("condo")) {
      zillowHomeType = "Condo";
    } else if (propertyType.toLowerCase().includes("house")) {
      zillowHomeType = "House";
    }
    
    // Use the direct Apify API to search for properties
    const apifyUrl = "https://api.apify.com/v2/acts/dtrungtin~zillow-api/runs?token=" + apiKey;
    
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "search": zipCode,
        "category": "FOR_RENT",
        "bedroomsMin": minBedrooms,
        "bedroomsMax": maxBedrooms,
        "homeType": zillowHomeType || undefined,
        "maxItems": 15,
        "simple": false,
        "includeImages": false,
        "proxyConfiguration": {
          "useApifyProxy": true
        }
      })
    };
    
    console.log("Sending request to Apify for ZIP search");
    console.log("Request body:", requestOptions.body);
    const response = await fetch(apifyUrl, requestOptions);
    
    const responseStatus = response.status;
    console.log(`Apify ZIP Search API response status: ${responseStatus}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Apify ZIP Search API returned error status ${responseStatus}: ${errorText}`);
      throw new Error(`Apify ZIP Search API returned status ${responseStatus}`);
    }
    
    // Get the run ID from the response
    const runData = await response.json();
    console.log("Run data:", JSON.stringify(runData));
    const runId = runData.data.id;
    console.log("Run ID:", runId);
    
    // Wait for the run to finish (poll status)
    let isFinished = false;
    let retryCount = 0;
    let dataset = null;
    
    while (!isFinished && retryCount < 10) {
      // Wait for 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check run status
      const statusUrl = `https://api.apify.com/v2/actor-runs/${runId}?token=${apiKey}`;
      const statusResponse = await fetch(statusUrl);
      
      if (!statusResponse.ok) {
        console.warn(`Error checking run status: ${statusResponse.status}`);
        retryCount++;
        continue;
      }
      
      const statusData = await statusResponse.json();
      console.log(`Run status: ${statusData.data.status}`);
      
      if (statusData.data.status === 'SUCCEEDED') {
        isFinished = true;
        
        // Get dataset items
        const datasetId = statusData.data.defaultDatasetId;
        const datasetUrl = `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apiKey}`;
        const datasetResponse = await fetch(datasetUrl);
        
        if (!datasetResponse.ok) {
          console.error(`Error fetching dataset: ${datasetResponse.status}`);
          throw new Error(`Failed to fetch dataset: ${datasetResponse.status}`);
        }
        
        dataset = await datasetResponse.json();
        console.log("Dataset items:", dataset.length || 0);
      } else if (statusData.data.status === 'FAILED' || statusData.data.status === 'TIMED-OUT' || statusData.data.status === 'ABORTED') {
        throw new Error(`Apify run ${statusData.data.status.toLowerCase()}`);
      }
      
      retryCount++;
    }
    
    if (!dataset || dataset.length === 0) {
      console.error("Apify ZIP Search returned no data");
      return null;
    }
    
    // Filter and transform the results to our Comparable interface
    const comparables: Comparable[] = dataset
      .filter(item => {
        // Check if square footage is within range if we have it
        if (squareFootage && item.livingArea) {
          const itemSqFt = parseNumberFromString(item.livingArea);
          return itemSqFt && Math.abs(itemSqFt - squareFootage) <= 400;
        }
        return true;
      })
      .map(item => {
        let itemPrice = parsePriceFromString(item.price);
        if (!itemPrice && item.rentZestimate) {
          itemPrice = parsePriceFromString(item.rentZestimate);
        }
        
        const itemBedrooms = item.bedrooms ? 
          parseNumberFromString(item.bedrooms) : 
          (item.facts && item.facts.beds ? parseNumberFromString(item.facts.beds) : null);
          
        const itemBathrooms = item.bathrooms ? 
          parseNumberFromString(item.bathrooms) : 
          (item.facts && item.facts.baths ? parseNumberFromString(item.facts.baths) : null);
          
        const itemSqFt = item.livingArea ? 
          parseNumberFromString(item.livingArea) : 
          (item.facts && item.facts.sqft ? parseNumberFromString(item.facts.sqft) : null);
        
        let propertyType = "Unknown";
        if (item.homeType) {
          propertyType = item.homeType;
        } else if (item.type) {
          propertyType = item.type;
        }
        
        return {
          address: item.address || "Unknown Address",
          price: itemPrice,
          bedrooms: itemBedrooms,
          bathrooms: itemBathrooms,
          squareFootage: itemSqFt,
          propertyType: propertyType,
          distance: Math.random() * 3, // We don't have real distance data
          url: item.url || zillowUrl // If no URL, use the subject property URL as a fallback
        };
      });
    
    console.log(`Found ${comparables.length} comparable properties`);
    return comparables;
  } catch (error) {
    console.error(`Error finding comparable properties: ${error.message}`);
    if (error.stack) {
      console.error(`Stack trace: ${error.stack}`);
    }
    return null;
  }
}

// Helper function to parse price from string
function parsePriceFromString(priceString: string | undefined | null): number | null {
  if (!priceString) return null;
  
  // Try to extract digits, commas, and decimal points
  const priceMatch = priceString.toString().match(/[$]?([\d,]+(\.\d+)?)/);
  if (priceMatch) {
    // Remove commas before parsing
    return parseFloat(priceMatch[1].replace(/,/g, ''));
  }
  
  return null;
}

// Helper function to parse numbers from strings
function parseNumberFromString(numString: string | undefined | null): number | null {
  if (!numString) return null;
  
  // Try to extract numbers, possibly with decimals
  const numberMatch = numString.toString().match(/(\d+(\.\d+)?)/);
  if (numberMatch) {
    return parseFloat(numberMatch[1]);
  }
  
  return null;
}

// Helper function to extract ZIP code from address
function extractZipFromAddress(address: string): string | null {
  const zipMatch = address.match(/\b(\d{5})\b/);
  return zipMatch ? zipMatch[1] : null;
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
    const sqftChange = Math.floor(Math.random() * 200) - 100; // +/- 100 sq ft
    
    // Calculate new values with bounds checking
    const price = Math.round((propertyDetails.price || 2000) * variation);
    const bedrooms = Math.max(1, (propertyDetails.bedrooms || 2) + bedroomChange);
    const bathrooms = Math.max(1, (propertyDetails.bathrooms || 2) + bathroomChange);
    const sqft = propertyDetails.squareFootage ? 
      Math.max(400, propertyDetails.squareFootage + sqftChange) : 
      Math.floor(Math.random() * 500) + 700;
    
    return {
      address: `${streetNumber} ${street}, Austin, TX 78731`,
      price: price,
      bedrooms: bedrooms,
      bathrooms: bathrooms,
      propertyType: propertyDetails.propertyType,
      distance: parseFloat((Math.random() * 3).toFixed(1)),
      url: 'https://www.zillow.com/homedetails/sample',
      squareFootage: sqft
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
