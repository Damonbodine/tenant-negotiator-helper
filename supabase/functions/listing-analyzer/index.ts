
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
    
    const body = await req.json();
    console.log('Request body:', body);
    
    const { url } = body;
    
    if (!url) {
      throw new Error('Missing URL parameter');
    }

    // Clean the URL by trimming whitespace and removing trailing punctuation
    const cleanUrl = url.trim().replace(/[.,)]+$/, "");
    console.log('Analyzing listing URL (cleaned):', cleanUrl);

    // 1️⃣ Pull basic HTML with proper browser-like headers
    console.log('Fetching HTML from:', cleanUrl);
    const htmlResponse = await fetch(cleanUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "sec-ch-ua": '"Not A(Brand";v="99", "Google Chrome";v="123", "Chromium";v="123"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
      }
    });

    if (!htmlResponse.ok) {
      console.error(`Failed to fetch listing page: ${htmlResponse.status} ${htmlResponse.statusText}`);
      throw new Error(`Listing fetch failed: ${htmlResponse.status} ${htmlResponse.statusText}`);
    }
    
    const html = await htmlResponse.text();
    console.log('HTML fetched successfully, length:', html.length);

    // 2️⃣ Ask OpenAI to extract fields
    if (!OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
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
          content: `From this HTML return JSON: {address, rent, beds, baths, sqft, zipcode}. If missing return nulls.\nHTML:\n${html.slice(0, 12000)}`
        }]
      })
    });

    if (!extractResponse.ok) {
      const error = await extractResponse.json();
      console.error('OpenAI API error:', error);
      throw new Error('Failed to extract listing details');
    }

    const extract = await extractResponse.json();
    console.log('OpenAI extraction response:', extract);
    
    const props = JSON.parse(extract.choices[0].message.content || "{}");
    console.log('Extracted property details:', props);

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
          throw new Error('RentCast API returned an error');
        }

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
      } catch (error) {
        console.error('Error fetching RentCast data:', error);
      }
    }

    return new Response(
      JSON.stringify({ ...props, verdict }),
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
      JSON.stringify({ error: error.message }),
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
