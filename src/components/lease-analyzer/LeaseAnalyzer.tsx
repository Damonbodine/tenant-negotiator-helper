import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const googleApiKey = Deno.env.get('GOOGLE_DOCUMENTAI_API_KEY');
const projectId = Deno.env.get('GOOGLE_PROJECT_ID');
const processorId = Deno.env.get('GOOGLE_PROCESSOR_ID');
const location = 'us'; // Change if your processor is somewhere else, like 'us-central1'

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();

    const { fileBase64, fileName } = requestData;

    if (!fileBase64) {
      return new Response(JSON.stringify({ error: 'Missing fileBase64' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    console.log(`Received file: ${fileName || 'Unnamed file'}`);

    // Call Google Document AI
    const docAIResponse = await fetch(`https://${location}-documentai.googleapis.com/v1/projects/${projectId}/locations/${location}/processors/${processorId}:process`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${googleApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        rawDocument: {
          content: fileBase64,
          mimeType: "application/pdf"
        }
      })
    });

    if (!docAIResponse.ok) {
      const errorText = await docAIResponse.text();
      console.error("Google Document AI error:", errorText);
      return new Response(JSON.stringify({ error: "Google Document AI error", details: errorText }), {
        status: 500,
        headers: corsHeaders
      });
    }

    const parsedDocument = await docAIResponse.json();

    console.log("Successfully parsed document with Google Document AI");

    return new Response(JSON.stringify({
      message: "Lease analyzed successfully",
      parsedDocument,
    }), {
      headers: corsHeaders,
    });

  } catch (error) {
    console.error("Error in document-ai-lease-analyzer function:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error", details: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
