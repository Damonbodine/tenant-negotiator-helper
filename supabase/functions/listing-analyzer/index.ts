
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const RENTCAST_API_KEY = Deno.env.get('RENTCAST_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const toTitle = (str: string) => str.replace(/([A-Za-z])(\w*)/g, (_, a, b) => a.toUpperCase() + b.toLowerCase());

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Listing analyzer function called');
    
    let body;
    try {
      body = await req.json();
      console.log('Request body:', body);
    } catch (e) {
      console.error('Error parsing request body:', e);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    const { url } = body;
    
    if (!url) {
      console.error('Missing URL parameter');
      return new Response(
        JSON.stringify({ error: 'Missing URL parameter' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Clean the URL by trimming whitespace and removing trailing punctuation
    const cleanUrl = url.trim().replace(/[.,;!?)\]]+$/, "");
    console.log('Analyzing listing URL (cleaned):', cleanUrl);

    // Extract unit fragment identifier
    const urlParts = cleanUrl.split('#');
    const unitFragment = urlParts.length > 1 ? urlParts[1] : null;
    console.log('Unit fragment:', unitFragment);
    
    // Look for unit ID pattern
    const unitIdMatch = unitFragment ? unitFragment.match(/unit-(\d+)/) : null;
    const unitId = unitIdMatch ? unitIdMatch[1] : null;
    console.log('Extracted unit ID:', unitId);

    // Pre-extract information from the URL itself for Zillow URLs
    let urlExtractedInfo = {};
    if (cleanUrl.includes('zillow.com')) {
      // Parse location from Zillow URL
      const urlParts = cleanUrl.split('/');
      let location = null;
      
      // Try to find location segment like "apartments/austin-tx" or similar
      for (let i = 0; i < urlParts.length; i++) {
        if (urlParts[i].includes('-') && (urlParts[i].includes('apartments') || urlParts[i].includes('homes'))) {
          location = urlParts[i+1];
          break;
        } else if (urlParts[i] === 'apartments' || urlParts[i] === 'homes') {
          location = urlParts[i+1];
          break;
        }
      }
      
      // Get property name or identifier from the URL
      const propertyIdentifier = urlParts.find(part => part.includes('#'))?.split('#')[1] || 
                                 urlParts[urlParts.length - 1];
      
      if (location || propertyIdentifier) {
        console.log('Pre-extracted from URL:', { location, propertyIdentifier });
        urlExtractedInfo = { location, propertyIdentifier };
      }
    }

    // Enhanced browser-like headers with more sophistication to avoid detection
    const headers = {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "sec-ch-ua": '"Not A(Brand";v="99", "Google Chrome";v="124", "Chromium";v="124"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "Referer": "https://www.google.com/search?q=apartments+in+austin",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
      "Upgrade-Insecure-Requests": "1",
      "sec-fetch-site": "cross-site",
      "sec-fetch-mode": "navigate",
      "sec-fetch-user": "?1",
      "sec-fetch-dest": "document",
    };

    // Try different approaches for fetching HTML
    let htmlResponse;
    let html = '';
    try {
      console.log('Attempting to fetch HTML with enhanced headers...');
      htmlResponse = await fetch(cleanUrl, { 
        headers,
        redirect: 'follow',
      });

      if (!htmlResponse.ok) {
        console.error(`Failed to fetch with first method: ${htmlResponse.status} ${htmlResponse.statusText}`);
        
        // Alternative fetch approach
        console.log('Trying alternative fetch approach...');
        const alternativeHeaders = {
          ...headers,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
        };

        htmlResponse = await fetch(cleanUrl, {
          headers: alternativeHeaders,
          redirect: 'follow',
        });
      }
      
      if (!htmlResponse.ok) {
        throw new Error(`Failed to fetch listing page: ${htmlResponse.status} ${htmlResponse.statusText}`);
      }
      
      html = await htmlResponse.text();
      console.log('HTML fetched successfully, length:', html.length);
      
      if (html.length < 1000) {
        console.error('Received suspiciously short HTML, likely blocked');
        throw new Error('Received suspiciously short HTML response');
      }
    } catch (error) {
      console.error('Error fetching HTML:', error);
      return new Response(
        JSON.stringify({ 
          error: error.message || 'Failed to fetch listing page', 
          message: "We're having trouble accessing this website. Try using another real estate site like Apartments.com or Realtor.com" 
        }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Extract ld+json if available and capture a larger portion of the HTML
    const ldStart = html.indexOf("application/ld+json");
    // Increased slice size to ensure we capture more units data
    const snippet = ldStart !== -1 
      ? html.slice(Math.max(ldStart - 5000, 0), ldStart + 150000) 
      : html.slice(0, 150000);
    
    // Log a portion of the snippet to check for units data
    console.log('Snippet preview (first 500 chars):', snippet.substring(0, 500));
    console.log('Does snippet contain "units"?', snippet.includes('"units"'));
    console.log('Does snippet contain "pricing"?', snippet.includes('"pricing"'));

    // Ask OpenAI to extract fields
    if (!OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Extracting listing details using OpenAI');
    let extract;
    try {
      // Enhanced prompt that instructs the model to look for specific unit ID
      const systemPrompt = `Extract property listing details from HTML. Extract ACTUAL property details, DO NOT hallucinate. If information isn't found, set to null.
      
${unitId ? `IMPORTANT: Look specifically for unit with ID "${unitId}" or identifier containing "unit-${unitId}". Prioritize this exact unit over others.` : ''}

ONLY respond with a valid JSON object with these properties:
- address (string): The full property address including city, state and zip
- rent (number): Monthly rent in dollars, as number without $ or commas
- beds (number|string): Number of bedrooms or text description (like "studio")
- baths (number|string): Number of bathrooms
- sqft (number|string): Square footage as number
- zipcode (string): The zip/postal code
- propertyName (string): Name of apartment complex/building if available`;

      const extractResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0,
          max_tokens: 1000, // Increased token limit
          response_format: { "type": "json_object" },
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: `Extract details from this HTML for ${unitId ? `unit ID ${unitId}` : 'the property'}. ${unitFragment ? `The URL fragment is '#${unitFragment}'` : ''}\n\n${snippet}`
            }
          ]
        })
      });

      if (!extractResponse.ok) {
        let errorMsg = `OpenAI API error: ${extractResponse.status}`;
        try {
          const errorData = await extractResponse.json();
          console.error('OpenAI API error details:', errorData);
          if (errorData.error) {
            errorMsg += ` - ${errorData.error.message || errorData.error}`;
          }
        } catch (e) {
          console.error('Failed to parse OpenAI error response', e);
        }
        throw new Error(errorMsg);
      }

      extract = await extractResponse.json();
      console.log('OpenAI extraction response:', extract);
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      return new Response(
        JSON.stringify({ 
          error: error.message || 'Error analyzing property details', 
          message: "We had trouble analyzing this listing. Try a different website or provide details manually."
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    if (!extract.choices || !extract.choices[0] || !extract.choices[0].message || !extract.choices[0].message.content) {
      console.error('Invalid response structure from OpenAI');
      return new Response(
        JSON.stringify({ error: 'Invalid response from AI model' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Parse the properties with enhanced error handling
    let props;
    try {
      // Parse the JSON response
      props = JSON.parse(extract.choices[0].message.content);
      
      // Handle rent as string (e.g., "from $1,939+")
      if (props.rent && typeof props.rent === 'string') {
        // Extract numeric portion from rent string
        const rentMatch = props.rent.match(/\d+/);
        if (rentMatch) {
          props.rent = Number(rentMatch[0]);
          console.log('Converted rent string to number:', props.rent);
        }
      }
      
      console.log('Extracted property details:', props);
      
      // Special handling for Zillow URLs
      if (cleanUrl.includes('zillow.com')) {
        // Check for placeholder or missing address
        const isPlaceholderAddress = 
          !props.address || 
          props.address === "null" || 
          props.address === "undefined" || 
          props.address.includes('Main St') || 
          props.address.includes('123') || 
          props.address.includes('Springfield');
        
        if (isPlaceholderAddress) {
          console.log('Detected placeholder/missing address, attempting to construct from URL and property name');
          
          // Construct better address from URL info and property name
          let constructedAddress = '';
          
          // Try to use property name from extraction
          if (props.propertyName && props.propertyName !== "null" && props.propertyName !== "undefined") {
            constructedAddress += props.propertyName;
          } 
          // Otherwise use property identifier from URL
          else if (urlExtractedInfo.propertyIdentifier) {
            const formattedIdentifier = urlExtractedInfo.propertyIdentifier
              .replace(/-/g, ' ')
              .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between camelCase
              .split('#')[0]  // Remove any fragments
              .trim();
            
            if (formattedIdentifier) {
              constructedAddress += formattedIdentifier;
            }
          }
          
          // Add location information
          if (urlExtractedInfo.location) {
            // Format location from austin-tx to Austin, TX
            const locationParts = urlExtractedInfo.location.split('-');
            if (locationParts.length >= 2) {
              const city = locationParts[0].charAt(0).toUpperCase() + locationParts[0].slice(1);
              const state = locationParts[1].toUpperCase();
              
              if (constructedAddress) {
                constructedAddress += ` (${city}, ${state})`;
              } else {
                constructedAddress = `${city}, ${state}`;
              }
            }
          }
          
          // Use the constructed address if we have something better than the placeholder
          if (constructedAddress) {
            props.address = constructedAddress;
            console.log('Using constructed address:', constructedAddress);
          }
        }
      }
      
      // Validate we have at least some meaningful data
      const hasAddress = props.address && typeof props.address === 'string';
      const hasPropertyName = props.propertyName && typeof props.propertyName === 'string';
      const hasRent = props.rent && (typeof props.rent === 'number' || typeof props.rent === 'string');
      
      if (!hasAddress && !hasPropertyName) {
        console.warn('Missing critical property data', {hasAddress, hasPropertyName, hasRent});
        return new Response(
          JSON.stringify({ 
            error: 'Could not extract critical property details', 
            message: "We couldn't extract the key details from this listing. Please try a different listing from another website like Apartments.com or Realtor.com."
          }),
          { 
            status: 422,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      // If we have a property name but not an address, use property name in the response
      if (!hasAddress && hasPropertyName) {
        props.address = props.propertyName;
      }
      
      // If unitId is present, check if rent looks reasonable (cross-validation)
      if (unitId && hasRent) {
        // Look for pricing near the unit ID in the raw HTML
        const unitIdPosition = html.indexOf(`unit-${unitId}`);
        if (unitIdPosition > 0) {
          // Search for price patterns ($X,XXX) within 1000 characters of unit ID
          const pricingContext = html.substring(Math.max(0, unitIdPosition - 500), 
                                               Math.min(html.length, unitIdPosition + 1000));
          const priceMatches = pricingContext.match(/\$(\d{1,3},)?\d{3,4}/g);
          
          if (priceMatches && priceMatches.length > 0) {
            // Convert to number for comparison
            const nearbyPrices = priceMatches.map(p => 
              Number(p.replace(/[$,]/g, ''))
            ).filter(p => p > 500); // Filter out unrealistic prices
            
            console.log('Nearby prices found in HTML near unitId:', nearbyPrices);
            
            if (nearbyPrices.length > 0) {
              // Calculate the average nearby price
              const avgNearbyPrice = nearbyPrices.reduce((a, b) => a + b, 0) / nearbyPrices.length;
              
              // Check if the extracted rent is very different from nearby prices
              const priceDifference = Math.abs(props.rent - avgNearbyPrice);
              const priceDiffPercent = (priceDifference / avgNearbyPrice) * 100;
              
              console.log('Price comparison:', {
                extractedRent: props.rent,
                avgNearbyPrice,
                priceDifference,
                priceDiffPercent
              });
              
              // If the difference is significant, log a warning but still use the extracted price
              if (priceDiffPercent > 20 && priceDifference > 200) {
                console.warn(`Warning: Extracted rent ($${props.rent}) differs significantly from nearby prices (avg: $${avgNearbyPrice.toFixed(0)})`);
              }
            }
          }
        }
      }
      
    } catch (e) {
      console.error('Failed to parse OpenAI response:', e);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse property details from AI response',
          rawContent: extract.choices[0].message.content,
          message: "The AI couldn't properly extract data from this page format. Try a different real estate website."
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Compare with RentCast if possible
    let verdict = "unknown";
    if (props.zipcode && props.beds && RENTCAST_API_KEY) {
      try {
        console.log('Fetching RentCast data for comparison');
        const rentcastResponse = await fetch(
          `https://api.rentcast.io/v1/rentalComps?postalCode=${props.zipcode}&bedrooms=${props.beds}`,
          { headers: { 'X-Api-Key': RENTCAST_API_KEY } }
        );

        if (!rentcastResponse.ok) {
          console.error(`RentCast API error: ${rentcastResponse.status} ${rentcastResponse.statusText}`);
          // Continue without RentCast data, but log the error
          console.log('Continuing without RentCast market data');
        } else {
          const rc = await rentcastResponse.json();
          console.log('RentCast response:', rc);
          
          const avg = rc?.medianRent;
          
          if (avg && props.rent) {
            const delta = ((props.rent - avg) / avg) * 100;
            verdict =
              delta < -5 ? "under-priced" :
              delta > 5 ? "over-priced" : "priced right";
            props.marketAverage = avg;
            props.deltaPercent = delta.toFixed(1);
            
            console.log('Market analysis complete:', { 
              verdict,
              marketAverage: avg,
              deltaPercent: delta.toFixed(1)
            });
          }
        }
      } catch (error) {
        console.error('Error fetching RentCast data:', error);
        // Continue without market data
      }
    }

    // Return the result with added source URL for reference
    const result = { 
      ...props, 
      verdict,
      sourceUrl: cleanUrl,
      unitId: unitId || undefined,
      message: props.address ? undefined : "We couldn't extract complete details from this listing. Some data may be missing."
    };
    console.log('Final analysis result:', result);
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error in listing-analyzer function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error in listing analyzer',
        message: "Something went wrong while analyzing the listing. Please try again with a different URL from another real estate website."
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
