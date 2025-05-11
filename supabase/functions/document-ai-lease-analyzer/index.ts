
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { OpenAI } from "https://esm.sh/openai@4.28.0";

// Define CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Access API keys from environment variables with the new names
const googleApiKey = Deno.env.get('GOOGLE_DOCUMENTAI_API_KEY');
const openaiApiKey = Deno.env.get('OPENAI_RENTERS_MENTOR_KEY');
const claudeApiKey = Deno.env.get('ANTHROPIC_API_KEY');

console.log(`API Keys available: ${!claudeApiKey ? 'CLAUDE: NO, ' : 'CLAUDE: YES, '}${!googleApiKey ? 'GOOGLE: NO, ' : 'GOOGLE: YES, '}${!openaiApiKey ? 'OPENAI: NO' : 'OPENAI: YES'}`);

// Set up the OpenAI client
const openai = openaiApiKey
  ? new OpenAI({ apiKey: openaiApiKey })
  : null;

/**
 * Process a document's text with Claude API
 */
async function analyzeWithClaude(text: string): Promise<any> {
  if (!claudeApiKey) {
    console.log("Claude API key not available, falling back to alternate analysis");
    return null;
  }

  console.log(`Analyzing document with Claude API (text length: ${text.length} chars)`);
  
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": claudeApiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229",
        max_tokens: 4000,
        system: `You are an expert legal assistant specializing in rental lease agreements. 
        Analyze the provided lease document and extract key information in a structured format.
        
        Focus on extracting:
        1. Rent amount and payment schedule
        2. Security deposit amount
        3. Lease term (start and end dates)
        4. Renewal terms
        5. Tenant and landlord information
        6. Unusual or potentially problematic clauses
        
        Format your response as JSON with these fields:
        {
          "summary": "Brief overview of the lease",
          "complexTerms": [{"term": "Term name", "explanation": "Explanation"}],
          "unusualClauses": [{"clause": "Description", "concern": "Why concerning", "riskLevel": "high|medium|low"}],
          "questions": ["Question 1", "Question 2"],
          "extractedData": {
            "financial": {
              "rent": {"amount": number, "frequency": "monthly|etc"},
              "securityDeposit": number,
              "lateFee": {"amount": number, "gracePeriod": number}
            },
            "term": {
              "start": "YYYY-MM-DD",
              "end": "YYYY-MM-DD",
              "durationMonths": number
            },
            "parties": {
              "landlord": "Name",
              "tenants": ["Name1", "Name2"]
            }
          },
          "extractionConfidence": {
            "rent": "high|medium|low",
            "securityDeposit": "high|medium|low",
            "term": "high|medium|low"
          }
        }`,
        messages: [
          { role: "user", content: text.length > 100000 ? text.substring(0, 100000) : text }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Claude API error:", errorData);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const result = await response.json();
    console.log("Claude analysis successful");
    return JSON.parse(result.content[0].text);
  } catch (error) {
    console.error("Error analyzing with Claude:", error);
    return null;
  }
}

/**
 * Process a document's text with OpenAI
 */
async function analyzeWithOpenAI(text: string): Promise<any> {
  if (!openai) {
    console.log("OpenAI API key not available");
    return null;
  }

  console.log(`Analyzing document with OpenAI API (text length: ${text.length} chars)`);
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert legal assistant specializing in rental lease agreements. 
          Analyze the provided lease document and extract key information in a structured format.
          
          Focus on extracting:
          1. Rent amount and payment schedule
          2. Security deposit amount
          3. Lease term (start and end dates)
          4. Renewal terms
          5. Tenant and landlord information
          6. Unusual or potentially problematic clauses
          
          Format your response as JSON.`
        },
        {
          role: "user",
          content: text.length > 100000 ? text.substring(0, 100000) : text
        }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    console.log("OpenAI analysis successful");
    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error("Error analyzing with OpenAI:", error);
    return null;
  }
}

/**
 * Extract financial data using regex as fallback
 */
function extractBasicData(text: string): any {
  console.log("Extracting basic data with regex");
  
  // Simple regex for rent
  const rentRegex = /rent.*?\$\s*([\d,]+(?:\.\d{1,2})?)/gi;
  const rentMatches = [...text.matchAll(rentRegex)].map(m => parseFloat(m[1].replace(/,/g, '')));
  
  // Simple regex for deposit
  const depositRegex = /(?:security\s+)?deposit.*?\$\s*([\d,]+(?:\.\d{1,2})?)/gi;
  const depositMatches = [...text.matchAll(depositRegex)].map(m => parseFloat(m[1].replace(/,/g, '')));
  
  const data = {
    summary: "We could only perform a basic analysis of your lease. Please verify all information manually.",
    extractedData: {
      financial: {}
    },
    extractionConfidence: {
      rent: "low",
      securityDeposit: "low",
      term: "low"
    }
  };
  
  if (rentMatches.length > 0) {
    data.extractedData.financial.rent = {
      amount: rentMatches[0],
      frequency: "monthly"
    };
  }
  
  if (depositMatches.length > 0) {
    data.extractedData.financial.securityDeposit = depositMatches[0];
  }
  
  return data;
}

// Main function to handle HTTP requests
serve(async (req: Request) => {
  console.log("Document-AI-Lease-Analyzer function called");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    let requestData;
    
    try {
      requestData = await req.json();
      console.log(`Received document analysis request: ${requestData.fileName || 'unnamed file'}`);
    } catch (e) {
      console.error("Error parsing request JSON:", e);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request format',
          summary: "We couldn't parse your request. Please try again." 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { fileBase64, fileName } = requestData;
    
    if (!fileBase64) {
      console.error("Missing file data");
      return new Response(
        JSON.stringify({ 
          error: 'Missing file data',
          summary: "No document was provided for analysis. Please upload a file." 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Processing ${fileName} with ${fileBase64.length} chars of base64 data`);

    // For very simple PDF text extraction
    const documentText = atob(fileBase64);
    console.log(`Extracted ${documentText.length} chars of simple document text`);
    
    // Try Claude first (best results)
    let analysis = null;
    if (claudeApiKey) {
      analysis = await analyzeWithClaude(documentText);
    }
    
    // Fall back to OpenAI if Claude fails
    if (!analysis && openaiApiKey) {
      analysis = await analyzeWithOpenAI(documentText);
    }
    
    // Final fallback to regex extraction
    if (!analysis) {
      console.log("All AI analysis methods failed, falling back to regex extraction");
      analysis = extractBasicData(documentText);
    }

    console.log("Returning analysis result");
    return new Response(
      JSON.stringify(analysis || {
        summary: "We couldn't analyze your document. Please try a different file or check API configurations.",
        error: "Analysis failed"
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error("Error in document-ai-lease-analyzer function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        summary: "We encountered an error while processing your document. Please try again later."
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
