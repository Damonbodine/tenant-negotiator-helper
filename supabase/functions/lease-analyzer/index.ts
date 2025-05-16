
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// Access API keys from environment variables
const OPENAI_API_KEY = Deno.env.get("OPENAI_RENTERS_MENTOR_KEY") || Deno.env.get("OPENAI_API_KEY");
const GOOGLE_DOCUMENT_AI_API_KEY = Deno.env.get("GOOGLE_DOCUMENTAI_API_KEY");

// Google Document AI processor settings - Updated with provided details
const PROCESSOR_ID = "77d90ffb8cbda21b"; // Updated with correct processor ID
const PROCESSOR_LOCATION = "us";
const PROCESSOR_PROJECT_ID = "361961931016"; // Updated with correct project ID

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Regex patterns for rent and deposit extraction
const rentPatterns = [
  /(?:RENT|PAYMENT|BASE\s+RENT|MONTHLY\s+RENT)(?:\s*:|\.|\s+is|\s+shall\s+be|\s+will\s+be)\s*\$?([\d,]+(?:\.\d{1,2})?)/ig,
  /\$([\d,]+(?:\.\d{1,2})?)\s*(?:per|\/)\s*(?:month|mo)/ig,
  /(?:tenant|lessee)(?:\s*shall|\s*will|\s*agrees\s*to)?\s*pay\s*\$?([\d,]+(?:\.\d{1,2})?)/ig,
  /rent\s*(?:is|shall\s*be|will\s*be|amount)?\s*(?:is|\:)?\s*\$?([\d,]+(?:\.\d{1,2})?)/ig,
  /rent.*?\$\s*([\d,]+(?:\.\d{1,2})?)/ig,
  /tenant(?:'s)?\s*monthly\s*rent\s*(?:for\s*the\s*(?:apartment|unit|property))?\s*is\s*\$?([\d,]+(?:\.\d{1,2})?)/ig,
];

const depositPatterns = [
  /(?:security\s*deposit)(?:\s*:|\.|\s+is|\s+shall\s+be|\s+will\s+be|\s*of|\s*amount|\s*in\s*the\s*amount\s*of)?\s*\$?([\d,]+(?:\.\d{1,2})?)/ig,
  /(?:deposit|security\s*deposit)\s*(?:of|is|in\s*the\s*amount\s*of|amount|:)?\s*\$?([\d,]+(?:\.\d{1,2})?)/ig,
];

// Helper functions for text extraction
function extractNumbers(text: string, patterns: RegExp[]) {
  const nums: number[] = [];
  for (const pat of patterns) {
    for (const m of text.matchAll(pat)) {
      const val = parseFloat(m[1].replace(/,/g, ""));
      if (!isNaN(val) && val > 100) nums.push(val);
    }
  }
  return nums;
}

function preprocess(text: string) {
  return text
    .replace(/\s+/g, " ")
    .replace(/\$\s+/g, "$")
    .replace(/(\d),(\d)/g, "$1$2");
}

interface RequestBody {
  fileBase64?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
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

    // Check if this is a form data submission or JSON request
    const contentType = req.headers.get("content-type") || "";
    let requestData: RequestBody;
    let file: Uint8Array | null = null;
    let fileBytes: Uint8Array | null = null;
    let fileType = "application/pdf";
    let fileName = "document.pdf";
    let textContent = "";

    if (contentType.includes("multipart/form-data")) {
      console.log("Lease Analyzer: Processing form data request");
      
      try {
        const formData = await req.formData();
        const formFile = formData.get("file") as File | null;
        
        if (!formFile) {
          return new Response(
            JSON.stringify({
              error: "No file provided",
              details: "The request must include a 'file' field with the PDF document"
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        
        if (formFile.size > 10 * 1024 * 1024) {
          return new Response(
            JSON.stringify({
              error: "File too large",
              details: "Maximum file size is 10MB"
            }),
            {
              status: 413,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        
        // Process the file
        fileBytes = new Uint8Array(await formFile.arrayBuffer());
        fileType = formFile.type || "application/pdf";
        fileName = formFile.name || "document.pdf";
        
        requestData = {
          fileName,
          fileType,
          fileSize: formFile.size
        };
        
        console.log(`Lease Analyzer: Received ${fileName} (${formFile.size} bytes)`);
      } catch (error) {
        console.error("Lease Analyzer: Failed to parse form data", error);
        return new Response(
          JSON.stringify({
            error: "Invalid form data",
            details: "Could not parse the form data or missing required fields",
            message: error instanceof Error ? error.message : String(error)
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else {
      // Process as JSON request
      console.log("Lease Analyzer: Processing JSON request");
      
      try {
        requestData = await req.json();
        console.log("Lease Analyzer: Request received for file:", requestData.fileName || 'unknown');
        
        // Check if this is test mode
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
        if (requestData.fileBase64) {
          // Process base64-encoded file
          console.log("Lease Analyzer: Processing base64 encoded file");
          
          // Ensure fileBase64 is properly formatted (no data:application/pdf;base64, prefix)
          if (requestData.fileBase64.includes(";base64,")) {
            console.log("Lease Analyzer: Removing base64 prefix");
            requestData.fileBase64 = requestData.fileBase64.split(";base64,")[1];
          }
          
          try {
            fileBytes = new Uint8Array(atob(requestData.fileBase64).split('').map(c => c.charCodeAt(0)));
            fileName = requestData.fileName || "document.pdf";
            fileType = requestData.fileType || "application/pdf";
          } catch (error) {
            console.error("Lease Analyzer: Failed to decode base64 data", error);
            return new Response(
              JSON.stringify({
                error: "Invalid base64 data",
                details: "Could not decode the base64 file content"
              }),
              {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
        } else if (requestData.text) {
          // Use text directly if provided (useful for testing)
          console.log("Lease Analyzer: Using provided text directly");
          textContent = requestData.text;
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
      } catch (error) {
        console.error("Lease Analyzer: Failed to parse request body", error);
        return new Response(
          JSON.stringify({
            error: "Invalid request format",
            details: "Could not parse the request JSON body or missing required fields",
            message: error instanceof Error ? error.message : String(error)
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Process document with Google Document AI (if we have a file) or use text directly
    let extractedText: string;
    
    if (fileBytes) {
      console.log("Lease Analyzer: Processing document with Google Document AI");
      try {
        extractedText = await processWithDocumentAI(fileBytes, fileType);
        console.log(`Lease Analyzer: Document processing complete. Extracted ${extractedText.length} characters.`);
      } catch (docAiError) {
        console.error("Lease Analyzer: Document AI error:", docAiError);
        return new Response(
          JSON.stringify({
            error: `Document AI processing error: ${docAiError instanceof Error ? docAiError.message : String(docAiError)}`,
            details: "Failed to process the document with Google Document AI"
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else if (textContent) {
      // Use text directly if provided (useful for testing)
      console.log("Lease Analyzer: Using provided text directly");
      extractedText = textContent;
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
    
    // Pre-process text and extract potential rent/deposit values with regex
    const cleaned = preprocess(extractedText);
    const rentVals = extractNumbers(cleaned, rentPatterns);
    const depositVals = extractNumbers(cleaned, depositPatterns);
    
    // Add regex findings to context for OpenAI
    const context = { regexFindings: { rentVals, depositVals } };
    
    // Analyze text with OpenAI
    console.log("Lease Analyzer: Analyzing text with OpenAI");
    let analysis;
    try {
      analysis = await analyzeWithOpenAI(extractedText, context);
      console.log("Lease Analyzer: Text analysis complete");
      
      // Add regex findings to the final analysis
      analysis.regexFindings = context.regexFindings;
    } catch (openAiError) {
      console.error("Lease Analyzer: OpenAI error:", openAiError);
      return new Response(
        JSON.stringify({
          error: `OpenAI analysis error: ${openAiError instanceof Error ? openAiError.message : String(openAiError)}`,
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
          fileName: fileName,
          fileSize: fileBytes ? fileBytes.length : textContent.length,
          regexFindings: context.regexFindings
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
        error: `Error processing document: ${error instanceof Error ? error.message : String(error)}`,
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
 * Process PDF with Google Document AI - now with imageless mode support
 */
async function processWithDocumentAI(fileBytes: Uint8Array, mimeType: string = "application/pdf"): Promise<string> {
  // Document AI API endpoint
  const url = `https://documentai.googleapis.com/v1/projects/${PROCESSOR_PROJECT_ID}/locations/${PROCESSOR_LOCATION}/processors/${PROCESSOR_ID}:process`;
  
  // Convert Uint8Array to base64
  const fileBase64 = btoa(String.fromCharCode.apply(null, Array.from(fileBytes)));
  
  try {
    console.log("Lease Analyzer: Calling Google Document AI API with imageless mode");
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GOOGLE_DOCUMENT_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        rawDocument: {
          content: fileBase64,
          mimeType: mimeType,
        },
        // Enable imageless mode to handle larger documents and improve processing
        imagelessMode: true
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
async function analyzeWithOpenAI(text: string, context: any): Promise<any> {
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
        const chunkAnalysis = await analyzeSingleChunk(chunks[i], i, chunks.length, context);
        chunkAnalyses.push(chunkAnalysis);
      }
      
      // Combine analyses
      return combineAnalyses(chunkAnalyses, context);
    } else {
      // Just one chunk, analyze it directly
      console.log("Lease Analyzer: Processing single text chunk");
      return await analyzeSingleChunk(chunks[0], 0, 1, context);
    }
  } catch (error) {
    console.error("Error in OpenAI analysis:", error);
    throw error;
  }
}

/**
 * Analyze a single chunk of text with OpenAI
 */
async function analyzeSingleChunk(text: string, chunkIndex: number, totalChunks: number, context: any): Promise<any> {
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

Additional context: ${JSON.stringify(context)}. If rent or deposit values have been detected by regex, prioritize these values but verify they make sense in context.

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
        response_format: { type: "json_object" }, // Ensure JSON response
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("OpenAI API error:", error);
      throw new Error(`OpenAI API error: ${error.error?.message || "Unknown error"}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      // Parse JSON response directly since we're using response_format: { type: "json_object" }
      return JSON.parse(content);
    } catch (parseError) {
      console.error("Error parsing OpenAI response as JSON:", parseError);
      return { 
        error: "Could not parse response", 
        rawContent: content.substring(0, 500) + "..." // Include part of the raw response
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
function combineAnalyses(chunkAnalyses: any[], context: any): any {
  console.log("Lease Analyzer: Combining analyses from multiple chunks");
  
  // Create a final analysis request to OpenAI
  return createFinalAnalysis(chunkAnalyses, context);
}

/**
 * Create a final analysis from multiple chunk analyses
 */
async function createFinalAnalysis(chunkAnalyses: any[], context: any): Promise<any> {
  try {
    const prompt = `
I'm providing you with analyses of different sections of a lease document. Each section was analyzed separately, and now I need you to combine them into a single coherent analysis.

Here are the individual analyses:

${JSON.stringify(chunkAnalyses)}

Additional context: ${JSON.stringify(context)}. If rent or deposit values have been detected by regex, prioritize these values but verify they make sense in context.

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
      // Parse JSON from response (should be clean since we used response_format: { type: "json_object" })
      const analysisJson = JSON.parse(analysisContent);
      
      // Enhance confidence if rent value matches regex findings
      let confidenceScore = 0.9; // Default high confidence
      
      // Check if rent value matches regex findings
      if (analysisJson.financialTerms?.monthlyRent && 
          context.regexFindings?.rentVals?.includes(analysisJson.financialTerms.monthlyRent)) {
        confidenceScore = 0.95; // Boost confidence score
      }
      
      // Transform into our standard structure
      return {
        summary: analysisJson.summary || "No summary available",
        confidence: confidenceScore,
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
