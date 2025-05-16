
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// Access API keys from environment variables
const OPENAI_API_KEY = Deno.env.get("OPENAI_RENTERS_MENTOR_KEY");
const GOOGLE_DOCUMENT_AI_API_KEY = Deno.env.get("GOOGLE_DOCUMENTAI_API_KEY");

// Google Document AI processor settings
const PROCESSOR_ID = "6ec0c96e035a8e46"; 
const PROCESSOR_LOCATION = "us";
const PROCESSOR_PROJECT_ID = "cloud-doc-ai-basic";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  fileBase64: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  text?: string; // Optional text field for test mode
  testMode?: boolean; // Flag for test mode
}

serve(async (req) => {
  console.log("Lease Analyzer: Request received");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Lease Analyzer: CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check API keys
    if (!GOOGLE_DOCUMENT_AI_API_KEY) {
      console.error("Lease Analyzer: Missing Google Document AI API key");
      return new Response(
        JSON.stringify({
          error: "Server configuration error: Missing Google Document AI API key",
          details: "Please contact support. The server is missing required API credentials."
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    if (!OPENAI_API_KEY) {
      console.error("Lease Analyzer: Missing OpenAI API key");
      return new Response(
        JSON.stringify({
          error: "Server configuration error: Missing OpenAI API key",
          details: "Please contact support. The server is missing required API credentials."
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    let requestData: RequestBody;
    try {
      const requestText = await req.text();
      console.log("Lease Analyzer: Raw request size:", requestText.length);
      
      try {
        requestData = JSON.parse(requestText);
        console.log("Lease Analyzer: Request parsed successfully");
      } catch (parseError) {
        console.error("Lease Analyzer: JSON parse error:", parseError.message);
        return new Response(
          JSON.stringify({
            error: "Invalid JSON format",
            details: "Could not parse the request body as JSON",
            message: parseError.message
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      console.log(`Lease Analyzer: Received file ${requestData.fileName || 'unknown'} (${requestData.fileSize ? (requestData.fileSize / 1024 / 1024).toFixed(2) + ' MB' : 'unknown size'})`);
      
      // Check if we're in test mode
      if (requestData.testMode === true) {
        console.log("Lease Analyzer: Test mode detected, sending sample response");
        return new Response(
          JSON.stringify({ 
            analysis: {
              summary: "This is a test response. The system is working but using sample data instead of analyzing a real document.",
              confidence: 0.99,
              financialTerms: {
                monthlyRent: 1500,
                securityDeposit: 1500,
                lateFees: "$50 after 5 days",
                otherFees: ["$25 application fee", "$150 cleaning fee"]
              },
              leaseTerms: {
                startDate: "2025-06-01",
                endDate: "2026-05-31",
                leaseTerm: "12 months",
                renewalTerms: "Month-to-month after initial term",
                noticeRequired: "60 days"
              },
              propertyDetails: {
                address: "123 Test Street, Testville, TS 12345",
                unitNumber: "Apt 4B",
                includedAmenities: ["Parking", "Water", "Garbage"]
              },
              parties: {
                landlord: "Test Property Management LLC",
                tenant: ["Jane Doe", "John Smith"],
                propertyManager: "Test Manager"
              },
              petPolicy: {
                allowed: true,
                restrictions: "Dogs and cats only, max 2 pets",
                petRent: 50,
                petDeposit: 250
              },
              responsibilities: {
                tenant: ["Routine cleaning", "Lawn maintenance", "Minor repairs"],
                landlord: ["Major repairs", "Structural maintenance"]
              },
              criticalDates: {
                moveIn: "2025-06-01",
                moveOut: "2026-05-31",
                rentDueDate: "1st of each month",
                lateFeeDate: "6th of each month"
              },
              redFlags: [
                {
                  issues: ["Non-standard early termination fee", "Excessive security deposit"],
                  severity: "medium"
                }
              ]
            },
            debug: {
              processedAt: new Date().toISOString(),
              testMode: true,
              receivedFileData: {
                fileName: requestData.fileName,
                fileSize: requestData.fileSize,
                fileType: requestData.fileType,
                hasBase64: Boolean(requestData.fileBase64),
                hasText: Boolean(requestData.text)
              }
            }
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      // For real processing, check if we have file content
      if (!requestData.fileBase64 && !requestData.text) {
        throw new Error("No document content provided (both fileBase64 and text are missing)");
      }
      
      // Ensure fileBase64 is properly formatted (no data:application/pdf;base64, prefix)
      if (requestData.fileBase64 && requestData.fileBase64.includes(";base64,")) {
        console.log("Lease Analyzer: Removing base64 prefix");
        requestData.fileBase64 = requestData.fileBase64.split(";base64,")[1];
      }
    } catch (error) {
      console.error("Lease Analyzer: Failed to parse request body", error);
      return new Response(
        JSON.stringify({
          error: "Invalid request format",
          details: "Could not parse the request JSON body or missing required fields",
          message: error.message
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Process document with Google Document AI (if we have a file) or use text directly
    let extractedText: string;
    
    if (requestData.fileBase64) {
      console.log("Lease Analyzer: Processing document with Google Document AI");
      try {
        extractedText = await processWithDocumentAI(requestData.fileBase64);
        console.log(`Lease Analyzer: Document processing complete. Extracted ${extractedText.length} characters.`);
      } catch (docAiError) {
        console.error("Lease Analyzer: Document AI error:", docAiError);
        return new Response(
          JSON.stringify({
            error: `Document AI processing error: ${docAiError.message}`,
            details: "Failed to process the document with Google Document AI"
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else if (requestData.text) {
      // Use text directly if provided (useful for testing)
      console.log("Lease Analyzer: Using provided text directly");
      extractedText = requestData.text;
    } else {
      // This should never happen due to our earlier check, but just in case
      return new Response(
        JSON.stringify({
          error: "Document content is required",
          details: "Either fileBase64 or text must be provided"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Analyze text with OpenAI
    console.log("Lease Analyzer: Analyzing text with OpenAI");
    let analysis;
    try {
      analysis = await analyzeWithOpenAI(extractedText);
      console.log("Lease Analyzer: Text analysis complete");
    } catch (openAiError) {
      console.error("Lease Analyzer: OpenAI error:", openAiError);
      return new Response(
        JSON.stringify({
          error: `OpenAI analysis error: ${openAiError.message}`,
          details: "Failed to analyze the document text with OpenAI"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        analysis, 
        debug: {
          processedAt: new Date().toISOString(),
          textLength: extractedText.length,
          fileName: requestData.fileName,
          fileSize: requestData.fileSize,
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Lease Analyzer: Error processing document:", error);
    return new Response(
      JSON.stringify({
        error: `Error processing document: ${error.message}`,
        details: "An error occurred during document analysis"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Process PDF with Google Document AI
 */
async function processWithDocumentAI(fileBase64: string): Promise<string> {
  // Document AI API endpoint
  const url = `https://documentai.googleapis.com/v1/projects/${PROCESSOR_PROJECT_ID}/locations/${PROCESSOR_LOCATION}/processors/${PROCESSOR_ID}:process`;
  
  try {
    console.log("Lease Analyzer: Calling Google Document AI API");
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GOOGLE_DOCUMENT_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        rawDocument: {
          content: fileBase64,
          mimeType: "application/pdf",
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorInfo;
      try {
        errorInfo = JSON.parse(errorText);
      } catch {
        errorInfo = { text: errorText };
      }
      
      console.error("Document AI API error:", errorInfo);
      throw new Error(`Document AI API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.document?.text) {
      throw new Error("Document AI returned no text content");
    }
    
    console.log(`Lease Analyzer: Document AI extracted ${result.document.text.length} characters`);
    return result.document.text;
  } catch (error) {
    console.error("Error in Document AI processing:", error);
    throw error;
  }
}

/**
 * Analyze extracted text with OpenAI
 */
async function analyzeWithOpenAI(text: string): Promise<any> {
  // Split text into chunks if needed (for very large documents)
  const MAX_CHUNK_SIZE = 12000;
  const chunks = splitTextIntoChunks(text, MAX_CHUNK_SIZE);
  
  console.log(`Lease Analyzer: Split text into ${chunks.length} chunks for analysis`);
  
  try {
    // If we have multiple chunks, we'll analyze them separately and combine
    if (chunks.length > 1) {
      console.log("Lease Analyzer: Processing multiple text chunks");
      const chunkAnalyses = [];
      
      // Process each chunk
      for (let i = 0; i < chunks.length; i++) {
        console.log(`Lease Analyzer: Analyzing chunk ${i+1} of ${chunks.length}`);
        const chunkAnalysis = await analyzeSingleChunk(chunks[i], i, chunks.length);
        chunkAnalyses.push(chunkAnalysis);
      }
      
      // Combine analyses
      return combineAnalyses(chunkAnalyses);
    } else {
      // Just one chunk, analyze it directly
      console.log("Lease Analyzer: Processing single text chunk");
      return await analyzeSingleChunk(chunks[0], 0, 1);
    }
  } catch (error) {
    console.error("Error in OpenAI analysis:", error);
    throw error;
  }
}

/**
 * Analyze a single chunk of text with OpenAI
 */
async function analyzeSingleChunk(text: string, chunkIndex: number, totalChunks: number): Promise<any> {
  try {
    const prompt = `
You are an expert lease document analyzer. You're analyzing the following lease text (part ${chunkIndex + 1} of ${totalChunks}):

${text}

Extract the following information in a structured JSON format:
1. Monthly rent
2. Security deposit
3. Lease term length (start and end dates)
4. Notice required for termination
5. Pet policy details
6. Late rent penalties
7. Key responsibilities of tenant and landlord
8. Critical dates (move-in, move-out, rent due)
9. Any red flags or concerning terms in the lease

If this information is not present in this chunk, indicate "not found in this section".
`;

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
      console.error("OpenAI API error:", error);
      throw new Error(`OpenAI API error: ${error.error?.message || "Unknown error"}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Try to extract JSON from the response
    try {
      // Look for JSON in the response (it might be wrapped in code blocks)
      const jsonMatch = content.match(/```json\n([\s\S]*)\n```/) || 
                        content.match(/```\n([\s\S]*)\n```/) ||
                        content.match(/{[\s\S]*}/);
                        
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      const cleanJsonStr = jsonStr.replace(/```json|```/g, '').trim();
      
      return JSON.parse(cleanJsonStr);
    } catch (parseError) {
      console.error("Error parsing OpenAI response as JSON:", parseError);
      return { 
        error: "Could not parse response", 
        rawContent: content 
      };
    }
  } catch (error) {
    console.error(`Error analyzing chunk ${chunkIndex + 1}:`, error);
    throw error;
  }
}

/**
 * Combine multiple chunk analyses into a single analysis
 */
function combineAnalyses(chunkAnalyses: any[]): any {
  console.log("Lease Analyzer: Combining analyses from multiple chunks");
  
  // Create a final analysis request to OpenAI
  return createFinalAnalysis(chunkAnalyses);
}

/**
 * Create a final analysis from multiple chunk analyses
 */
async function createFinalAnalysis(chunkAnalyses: any[]): Promise<any> {
  try {
    const prompt = `
I'm providing you with analyses of different sections of a lease document. Each section was analyzed separately, and now I need you to combine them into a single coherent analysis.

Here are the individual analyses:

${JSON.stringify(chunkAnalyses)}

Create a comprehensive analysis of the entire lease with the following structure:
1. A summary of the lease in plain language (1-2 paragraphs)
2. Financial terms (rent, deposit, fees)
3. Lease term details (start date, end date, notice period)
4. Property details (address, unit, included amenities)
5. Parties involved (landlord, tenant, property manager)
6. Pet policy (allowed/prohibited, restrictions, fees)
7. Responsibilities (tenant vs landlord)
8. Critical dates (move-in, move-out, rent due dates)
9. Red flags or concerning terms (any unusual or potentially problematic clauses)

Format your response as a JSON object that matches this structure. If information is missing, indicate it as null or "Not specified in lease".
`;

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
            content: "You are an expert lease document analyzer that provides structured analysis of lease documents. Return your analysis as a valid JSON object.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }, // Ensure JSON response
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("OpenAI API error on final analysis:", error);
      throw new Error(`OpenAI API error: ${error.error?.message || "Unknown error"}`);
    }

    const data = await response.json();
    const analysisContent = data.choices[0].message.content;
    
    try {
      // Parse the JSON response
      const analysisJson = JSON.parse(analysisContent);
      
      // Transform into our standard structure
      return {
        summary: analysisJson.summary || "No summary available",
        confidence: 0.9, // Google Document AI + GPT-4o provides high confidence
        financialTerms: analysisJson.financialTerms || {
          monthlyRent: null,
          securityDeposit: null,
          lateFees: null,
          otherFees: [],
        },
        leaseTerms: analysisJson.leaseTerms || {
          startDate: null,
          endDate: null,
          leaseTerm: null,
          renewalTerms: null,
          noticeRequired: null,
        },
        propertyDetails: analysisJson.propertyDetails || {
          address: null,
          unitNumber: null,
          includedAmenities: [],
        },
        parties: analysisJson.parties || {
          landlord: null,
          tenant: [],
          propertyManager: null,
        },
        petPolicy: analysisJson.petPolicy || {
          allowed: false,
          restrictions: null,
          petRent: null,
          petDeposit: null,
        },
        responsibilities: analysisJson.responsibilities || {
          tenant: [],
          landlord: [],
        },
        criticalDates: analysisJson.criticalDates || {
          moveIn: null,
          moveOut: null,
          rentDueDate: null,
          lateFeeDate: null,
        },
        redFlags: analysisJson.redFlags || [],
      };
    } catch (error) {
      console.error("Error parsing final analysis JSON:", error);
      throw new Error("Failed to parse final analysis");
    }
  } catch (error) {
    console.error("Error in final analysis:", error);
    throw error;
  }
}

/**
 * Split text into manageable chunks for processing
 */
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

/**
 * Split text into chunks based on sentences
 */
function splitIntoSentenceChunks(text: string, maxChunkSize: number): string[] {
  const chunks: string[] = [];
  let currentChunk = "";
  
  // Rudimentary sentence splitting
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
