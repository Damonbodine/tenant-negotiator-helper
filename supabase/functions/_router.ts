
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Router for redirecting API requests to the appropriate edge function
serve(async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname;

  // CORS headers for all responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get Supabase client from environment variables
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log(`Request path: ${path}`);
    
    // Route to the appropriate function based on the path
    if (path === '/api/listing-analyzer' || path.startsWith('/api/listing-analyzer')) {
      console.log('Routing to listing-analyzer function');
      
      // Parse request body safely
      let requestBody;
      try {
        requestBody = await req.json();
        console.log('Request body:', requestBody);
      } catch (e) {
        console.error('Error parsing request body:', e);
        return new Response(
          JSON.stringify({ error: 'Invalid request body' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      try {
        // Call the listing-analyzer function
        const { data, error } = await supabase.functions.invoke('listing-analyzer', {
          body: requestBody,
        });

        if (error) {
          console.error('Error invoking listing-analyzer:', error);
          return new Response(
            JSON.stringify({ error: error.message || 'Invocation error' }),
            { 
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        if (!data) {
          console.error('No data returned from listing-analyzer');
          return new Response(
            JSON.stringify({ error: 'No data returned from analyzer' }),
            { 
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        console.log('Listing analyzer response:', data);
        return new Response(
          JSON.stringify(data),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      } catch (error) {
        console.error('Error in listing-analyzer invocation:', error);
        return new Response(
          JSON.stringify({ error: error.message || 'Function invocation error' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // If no matching route is found
    console.error(`No matching route found for path: ${path}`);
    return new Response(
      JSON.stringify({ error: 'Not Found' }),
      { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Router error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
