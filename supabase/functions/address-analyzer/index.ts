
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AddressAnalyzerRequest {
  address: string;
  beds?: number;
  baths?: number;
  propertyType?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address, beds, baths, propertyType } = await req.json() as AddressAnalyzerRequest;
    
    if (!address) {
      throw new Error('Address is required');
    }

    console.log(`Analyzing address: ${address}`);
    
    // Build a search query including additional property details if available
    let searchQuery = `current rental price for ${address}`;
    if (beds) searchQuery += ` ${beds} bedroom`;
    if (baths) searchQuery += ` ${baths} bathroom`;
    if (propertyType) searchQuery += ` ${propertyType}`;

    // Send request to OpenAI's API with web search enabled
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a helpful rental market analysis assistant. Your task is to:
            1. Find the rental price or estimated rental price for the property at the given address
            2. Find or estimate the average rental price for similar properties in that area
            3. Based on your findings, determine if the property is: "Overpriced" (>5% above market), "Fairly Priced" (within 5% of market), or "Good Deal" (>5% below market)
            4. If you cannot find the exact rental price, make your best estimate based on comparable properties in the area
            5. Format your response in a structured way with clear sections for:
               - Address
               - Estimated Rent
               - Market Average
               - Price Difference (as a percentage)
               - Verdict (Overpriced, Fairly Priced, or Good Deal)
               - Sources
            6. Include as much specific detail about the property as possible (beds, baths, sqft)
            7. Always cite your sources`
          },
          {
            role: "user",
            content: searchQuery
          }
        ],
        tools: [
          {
            "type": "web_search",
          }
        ],
      }),
    });

    const data = await response.json();
    console.log("OpenAI API response:", JSON.stringify(data));

    // Handle API response
    if (data.error) {
      throw new Error(`OpenAI API error: ${data.error.message || JSON.stringify(data.error)}`);
    }

    // Extract the text response from OpenAI
    let result;
    if (data.choices && data.choices[0] && data.choices[0].message) {
      result = data.choices[0].message.content;
      console.log("Analysis result:", result);
    } else {
      throw new Error('Unexpected response format from OpenAI');
    }

    // Parse the result to extract structured information
    // This is a simplified parser that will need improvement based on actual responses
    const parsedResult = {
      address: address,
      text: result,
      sources: [] // Will store citations if available from tool response
    };

    // If tool usage contains citations, extract them
    if (data.choices[0].message.tool_calls) {
      const toolCalls = data.choices[0].message.tool_calls;
      parsedResult.sources = toolCalls
        .filter(call => call.type === "web_search")
        .map(call => call.id);
    }

    return new Response(JSON.stringify(parsedResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in address-analyzer function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred analyzing the address',
        message: 'Please try a different address or check the format' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
