
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const APIFY_API_KEY = Deno.env.get('APIFY_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Calculate distance between two lat/long points in miles
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;  // Earth radius in miles
  const toRadians = (degree: number) => degree * (Math.PI / 180);
  
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

async function extractPropertyDetails(zillowUrl: string) {
  console.log(`Extracting property details from: ${zillowUrl}`);
  console.log(`Using APIFY_API_KEY: ${APIFY_API_KEY ? "Key is set" : "KEY IS MISSING!!!"}`);
  
  try {
    // Start the actor run
    const runResponse = await fetch(`https://api.apify.com/v2/acts/maxcopell~zillow-detail-scraper/runs?token=${APIFY_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startUrls: [{ url: zillowUrl }]
      }),
    });

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error(`Error starting Apify actor run: ${errorText}`);
      throw new Error(`Failed to start Apify actor run: ${runResponse.status} - ${errorText}`);
    }

    const runData = await runResponse.json();
    console.log(`Actor run started with ID: ${runData.id}`);
    
    if (!runData.id) {
      throw new Error("No actor run ID returned from Apify");
    }

    // Wait for the run to finish and get the dataset ID
    const datasetId = runData.defaultDatasetId;
    
    if (!datasetId) {
      throw new Error("No dataset ID returned from Apify");
    }
    
    // Poll until the run is completed
    let runFinished = false;
    let attempts = 0;
    let statusData;
    
    while (!runFinished && attempts < 30) { // Timeout after 30 attempts (2.5 minutes)
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds between polls
      
      console.log(`Checking run status for run ID: ${runData.id}, attempt ${attempts + 1}/30`);
      const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runData.id}?token=${APIFY_API_KEY}`);
      
      if (!statusResponse.ok) {
        console.error(`Failed to check run status: ${statusResponse.status} - ${await statusResponse.text()}`);
        throw new Error(`Failed to check run status: ${statusResponse.statusText}`);
      }
      
      statusData = await statusResponse.json();
      console.log(`Run status: ${statusData.status}`);
      
      if (statusData.status === 'SUCCEEDED' || statusData.status === 'FINISHED') {
        runFinished = true;
      } else if (statusData.status === 'FAILED' || statusData.status === 'ABORTED' || statusData.status === 'TIMED_OUT') {
        throw new Error(`Apify run failed with status: ${statusData.status}`);
      }
      
      attempts++;
    }
    
    if (!runFinished) {
      throw new Error('Timed out waiting for Apify run to complete');
    }

    // Get the dataset items
    console.log(`Retrieving dataset items from ID: ${datasetId}`);
    const datasetResponse = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_API_KEY}`);
    
    if (!datasetResponse.ok) {
      console.error(`Failed to get dataset: ${datasetResponse.status} - ${await datasetResponse.text()}`);
      throw new Error(`Failed to get dataset: ${datasetResponse.statusText}`);
    }
    
    const items = await datasetResponse.json();
    console.log(`Retrieved ${items.length} items from dataset`);
    
    if (!items || items.length === 0) {
      throw new Error('No property details found');
    }

    const propertyData = items[0];
    const address = propertyData.address || {};
    
    // Parse price value
    let price = null;
    if (typeof propertyData.price === 'string') {
      price = parseFloat(propertyData.price.replace(/[$,+]/g, ''));
    } else if (typeof propertyData.price === 'number') {
      price = propertyData.price;
    }

    // Return formatted property details
    return {
      address: address.streetAddress || 'N/A',
      bedrooms: typeof propertyData.bedrooms === 'number' ? propertyData.bedrooms : null,
      bathrooms: typeof propertyData.bathrooms === 'number' ? propertyData.bathrooms : null,
      zipCode: address.zipcode,
      propertyType: propertyData.homeType || 'N/A',
      latitude: propertyData.latitude,
      longitude: propertyData.longitude,
      price: price,
      isRental: zillowUrl.includes('/rent/') || propertyData.homeStatus === 'FOR_RENT'
    };
  } catch (error) {
    console.error(`Error extracting property details: ${error.message}`);
    throw error;
  }
}

async function searchPropertiesByZipAndType(params: any) {
  const {
    zipCode,
    propertyType,
    subjectPrice,
    subjectLat,
    subjectLon,
    forRent = true,
    limit = 10
  } = params;

  if (!zipCode) {
    throw new Error('ZIP code is missing. Cannot search for properties.');
  }

  console.log(`Searching ZIP: ${zipCode}, For Rent: ${forRent}, Price Range: ${subjectPrice * 0.7}-${subjectPrice * 1.3}`);

  try {
    const response = await fetch(`https://api.apify.com/v2/acts/maxcopell~zillow-zip-search/runs?token=${APIFY_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        zipCodes: [zipCode],
        forRent: forRent,
        forSaleByAgent: false,
        forSaleByOwner: false,
        sold: false,
        daysOnZillow: '30',
        priceMin: Math.round(subjectPrice * 0.7),
        priceMax: Math.round(subjectPrice * 1.3)
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error response from Apify: ${errorText}`);
      throw new Error(`Apify API responded with status ${response.status}: ${errorText}`);
    }

    const runData = await response.json();
    console.log(`Search actor run started with ID: ${runData.id}`);

    if (!runData.id) {
      throw new Error("No actor run ID returned from Apify");
    }

    // Wait for the run to finish
    const datasetId = runData.defaultDatasetId;
    
    if (!datasetId) {
      throw new Error("No dataset ID returned from Apify");
    }
    
    // Poll until the run is completed
    let runFinished = false;
    let attempts = 0;
    while (!runFinished && attempts < 30) { // Timeout after 30 attempts (2.5 minutes)
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds between polls
      
      console.log(`Checking search run status for run ID: ${runData.id}, attempt ${attempts + 1}/30`);
      const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runData.id}?token=${APIFY_API_KEY}`);
      
      if (!statusResponse.ok) {
        console.error(`Failed to check search run status: ${statusResponse.status} - ${await statusResponse.text()}`);
        throw new Error(`Failed to check search run status: ${statusResponse.statusText}`);
      }
      
      const statusData = await statusResponse.json();
      console.log(`Search run status: ${statusData.status}`);
      
      if (statusData.status === 'SUCCEEDED' || statusData.status === 'FINISHED') {
        runFinished = true;
      } else if (statusData.status === 'FAILED' || statusData.status === 'ABORTED' || statusData.status === 'TIMED_OUT') {
        throw new Error(`Apify search run failed with status: ${statusData.status}`);
      }
      
      attempts++;
    }
    
    if (!runFinished) {
      throw new Error('Timed out waiting for Apify search run to complete');
    }

    // Get the dataset items
    console.log(`Retrieving search dataset items from ID: ${datasetId}`);
    const datasetResponse = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_API_KEY}`);
    
    if (!datasetResponse.ok) {
      console.error(`Failed to get search dataset: ${datasetResponse.status} - ${await datasetResponse.text()}`);
      throw new Error(`Failed to get search dataset: ${datasetResponse.statusText}`);
    }
    
    const items = await datasetResponse.json();
    console.log(`Retrieved ${items.length} items from search dataset`);

    const properties: any[] = [];

    for (const item of items) {
      if (typeof item !== 'object') {
        console.log(`Skipping invalid item: ${JSON.stringify(item)}`);
        continue;
      }

      const units = item.units || [];
      const latLong = item.latLong || {};
      const lat = latLong.latitude;
      const lon = latLong.longitude;
      const distance = (lat && lon && subjectLat && subjectLon) 
        ? haversineDistance(subjectLat, subjectLon, lat, lon) 
        : Infinity;

      if (units.length > 0) {
        for (const unit of units) {
          let price = null;
          if (typeof unit.price === 'string') {
            price = parseFloat(unit.price.replace(/[$,+]/g, ''));
          }

          const beds = unit.beds;
          
          if (price && subjectPrice && 
              0.8 * subjectPrice <= price && 
              price <= 1.2 * subjectPrice && 
              distance <= 2) {
            
            const propType = item.homeType || (item.isBuilding ? 'APARTMENT' : 'N/A');
            
            // Relaxed type filter: allow similar types
            if (['SINGLE_FAMILY', 'APARTMENT', 'CONDO', 'TOWNHOUSE'].includes(propType) || propertyType === 'N/A') {
              properties.push({
                address: item.addressStreet || item.address || 'N/A',
                price: price,
                bedrooms: typeof beds === 'string' && /^\d+$/.test(beds) ? parseInt(beds, 10) : null,
                bathrooms: item.baths,
                propertyType: propType,
                url: item.detailUrl || 'N/A',
                distance: distance,
                priceDiff: Math.abs(price - subjectPrice)
              });
            }
          }
        }
      } else {
        let price = null;
        if (typeof item.price === 'string') {
          price = parseFloat(item.price.replace(/[$,+]/g, ''));
        }

        const beds = item.bedrooms;
        
        if (price && subjectPrice && 
            0.8 * subjectPrice <= price && 
            price <= 1.2 * subjectPrice && 
            distance <= 2) {
          
          const propType = item.homeType || 'N/A';
          
          if (['SINGLE_FAMILY', 'APARTMENT', 'CONDO', 'TOWNHOUSE'].includes(propType) || propertyType === 'N/A') {
            properties.push({
              address: item.addressStreet || item.address || 'N/A',
              price: price,
              bedrooms: typeof beds === 'string' && /^\d+$/.test(beds) ? parseInt(beds, 10) : null,
              bathrooms: item.baths,
              propertyType: propType,
              url: item.detailUrl || 'N/A',
              distance: distance,
              priceDiff: Math.abs(price - subjectPrice)
            });
          }
        }
      }
    }

    // Sort by combined score: price similarity (weighted more) + distance
    return properties
      .sort((a, b) => (a.priceDiff * 0.5 + a.distance) - (b.priceDiff * 0.5 + b.distance))
      .slice(0, limit);
  } catch (error) {
    console.error(`Error searching properties: ${error.message}`);
    throw error;
  }
}

function filterComparablesByBedrooms(properties: any[], subjectBedrooms: number | null) {
  if (subjectBedrooms === null) {
    console.log("Subject property has no bedroom count; returning all properties.");
    return properties;
  }

  console.log(`Filtering ${properties.length} properties for bedrooms ${subjectBedrooms} ± 1`);
  
  const filtered = properties.filter(prop => {
    return prop.bedrooms !== null && Math.abs(prop.bedrooms - subjectBedrooms) <= 1;
  });
  
  console.log(`Filtered down to ${filtered.length} properties`);
  return filtered;
}

function comparePrices(subjectPrice: number | null, properties: any[]) {
  if (subjectPrice === null) {
    console.log("Subject property has no price; cannot compare.");
    return { higherCount: 0, lowerCount: 0, avgPrice: 0 };
  }

  const validPrices = properties
    .map(prop => prop.price)
    .filter(price => price !== null && price !== undefined);

  if (validPrices.length === 0) {
    return { higherCount: 0, lowerCount: 0, avgPrice: 0 };
  }

  const higherCount = validPrices.filter(price => price > subjectPrice).length;
  const lowerCount = validPrices.filter(price => price < subjectPrice).length;
  const avgPrice = validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length;

  return { higherCount, lowerCount, avgPrice };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if APIFY_API_KEY is set
    if (!APIFY_API_KEY) {
      console.error("APIFY_API_KEY is not set in environment variables");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "API key not configured. Please contact the administrator." 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const { zillowUrl } = await req.json();
    
    if (!zillowUrl) {
      throw new Error('Zillow URL is required');
    }
    
    console.log("Starting apartment analysis for URL:", zillowUrl);
    
    // Extract property details
    let propertyDetails;
    try {
      propertyDetails = await extractPropertyDetails(zillowUrl);
      console.log("Property details extracted:", JSON.stringify(propertyDetails));
    } catch (error) {
      console.error("Failed to extract property details:", error.message);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to extract property details: ${error.message}` 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    if (!propertyDetails) {
      throw new Error('Failed to extract property details');
    }
    
    if (!propertyDetails.zipCode) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Could not determine property zip code"
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    if (!propertyDetails.price) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Could not determine property price"
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Search for comparable properties
    let properties;
    try {
      properties = await searchPropertiesByZipAndType({
        zipCode: propertyDetails.zipCode,
        propertyType: propertyDetails.propertyType,
        subjectPrice: propertyDetails.price,
        subjectLat: propertyDetails.latitude,
        subjectLon: propertyDetails.longitude,
        forRent: true,
        limit: 10
      });
      
      console.log(`Raw properties found: ${properties.length}`);
    } catch (error) {
      console.error("Failed to search for comparable properties:", error.message);
      
      return new Response(
        JSON.stringify({
          success: true,
          propertyDetails,
          message: `Could not find comparable properties: ${error.message}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!properties || properties.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          propertyDetails,
          message: "No comparable rental properties found. Consider widening the search criteria."
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Filter comparables by bedrooms
    const comparables = filterComparablesByBedrooms(properties, propertyDetails.bedrooms);
    
    if (!comparables || comparables.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          propertyDetails,
          message: "No comparable rentals found within ±1 bedroom range."
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Compare prices
    const priceComparison = comparePrices(propertyDetails.price, comparables);
    
    // Construct the analysis results
    const analysisResult = {
      subjectProperty: propertyDetails,
      averagePrice: priceComparison.avgPrice,
      higherPriced: priceComparison.higherCount,
      lowerPriced: priceComparison.lowerCount,
      totalComparables: comparables.length,
      comparables: comparables,
      priceRank: comparables.length > 0 
        ? Math.floor((priceComparison.lowerCount / comparables.length) * 100) 
        : null,
      priceAssessment: determinePriceAssessment(propertyDetails.price, priceComparison.avgPrice),
      negotiationStrategy: getNegotiationStrategy(propertyDetails.price, priceComparison.avgPrice)
    };
    
    console.log("Analysis complete");
    
    return new Response(
      JSON.stringify({ success: true, analysis: analysisResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in apartment-analysis function:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function determinePriceAssessment(subjectPrice: number | null, averagePrice: number): string {
  if (!subjectPrice || averagePrice === 0) {
    return "Unable to assess price due to insufficient data";
  }
  
  const priceDiffPercent = ((subjectPrice - averagePrice) / averagePrice) * 100;
  
  if (priceDiffPercent >= 10) {
    return "Significantly overpriced compared to similar rentals";
  } else if (priceDiffPercent >= 5) {
    return "Moderately overpriced compared to similar rentals";
  } else if (priceDiffPercent <= -10) {
    return "Significantly underpriced compared to similar rentals (great deal)";
  } else if (priceDiffPercent <= -5) {
    return "Moderately underpriced compared to similar rentals (good deal)";
  } else {
    return "Priced at market rate for similar rentals";
  }
}

function getNegotiationStrategy(subjectPrice: number | null, averagePrice: number): string {
  if (!subjectPrice || averagePrice === 0) {
    return "Insufficient data to provide negotiation strategy";
  }
  
  const priceDiffPercent = ((subjectPrice - averagePrice) / averagePrice) * 100;
  
  if (priceDiffPercent >= 10) {
    return "Strong negotiation position. Consider counteroffer 8-10% below asking with comparable data to support.";
  } else if (priceDiffPercent >= 5) {
    return "Good negotiation position. Consider counteroffer 5-7% below asking price.";
  } else if (priceDiffPercent <= -10) {
    return "This appears to be significantly below market rate. Act quickly as it may have high demand.";
  } else if (priceDiffPercent <= -5) {
    return "This is a good deal below market rate. Consider negotiating on terms rather than price.";
  } else {
    return "This apartment is fairly priced. Consider negotiating minor concessions like reduced security deposit or included utilities.";
  }
}
