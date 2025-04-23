
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

    // 1️⃣ Pull basic HTML with proper browser-like headers
    console.log('Fetching HTML from:', cleanUrl);
    const htmlResponse = await fetch(cleanUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "sec-ch-ua": '"Not A(Brand";v="99", "Google Chrome";v="124", "Chromium";v="124"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
      }
    });

    if (!htmlResponse.ok) {
      const errorMsg = `Failed to fetch listing page: ${htmlResponse.status} ${htmlResponse.statusText}`;
      console.error(errorMsg);
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { 
          status: htmlResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    const html = await htmlResponse.text();
    console.log('HTML fetched successfully, length:', html.length);

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
    const extractResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0,
        messages: [{
          role: 'user',
          content: `From this HTML extract the following information: address, rent, beds, baths, sqft, zipcode. Return just a JSON object with these fields. If you cannot find a value, use null.\nHTML:\n${html.slice(0, 12000)}`
        }]
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
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const extract = await extractResponse.json();
    console.log('OpenAI extraction response:', extract);
    
    if (!extract.choices || !extract.choices[0] || !extract.choices[0].message || !extract.choices[0].message.content) {
      console.error('Invalid response structure from OpenAI');
      return new Response(
        JSON.stringify({ error: 'Invalid response structure from OpenAI' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Parse the properties safely - key fix here!
    let props;
    try {
      // Extract the JSON from the content - the API might return markdown with ```json wrapper
      let content = extract.choices[0].message.content.trim();
      
      // Handle if response is in a code block
      if (content.includes('```json')) {
        content = content.split('```json')[1].split('```')[0].trim();
      } else if (content.includes('```')) {
        content = content.split('```')[1].split('```')[0].trim();
      }
      
      props = JSON.parse(content);
      console.log('Extracted property details:', props);
    } catch (e) {
      console.error('Failed to parse OpenAI response:', e);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse property details from OpenAI response',
          rawContent: extract.choices[0].message.content
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

    // Return the result
    const result = { ...props, verdict };
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
      JSON.stringify({ error: error.message || 'Unknown error in listing analyzer' }),
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
