
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// Access API keys from environment variables
const GOOGLE_API_KEY = Deno.env.get("GOOGLE_DOCUMENTAI_API_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_RENTERS_MENTOR_KEY");

// Google Document AI processor ID and location
// These values are now set to the ones provided by the user
const PROCESSOR_ID = "spheric-ray-454302-f6"; 
const PROCESSOR_LOCATION = "us";
const PROCESSOR_PROJECT_ID = "910967701703";

// Constants
const MAX_CHUNK_SIZE = 12000; // Characters per chunk for OpenAI

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  text: string;
  fileName: string;
}

serve(async (req) => {
  console.log("Document AI Lease Analyzer: Request received");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Document AI Lease Analyzer: CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Document AI Lease Analyzer: Checking API keys");
    
    // API key validation with detailed error messages
    if (!GOOGLE_API_KEY) {
      console.error("Document AI Lease Analyzer: Missing Google Document AI API key");
      return new Response(
        JSON.stringify({
          error: "Google Document AI API key not configured",
          details: "Please add the GOOGLE_DOCUMENTAI_API_KEY secret to your Supabase project."
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!OPENAI_API_KEY) {
      console.error("Document AI Lease Analyzer: Missing OpenAI API key");
      return new Response(
        JSON.stringify({
          error: "OpenAI API key not configured",
          details: "Please add the OPENAI_RENTERS_MENTOR_KEY secret to your Supabase project."
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body with error handling
    let requestData: RequestBody;
    try {
      requestData = await req.json() as RequestBody;
      console.log(`Document AI Lease Analyzer: Received document of ${requestData.text?.length || 0} characters`);
    } catch (error) {
      console.error("Document AI Lease Analyzer: Failed to parse request body", error);
      return new Response(
        JSON.stringify({
          error: "Invalid request format",
          details: "Could not parse the request JSON body"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { text, fileName } = requestData;

    if (!text) {
      console.error("Document AI Lease Analyzer: No text provided");
      return new Response(
        JSON.stringify({
          error: "No text provided",
          details: "The request must include the 'text' field with the document content"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Document AI Lease Analyzer: Processing document: ${fileName} (${text.length} characters)`);

    try {
      // For initial implementation, we'll use just OpenAI for analysis
      // In future iterations, we'll first send to Google Document AI for structured extraction
      console.log("Document AI Lease Analyzer: Starting analysis with OpenAI");
      const analysis = await analyzeWithOpenAI(text);
      console.log("Document AI Lease Analyzer: Analysis complete");

      return new Response(
        JSON.stringify({
          analysis,
          debug: {
            processedAt: new Date().toISOString(),
            textLength: text.length,
            processorUsed: "OpenAI",
          }
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Document AI Lease Analyzer: Error processing document:", error);
      return new Response(
        JSON.stringify({
          error: `Error processing document: ${error.message}`,
          stack: error.stack,
          details: "An error occurred during document analysis"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Document AI Lease Analyzer: Server error:", error);
    return new Response(
      JSON.stringify({
        error: `Server error: ${error.message}`,
        stack: error.stack,
        details: "An unexpected error occurred in the edge function"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Future implementation will add Google Document AI processing here
async function processWithDocumentAI(text: string): Promise<any> {
  console.log("Document AI Lease Analyzer: Google Document AI processing not yet implemented");
  // This is a placeholder for the Google Document AI implementation
  // We'll implement this in a future phase
  return { raw_text: text };
}

async function analyzeWithOpenAI(text: string) {
  console.log("Document AI Lease Analyzer: Starting OpenAI analysis");
  
  // Split the text into chunks if it's too long
  const chunks = splitTextIntoChunks(text, MAX_CHUNK_SIZE);
  let combinedAnalysis = "";

  console.log(`Document AI Lease Analyzer: Text split into ${chunks.length} chunks`);

  // Process each chunk
  for (let i = 0; i < chunks.length; i++) {
    console.log(`Document AI Lease Analyzer: Processing chunk ${i + 1} of ${chunks.length}`);
    const chunk = chunks[i];

    const prompt = `
You are an expert lease document analyzer. You're analyzing the following lease text (part ${i + 1} of ${chunks.length}):

${chunk}

Extract the following information in a structured JSON format:
1. Monthly rent
2. Security deposit
3. Lease term length
4. Notice required for termination
5. Pet policy details
6. Late rent penalties
7. Key responsibilities of tenant and landlord
8. Critical dates (move-in, move-out, rent due)
9. Any red flags or concerning terms in the lease

If this information is not present in this chunk, indicate "not found in this section".
`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content:
                "You are an expert lease document analyzer that extracts structured information from lease documents. Provide your analysis in JSON format.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Document AI Lease Analyzer: OpenAI API error:", error);
        throw new Error(`OpenAI API error: ${error.error?.message || "Unknown error"}`);
      }

      const data = await response.json();
      console.log(`Document AI Lease Analyzer: Successfully received OpenAI response for chunk ${i + 1}`);
      combinedAnalysis += data.choices[0].message.content + "\n\n";
    } catch (error) {
      console.error(`Document AI Lease Analyzer: Error processing chunk ${i + 1}:`, error);
      throw error;
    }
  }

  // Now create a summary analysis from the combined chunks
  console.log("Document AI Lease Analyzer: Creating final summary analysis");
  const finalPrompt = `
You are an expert lease document analyzer. Below is the analysis of different chunks of a lease document:

${combinedAnalysis}

Based on the above information, create a comprehensive analysis of the lease with the following structure:
1. A summary of the lease in plain language (1-2 paragraphs)
2. Key financial terms (rent, deposit, fees)
3. Lease term details (start date, end date, notice period)
4. Property details
5. Parties involved
6. Pet policy
7. Responsibilities (tenant vs landlord)
8. Critical dates
9. Red flags or concerning terms

Format your response as a JSON object with these fields. If information is missing, indicate it as null or "Not specified in lease".
`;

  try {
    const finalResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content:
                "You are an expert lease document analyzer that provides structured analysis of lease documents. Return your analysis as a JSON object.",
            },
            { role: "user", content: finalPrompt },
          ],
          temperature: 0.3,
        }),
      }
    );

    if (!finalResponse.ok) {
      const error = await finalResponse.json();
      console.error("Document AI Lease Analyzer: OpenAI API error on final analysis:", error);
      throw new Error(`OpenAI API error: ${error.error?.message || "Unknown error"}`);
    }

    const finalData = await finalResponse.json();
    const analysisContent = finalData.choices[0].message.content;
    console.log("Document AI Lease Analyzer: Successfully received final OpenAI response");
    
    try {
      // Try to parse the JSON from the response
      // Sometimes GPT might wrap the JSON in backticks or include explanatory text
      console.log("Document AI Lease Analyzer: Parsing response JSON");
      const jsonMatch = analysisContent.match(/```json\n([\s\S]*)\n```/) || 
                        analysisContent.match(/```\n([\s\S]*)\n```/) ||
                        analysisContent.match(/{[\s\S]*}/);
                        
      const jsonStr = jsonMatch ? jsonMatch[0] : analysisContent;
      const analysisJson = JSON.parse(jsonStr.replace(/```json|```/g, '').trim());
      
      // Transform into our expected structure if needed
      return {
        summary: analysisJson.summary || "No summary available",
        confidence: 0.8, // Placeholder confidence score
        financialTerms: {
          monthlyRent: parseFloat(String(analysisJson.financialTerms?.monthlyRent || analysisJson.keyFinancialTerms?.rent).replace(/[^0-9.]/g, "")) || null,
          securityDeposit: parseFloat(String(analysisJson.financialTerms?.securityDeposit || analysisJson.keyFinancialTerms?.securityDeposit).replace(/[^0-9.]/g, "")) || null,
          lateFees: analysisJson.financialTerms?.lateFees || analysisJson.keyFinancialTerms?.lateFees || null,
          otherFees: analysisJson.financialTerms?.otherFees || analysisJson.keyFinancialTerms?.otherFees || [],
        },
        leaseTerms: analysisJson.leaseTerms || analysisJson.leaseTermDetails || null,
        propertyDetails: analysisJson.propertyDetails || null,
        parties: analysisJson.parties || analysisJson.partiesInvolved || null,
        petPolicy: analysisJson.petPolicy || null,
        responsibilities: analysisJson.responsibilities || null,
        criticalDates: analysisJson.criticalDates || null,
        redFlags: analysisJson.redFlags || analysisJson.concerningTerms || null,
      };
    } catch (error) {
      console.error("Document AI Lease Analyzer: Error parsing JSON from OpenAI response:", error);
      console.log("Document AI Lease Analyzer: Raw response:", analysisContent);
      
      // Return a basic analysis when parsing fails
      return {
        summary: "The lease analysis encountered an error when parsing the structured data. Please try again with a clearer document.",
        confidence: 0.3,
        redFlags: [{
          issues: ["Unable to properly analyze the document structure"],
          severity: "medium"
        }]
      };
    }
  } catch (error) {
    console.error("Document AI Lease Analyzer: Error in final analysis:", error);
    throw error;
  }
}

function splitTextIntoChunks(text: string, maxChunkSize: number): string[] {
  const chunks: string[] = [];
  let currentChunk = "";
  
  // Split by paragraphs to avoid cutting in the middle of sentences
  const paragraphs = text.split(/\n\s*\n/);
  
  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length < maxChunkSize) {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      // If a single paragraph is longer than maxChunkSize, split it further
      if (paragraph.length > maxChunkSize) {
        const sentencesChunks = splitIntoSentenceChunks(paragraph, maxChunkSize);
        chunks.push(...sentencesChunks.slice(0, -1));
        currentChunk = sentencesChunks[sentencesChunks.length - 1] || "";
      } else {
        currentChunk = paragraph;
      }
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

function splitIntoSentenceChunks(text: string, maxChunkSize: number): string[] {
  const chunks: string[] = [];
  let currentChunk = "";
  
  // Rudimentary sentence splitting - not perfect but works for most cases
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length < maxChunkSize) {
      currentChunk += (currentChunk ? " " : "") + sentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      // If a single sentence is longer than maxChunkSize, split it by words
      if (sentence.length > maxChunkSize) {
        let remainingSentence = sentence;
        while (remainingSentence.length > maxChunkSize) {
          chunks.push(remainingSentence.substring(0, maxChunkSize));
          remainingSentence = remainingSentence.substring(maxChunkSize);
        }
        currentChunk = remainingSentence;
      } else {
        currentChunk = sentence;
      }
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}
