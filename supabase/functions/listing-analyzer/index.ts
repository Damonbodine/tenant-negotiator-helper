
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const RENTCAST_API_KEY = Deno.env.get('RENTCAST_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // 2️⃣ Ask OpenAI to extract fields
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
      const extractResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4.1',
          temperature: 0,
          messages: [
            {
              role: 'system',
              content: `You are a helpful assistant that extracts property listing details from HTML. ONLY respond with a valid JSON object - no markdown formatting, no code blocks, no explanations. The JSON object should have these properties: address (string), rent (number), beds (number|string), baths (number|string), sqft (number|string), zipcode (string). Use null for any values you cannot find.`
            },
            {
              role: 'user',
              content: `Extract the property details from this HTML:\n${html.slice(0, 15000)}`
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
      // Extract the JSON from the content with improved handling of different formats
      let content = extract.choices[0].message.content.trim();
      
      // Remove any non-JSON parts from the response
      console.log('Raw OpenAI content:', content);
      
      // Handle if response is in code blocks
      if (content.includes('```json')) {
        content = content.split('```json')[1].split('```')[0].trim();
      } else if (content.includes('```')) {
        content = content.split('```')[1].split('```')[0].trim();
      }
      
      // If content doesn't start with curly brace, try to find JSON object
      if (!content.startsWith('{')) {
        const jsonMatch = content.match(/({[\s\S]*})/);
        if (jsonMatch) {
          content = jsonMatch[0];
        } else {
          throw new Error('Could not find valid JSON in AI response');
        }
      }
      
      // Try to parse the JSON
      try {
        props = JSON.parse(content);
      } catch (e) {
        // If first attempt fails, try more aggressive cleaning
        content = content.replace(/[\n\r\t]/g, ' ');
        const jsonRegex = /{[^}]*}/g;
        const jsonMatch = content.match(jsonRegex);
        
        if (jsonMatch) {
          props = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to extract valid JSON from AI response');
        }
      }
      
      console.log('Extracted property details:', props);
      
      // Validate we have at least some meaningful data
      const hasAddress = props.address && typeof props.address === 'string';
      const hasRent = props.rent && typeof props.rent === 'number';
      
      if (!hasAddress || !hasRent) {
        console.warn('Missing critical property data', {hasAddress, hasRent});
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

    // 3️⃣ Compare with RentCast if possible
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
