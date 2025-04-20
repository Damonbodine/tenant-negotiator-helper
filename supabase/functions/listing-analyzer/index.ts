
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ListingDetails {
  address: string;
  price: number;
  sqft: number;
  bedrooms: number;
  bathrooms: number;
  features: string[];
  zipCode: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('{}', { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    // Call OpenAI to extract listing details
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('Missing OpenAI API key');
    }

    // Extract listing details using OpenAI
    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'o3',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that extracts rental listing information from URLs. 
                     Your task is to extract: address, price, square feet, bedrooms, bathrooms, zip code, 
                     and special features. Return ONLY a JSON object without any other text or explanation.`
          },
          {
            role: 'user',
            content: `Extract rental listing information from this URL: ${url}`
          }
        ],
        temperature: 0.5
      })
    });

    const openAiData = await openAiResponse.json();
    
    if (!openAiData.choices || !openAiData.choices[0] || !openAiData.choices[0].message) {
      throw new Error('Invalid response from OpenAI');
    }
    
    const listingText = openAiData.choices[0].message.content;
    let listingDetails: ListingDetails;
    
    try {
      // Try to parse the response as JSON
      listingDetails = JSON.parse(listingText);
    } catch (e) {
      // If parsing fails, make another call to format it as JSON
      const formatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'o3',
          messages: [
            {
              role: 'system',
              content: `Convert the following text into a JSON object with these properties: 
                       address, price (number), sqft (number), bedrooms (number), bathrooms (number), 
                       zipCode (string), and features (array of strings). Return ONLY the JSON.`
            },
            {
              role: 'user',
              content: listingText
            }
          ],
          temperature: 0.2
        })
      });
      
      const formattedData = await formatResponse.json();
      listingDetails = JSON.parse(formattedData.choices[0].message.content);
    }

    // Get rental market data for comparison
    const RENTCAST_API_KEY = Deno.env.get('RENTCAST_API_KEY');
    
    let marketComparison = "I couldn't find market data for comparison.";
    let pricingVerdict = "It's hard to determine if this is a good deal without more data.";
    
    if (RENTCAST_API_KEY && listingDetails.zipCode) {
      try {
        const rentcastResponse = await fetch(`https://api.rentcast.io/v1/markets/rental-prices?zip=${listingDetails.zipCode}&bedrooms=${listingDetails.bedrooms}`, {
          headers: {
            'X-Api-Key': RENTCAST_API_KEY
          }
        });
        
        const marketData = await rentcastResponse.json();
        
        if (marketData && marketData.averageRent) {
          const avgRent = marketData.averageRent;
          const priceDifference = ((listingDetails.price - avgRent) / avgRent) * 100;
          
          if (priceDifference > 10) {
            pricingVerdict = `This listing is about ${priceDifference.toFixed(1)}% ABOVE the average rent ($${avgRent}) for similar properties in this area. You may have room to negotiate.`;
          } else if (priceDifference < -10) {
            pricingVerdict = `This listing is about ${Math.abs(priceDifference).toFixed(1)}% BELOW the average rent ($${avgRent}) for similar properties in this area. This could be a good deal!`;
          } else {
            pricingVerdict = `This listing is priced close to the average rent ($${avgRent}) for similar properties in this area.`;
          }
          
          marketComparison = `According to market data, the average rent for ${listingDetails.bedrooms} bedroom units in zip code ${listingDetails.zipCode} is $${avgRent}.`;
        }
      } catch (error) {
        console.error("Error fetching Rentcast data:", error);
      }
    }

    // Create a summary
    const summary = `
📍 **${listingDetails.address}**

**Details:**
- Price: $${listingDetails.price}/month
- Size: ${listingDetails.sqft} sq ft
- ${listingDetails.bedrooms} bed / ${listingDetails.bathrooms} bath

**Market Analysis:**
${marketComparison}

**Pricing Verdict:**
${pricingVerdict}

**Special Features:**
${listingDetails.features.join(", ")}

**Want to practice negotiating for this unit?** Click the "Practice Negotiation" button to simulate a conversation with the landlord.
    `;

    return new Response(
      JSON.stringify({ 
        summary,
        details: listingDetails 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error("Error in listing-analyzer:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to analyze listing', 
        summary: "I tried to analyze this listing but encountered an error. Please try again or provide more details about the property manually." 
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
