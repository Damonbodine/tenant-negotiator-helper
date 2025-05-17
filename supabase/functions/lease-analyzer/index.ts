
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// Access API keys from environment variables (with detailed validation)
const OPENAI_API_KEY = Deno.env.get("OPENAI_RENTERS_MENTOR_KEY") || Deno.env.get("OPENAI_API_KEY");
const GOOGLE_DOCUMENT_AI_API_KEY = Deno.env.get("GOOGLE_DOCUMENTAI_API_KEY");

// Google Document AI processor settings - Updated with provided details
const PROCESSOR_ID = "77d90ffb8cbda21b";
const PROCESSOR_LOCATION = "us";
const PROCESSOR_PROJECT_ID = "361961931016";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-debug",
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
  leaseId?: string;
  fileExt?: string;
  publicUrl?: string;
  text?: string; // Optional text field for test mode
  testMode?: boolean; // Flag for test mode
  debug?: boolean; // Flag for debug mode
}

// Main server function with improved error handling
serve(async (req) => {
  console.log("Lease Analyzer: Request received");
  
  // Check if debug mode is requested
  const isDebugMode = req.headers.get("x-debug") === "true";
  const debugInfo: Record<string, any> = {
    requestTime: new Date().toISOString(),
    headers: Object.fromEntries(req.headers.entries())
  };
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Lease Analyzer: CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check API keys with better error messages
    if (!GOOGLE_DOCUMENT_AI_API_KEY) {
      console.error("Lease Analyzer: Missing Google Document AI API key");
      const errorResponse = {
        error: "Server configuration error: Google Document AI API key not configured",
        details: "Please check that GOOGLE_DOCUMENTAI_API_KEY is set in Supabase Edge Function secrets"
      };
      
      if (isDebugMode) {
        console.log("Debug info requested, adding to error response");
        Object.assign(errorResponse, { debug: debugInfo });
      }
      
      return new Response(
        JSON.stringify(errorResponse),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    if (!OPENAI_API_KEY) {
      console.error("Lease Analyzer: Missing OpenAI API key");
      const errorResponse = {
        error: "Server configuration error: OpenAI API key not configured",
        details: "Please check that OPENAI_RENTERS_MENTOR_KEY is set in Supabase Edge Function secrets"
      };
      
      if (isDebugMode) {
        Object.assign(errorResponse, { debug: debugInfo });
      }
      
      return new Response(
        JSON.stringify(errorResponse),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check Processor details
    if (!PROCESSOR_ID || !PROCESSOR_LOCATION || !PROCESSOR_PROJECT_ID) {
      console.error("Lease Analyzer: Missing Document AI processor details");
      const errorResponse = {
        error: "Server configuration error: Document AI processor details not configured",
        details: "Please check that PROCESSOR_ID, PROCESSOR_LOCATION, and PROCESSOR_PROJECT_ID are correctly set"
      };
      
      if (isDebugMode) {
        Object.assign(errorResponse, { debug: debugInfo });
      }
      
      return new Response(
        JSON.stringify(errorResponse),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const { leaseId, fileExt, publicUrl, text, testMode } = await req.json() as RequestBody;
    
    // Check for test mode
    if (testMode === true) {
      console.log("Lease Analyzer: Test mode detected, sending sample response");
      return new Response(
        JSON.stringify({
          ok: true,
          message: "Test mode response",
          analysis: {
            rent: 1500,
            deposit: 1500,
            termMonths: 12,
            flags: [
              { level: "medium", clause: "Early termination fee is 2x monthly rent", line: 45 }
            ],
            summary: "Standard 12-month lease with some concerns about the early termination clause."
          }
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Validate required fields
    if (!leaseId || !publicUrl) {
      const errorResponse = {
        error: "Missing required parameters",
        details: "Both leaseId and publicUrl are required"
      };
      
      if (isDebugMode) {
        Object.assign(errorResponse, { debug: debugInfo });
      }
      
      return new Response(
        JSON.stringify(errorResponse),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Create Supabase client
    const supabaseUrl = "https://izzdyfrcxunfzlfgdjuv.supabase.co";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseKey) {
      console.error("Lease Analyzer: Missing Supabase service role key");
      const errorResponse = {
        error: "Server configuration error: Supabase service role key not configured",
        details: "Please check that SUPABASE_SERVICE_ROLE_KEY is set in Supabase Edge Function secrets"
      };
      
      if (isDebugMode) {
        Object.assign(errorResponse, { debug: debugInfo });
      }
      
      return new Response(
        JSON.stringify(errorResponse),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    try {
      // Download the file
      console.log(`Lease Analyzer: Downloading file from URL: ${publicUrl}`);
      
      const fileResponse = await fetch(publicUrl);
      if (!fileResponse.ok) {
        throw new Error(`Failed to download file: ${fileResponse.status} ${fileResponse.statusText}`);
      }
      
      const fileBuffer = await fileResponse.arrayBuffer();
      const fileBytes = new Uint8Array(fileBuffer);
      
      console.log(`Lease Analyzer: Downloaded file of size ${fileBytes.length} bytes`);
      debugInfo.fileSize = fileBytes.length;
      
      // Extract text from the file based on its extension
      let extractedText = "";
      const extension = fileExt || publicUrl.split('.').pop()?.toLowerCase() || '';
      
      console.log(`Lease Analyzer: Processing file with extension: ${extension}`);
      debugInfo.fileExtension = extension;
      
      if (extension === 'pdf') {
        // Use pdf-parse
        console.log("Lease Analyzer: Using pdf-parse for text extraction");
        
        const { default: pdfParse } = await import("https://esm.sh/pdf-parse@1.1.1");
        try {
          const pdfData = await pdfParse(fileBytes);
          extractedText = pdfData.text;
        } catch (pdfError) {
          console.error("PDF parsing error:", pdfError);
          throw new Error(`Failed to parse PDF: ${pdfError instanceof Error ? pdfError.message : String(pdfError)}`);
        }
      } else if (extension === 'docx') {
        // Use mammoth for DOCX
        console.log("Lease Analyzer: Using mammoth for DOCX extraction");
        
        const { default: mammoth } = await import("https://esm.sh/mammoth@1.6.0");
        try {
          const result = await mammoth.extractRawText({ arrayBuffer: fileBuffer });
          extractedText = result.value;
        } catch (docxError) {
          console.error("DOCX parsing error:", docxError);
          throw new Error(`Failed to parse DOCX: ${docxError instanceof Error ? docxError.message : String(docxError)}`);
        }
      } else {
        // Use textract for other formats
        console.log("Lease Analyzer: Using Google Document AI for text extraction");
        
        // For other formats, directly go to Document AI
        extractedText = await processWithDocumentAI(fileBytes, 
          extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' :
          extension === 'png' ? 'image/png' : 
          'application/octet-stream');
      }
      
      console.log(`Lease Analyzer: Initial text extraction complete, got ${extractedText.length} characters`);
      debugInfo.initialTextLength = extractedText.length;
      
      // If extracted text is too short, use Document AI
      if (extractedText.length < 200) {
        console.log("Lease Analyzer: Extracted text too short, using Document AI");
        extractedText = await processWithDocumentAI(fileBytes, 
          extension === 'pdf' ? 'application/pdf' :
          extension === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
          extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' :
          extension === 'png' ? 'image/png' : 
          'application/octet-stream');
          
        console.log(`Lease Analyzer: Document AI extraction complete, got ${extractedText.length} characters`);
        debugInfo.documentAiTextLength = extractedText.length;
      }
      
      // Truncate text if too long for OpenAI
      const MAX_CHARS = 12000;
      if (extractedText.length > MAX_CHARS) {
        console.log(`Lease Analyzer: Truncating text from ${extractedText.length} to ${MAX_CHARS} characters`);
        extractedText = extractedText.substring(0, MAX_CHARS);
      }
      
      // Remove PII using regex
      console.log("Lease Analyzer: Removing PII");
      extractedText = removePII(extractedText);
      
      // Pre-process text and extract potential rent/deposit values with regex
      const cleaned = preprocess(extractedText);
      const rentVals = extractNumbers(cleaned, rentPatterns);
      const depositVals = extractNumbers(cleaned, depositPatterns);
      
      console.log(`Lease Analyzer: Found ${rentVals.length} potential rent values and ${depositVals.length} potential deposit values`);
      debugInfo.regexFindings = { rentVals, depositVals };
      
      // Get analysis from OpenAI
      console.log("Lease Analyzer: Calling OpenAI for analysis");
      const analysis = await analyzeWithOpenAI(extractedText, { rentVals, depositVals });
      
      // Update the lease record with the analysis
      console.log(`Lease Analyzer: Updating lease record ${leaseId} with analysis`);
      const { error: updateError } = await supabase
        .from('leases')
        .update({ 
          analysis, 
          status: 'complete',
          error: null
        })
        .eq('id', leaseId);
      
      if (updateError) {
        throw new Error(`Failed to update lease record: ${updateError.message}`);
      }
      
      return new Response(
        JSON.stringify({ 
          ok: true,
          message: "Lease analyzed successfully"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
      
    } catch (processingError) {
      console.error("Lease Analyzer: Processing error:", processingError);
      
      // Update lease record with error
      const errorMessage = processingError instanceof Error ? processingError.message : String(processingError);
      
      try {
        await supabase
          .from('leases')
          .update({ 
            status: 'error',
            error: errorMessage.substring(0, 255) // Limit error message length
          })
          .eq('id', leaseId);
      } catch (dbError) {
        console.error("Failed to update lease with error status:", dbError);
      }
      
      const errorResponse = {
        ok: false,
        error: "Failed to process lease document",
        details: errorMessage
      };
      
      if (isDebugMode) {
        Object.assign(errorResponse, { debug: { ...debugInfo, error: errorMessage } });
      }
      
      return new Response(
        JSON.stringify(errorResponse),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
  } catch (error) {
    console.error("Lease Analyzer: Unhandled error:", error);
    
    const errorResponse = {
      ok: false,
      error: "Unhandled server error",
      details: error instanceof Error ? error.message : String(error)
    };
    
    if (isDebugMode) {
      Object.assign(errorResponse, { 
        debug: { 
          ...debugInfo, 
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        } 
      });
    }
    
    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Process document with Google Document AI
 */
async function processWithDocumentAI(fileBytes: Uint8Array, mimeType: string = "application/pdf"): Promise<string> {
  if (!GOOGLE_DOCUMENT_AI_API_KEY) {
    throw new Error("GOOGLE_DOCUMENTAI_API_KEY is not set");
  }

  if (!PROCESSOR_PROJECT_ID || !PROCESSOR_LOCATION || !PROCESSOR_ID) {
    throw new Error("Document AI processor details (PROCESSOR_PROJECT_ID, PROCESSOR_LOCATION, PROCESSOR_ID) are not properly configured");
  }

  // Document AI API endpoint
  const endpoint = `https://documentai.googleapis.com/v1/projects/${PROCESSOR_PROJECT_ID}/locations/${PROCESSOR_LOCATION}/processors/${PROCESSOR_ID}:process`;
  
  console.log(`Lease Analyzer: Document AI endpoint: ${endpoint}`);
  
  // Convert Uint8Array to base64
  const fileBase64 = btoa(String.fromCharCode.apply(null, Array.from(fileBytes)));
  
  try {
    console.log("Lease Analyzer: Calling Google Document AI API");
    
    const response = await fetch(`${endpoint}?key=${GOOGLE_DOCUMENT_AI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        rawDocument: {
          content: fileBase64,
          mimeType: mimeType,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Document AI API error: ${response.status} ${response.statusText}`, errorText);
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
 * Remove PII from text using regex patterns
 */
function removePII(text: string): string {
  // SSN pattern: 123-45-6789 or 123456789
  const ssnPattern = /\b\d{3}-?\d{2}-?\d{4}\b/g;
  
  // Phone number patterns
  const phonePatterns = [
    /\b\d{3}-\d{3}-\d{4}\b/g, // 123-456-7890
    /\b\(\d{3}\) \d{3}-\d{4}\b/g, // (123) 456-7890
    /\b\d{3}\.\d{3}\.\d{4}\b/g, // 123.456.7890
  ];
  
  // Credit card pattern
  const ccPattern = /\b(?:\d{4}[ -]?){3}\d{4}\b/g;
  
  // Date of birth pattern (various formats)
  const dobPatterns = [
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, // MM/DD/YYYY
    /\b\d{1,2}-\d{1,2}-\d{2,4}\b/g, // MM-DD-YYYY
  ];
  
  // Replace SSNs
  text = text.replace(ssnPattern, "[REDACTED SSN]");
  
  // Replace phone numbers
  for (const pattern of phonePatterns) {
    text = text.replace(pattern, "[REDACTED PHONE]");
  }
  
  // Replace credit card numbers
  text = text.replace(ccPattern, "[REDACTED CC]");
  
  // Replace dates of birth
  for (const pattern of dobPatterns) {
    text = text.replace(pattern, "[REDACTED DATE]");
  }
  
  return text;
}

/**
 * Analyze extracted text with OpenAI
 */
async function analyzeWithOpenAI(text: string, context: any): Promise<any> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const systemPrompt = 
    'You are Renters Mentor, NOT a lawyer. Identify key lease facts, flag risky clauses ' +
    '(high/med/low), and output strict JSON { rent, deposit, termMonths, flags:[{level,clause,line}], summary }. ' +
    'Never give legal advice.';

  try {
    console.log("Lease Analyzer: Analyzing with OpenAI");
    
    // Include regex findings in the prompt for better accuracy
    let userPrompt = `Analyze this lease document and extract key facts: \n\n${text}\n\n`;
    
    if (context.rentVals && context.rentVals.length > 0) {
      userPrompt += `\nPotential rent values detected: ${context.rentVals.join(', ')}\n`;
    }
    
    if (context.depositVals && context.depositVals.length > 0) {
      userPrompt += `\nPotential security deposit values detected: ${context.depositVals.join(', ')}\n`;
    }
    
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
            content: systemPrompt,
          },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }, // Ensure JSON response
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("OpenAI API error:", error);
      throw new Error(`OpenAI API error: ${error.error?.message || "Unknown error"}`);
    }

    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);
    
    console.log("Lease Analyzer: OpenAI analysis complete");
    
    // Add detected rent/deposit values for reference
    analysis.detectedRentValues = context.rentVals || [];
    analysis.detectedDepositValues = context.depositVals || [];
    
    return analysis;
  } catch (error) {
    console.error("Error analyzing with OpenAI:", error);
    throw error;
  }
}
