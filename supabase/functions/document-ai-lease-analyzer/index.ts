import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { OpenAI } from "https://esm.sh/openai@4.28.0";

/**
 * Document AI Lease Analyzer Edge Function
 * Uses Google Document AI API for document processing and extraction
 * with OpenAI GPT-4o for analysis of the extracted content
 */

// Access keys from environment variables
const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

// Set up the OpenAI client
const openai = openaiApiKey
  ? new OpenAI({ apiKey: openaiApiKey })
  : null;

// Define CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Google Document AI API configuration
// Using the enterprise document OCR processor
const GOOGLE_API_ENDPOINT = "https://documentai.googleapis.com/v1";
const PROJECT_ID = "renters-mentor"; // Update with your Google Cloud project ID
const LOCATION = "us"; // Update based on your processor location
const PROCESSOR_ID = "pretrained-ocr-v2.0-2023-06-02"; // Using OCR processor

/**
 * Process a document using Google Document AI
 */
async function processDocumentWithDocumentAI(fileBase64: string, mimeType: string): Promise<any> {
  console.log(`Starting Document AI processing for file of type: ${mimeType}`);
  
  try {
    // Google Document AI API endpoint for document processing
    const url = `${GOOGLE_API_ENDPOINT}/projects/${PROJECT_ID}/locations/${LOCATION}/processors/${PROCESSOR_ID}:process`;
    
    // Prepare the request body
    const requestBody = {
      rawDocument: {
        content: fileBase64,
        mimeType: mimeType
      }
    };
    
    // Call the Document AI API
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${googleApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    // Check for successful response
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Document AI API error: ${response.status} - ${errorText}`);
    }
    
    // Parse the JSON response
    const result = await response.json();
    console.log("Document AI processing successful");
    
    return result;
  } catch (error) {
    console.error("Document AI processing failed:", error);
    throw error;
  }
}

/**
 * Extract financial data from text using regex as a backup method
 */
function extractFinancialDataWithRegex(text: string): {
  potentialRentValues: number[] | null;
  potentialDepositValues: number[] | null;
  potentialTenants: string[] | null;
} {
  // Multiple regex patterns to catch different formats of rent specification
  const rentPatterns = [
    /rent(?:'s)?\s*monthly\s*rent\s*(?:for\s*the\s*(?:apartment|unit|property))?\s*is\s*\$?([\d,]+(?:\.\d{1,2})?)/gi,
    /rent.*?\$\s*([\d,]+(?:\.\d{1,2})?)/gi,
    /rent\s*(?:is|shall\s*be|will\s*be|amount)?\s*(?:is|\:)?\s*\$?([\d,]+(?:\.\d{1,2})?)/gi,
    /(?:tenant|lessee)(?:\s*shall|\s*will|\s*agrees\s*to)?\s*pay\s*\$?([\d,]+(?:\.\d{1,2})?)/gi,
    /\$([\d,]+(?:\.\d{1,2})?)(?:\s*|\s*dollars\s*)(?:per|\/)\s*(?:month|mo)/gi,
    /(?:RENT|PAYMENT|BASE\s+RENT|MONTHLY\s+RENT)(?:\s*:|\.|\\s+is|\s+shall\s+be|\s+will\s+be)\s*\$?([\d,]+(?:\.\d{1,2})?)/gi
  ];

  const depositPatterns = [
    /security\s*deposit(?:\s*is|\s*shall\s*be|\s*will\s*be|\s*in\s*the\s*amount\s*of)?\s*\$?([\d,]+(?:\.\d{1,2})?)/gi,
    /deposit(?:\s*is|\s*shall\s*be|\s*will\s*be|\s*in\s*the\s*amount\s*of)?\s*\$?([\d,]+(?:\.\d{1,2})?)/gi,
    /\$?([\d,]+(?:\.\d{1,2})?)\s*(?:security\s*deposit|deposit)/gi
  ];

  const tenantPatterns = [
    /tenant(?:s)?(?:\s*name|\s*is|\s*are)?(?:\s*:)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
    /lessee(?:s)?(?:\s*name|\s*is|\s*are)?(?:\s*:)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
    /this\s*agreement\s*(?:is\s*)?(?:made\s*and\s*entered\s*into\s*)?(?:by\s*and\s*between\s*)?(?:.*?)\s*and\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi
  ];

  const rentMatches = new Set<number>();
  const depositMatches = new Set<number>();
  const tenantMatches = new Set<string>();

  console.log("Searching for financial data with regex");

  // Search for rent matches
  for (const pattern of rentPatterns) {
    let match;
    // Reset lastIndex for the regex
    pattern.lastIndex = 0;
    
    while ((match = pattern.exec(text)) !== null) {
      // Clean up the match: remove commas and convert to number
      const value = parseFloat(match[1].replace(/,/g, ""));
      if (!isNaN(value) && value > 0 && value < 20000) { // Reasonable rent range
        rentMatches.add(value);
      }
    }
  }

  // Search for deposit matches
  for (const pattern of depositPatterns) {
    let match;
    pattern.lastIndex = 0;
    while ((match = pattern.exec(text)) !== null) {
      const value = parseFloat(match[1].replace(/,/g, ""));
      if (!isNaN(value) && value > 0 && value < 20000) {
        depositMatches.add(value);
      }
    }
  }

  // Search for tenant names
  for (const pattern of tenantPatterns) {
    let match;
    pattern.lastIndex = 0;
    while ((match = pattern.exec(text)) !== null) {
      // Basic name validation
      if (match[1] && match[1].length > 2 && /[A-Za-z]/.test(match[1])) {
        tenantMatches.add(match[1].trim());
      }
    }
  }

  const results = {
    potentialRentValues: rentMatches.size > 0 ? Array.from(rentMatches) : null,
    potentialDepositValues: depositMatches.size > 0 ? Array.from(depositMatches) : null,
    potentialTenants: tenantMatches.size > 0 ? Array.from(tenantMatches) : null,
  };

  console.log("Regex extracted financial data:", results);
  return results;
}

/**
 * Enhanced analysis of the extracted document text using OpenAI's GPT-4o
 */
async function analyzeLeaseWithGPT(documentText: string, documentStructure: any, regexData: any): Promise<any> {
  if (!openai) {
    console.warn("OpenAI API key not configured. Using fallback analysis.");
    return generateFallbackAnalysis(documentText, regexData);
  }

  console.log("Analyzing lease with GPT-4o");
  
  try {
    const systemPrompt = `You are an expert legal assistant specializing in rental lease agreements. 
    Analyze the provided lease document and extract key information in a structured format.
    
    DO NOT FABRICATE ANY INFORMATION. If information is not present in the document, clearly indicate it is missing or unknown.
    
    CRITICAL FINANCIAL INFORMATION EXTRACTION:
    - Pay special attention to RENT AMOUNT - look for monthly rent, base rent, or annual rent divided by 12
    - Common rent formats include:
      * "$5,300 per month"
      * "monthly rent: $5,300" 
      * "Tenant shall pay $5,300"
      * "rent will be $5,300 per month"
      * "RENT: $5,300"
      * "agrees to pay $5,300 monthly"
    
    IMPORTANT GUIDELINES:
    1. Only extract information that is EXPLICITLY stated in the document
    2. Mark any fields where information isn't explicitly provided as "unknown" or "not specified"
    3. Do NOT make assumptions about values not present in the text
    4. For renewal type, ONLY set as "automatic" if explicitly stated - otherwise use "not specified" or extract what's stated
    
    Format your response as JSON with the following structure:
    {
      "summary": "Clear overview of the lease",
      "complexTerms": [
        { "term": "Name of term", "explanation": "Plain language explanation" }
      ],
      "unusualClauses": [
        { "clause": "Description of clause", "concern": "Why it's unusual or concerning", "riskLevel": "high|medium|low" }
      ],
      "questions": [
        "Question 1",
        "Question 2"
      ],
      "extractedData": {
        // Detailed structured data about financial terms, dates, parties, etc.
      },
      "extractionConfidence": {
        "rent": "high|medium|low",
        "securityDeposit": "high|medium|low",
        "lateFee": "high|medium|low",
        "term": "high|medium|low",
        "utilities": "high|medium|low"
      }
    }`;

    // Context data packet that includes regex findings to help guide the AI
    const contextData = {
      documentStructure: documentStructure,
      regexFindings: regexData,
    };

    // Call OpenAI API for analysis
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Use gpt-4o for best results, gpt-4o-mini for cost efficiency
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: documentText },
        { 
          role: "user", 
          content: `Additional context: ${JSON.stringify(contextData)}. 
          If the regex found potential rent values ${JSON.stringify(regexData?.potentialRentValues)}, 
          please consider these in your extraction and explain if you choose a different value.
          DO NOT make up information that isn't in the document. If you don't find something, mark it as "unknown" or "not specified".`
        }
      ],
      temperature: 0.1, // Lower temperature for more deterministic results
      response_format: { type: "json_object" }
    });

    // Parse and validate the analysis
    const analysisContent = JSON.parse(response.choices[0].message.content);
    
    // Add the regex findings to help with verification
    analysisContent.regexFindings = regexData;
    
    // Run validation checks between AI and regex extractions
    if (analysisContent.extractedData?.financial?.rent && regexData?.potentialRentValues) {
      const aiRent = analysisContent.extractedData.financial.rent.amount;
      
      // If regex found values that match the AI extraction, increase confidence
      if (regexData.potentialRentValues.includes(aiRent)) {
        analysisContent.extractionConfidence.rent = "high";
        console.log(`AI rent value (${aiRent}) matches regex findings - setting confidence to high`);
      } 
      // If regex found values that differ from AI extraction, flag for verification
      else if (regexData.potentialRentValues.length > 0) {
        analysisContent.rentVerificationNeeded = true;
        analysisContent.alternativeRentValues = regexData.potentialRentValues;
        analysisContent.regexRentValues = regexData.potentialRentValues;
        console.log(`AI rent value (${aiRent}) doesn't match regex findings - verification needed`);
      }
    }
    
    // If AI didn't find rent but regex did, prompt for verification
    if (!analysisContent.extractedData?.financial?.rent?.amount && regexData?.potentialRentValues?.length > 0) {
      console.log(`AI didn't extract rent but regex found values - setting default and requiring verification`);
      // Set a default rent value from regex for verification
      if (!analysisContent.extractedData) {
        analysisContent.extractedData = {};
      }
      if (!analysisContent.extractedData.financial) {
        analysisContent.extractedData.financial = {};
      }
      analysisContent.extractedData.financial.rent = {
        amount: regexData.potentialRentValues[0],
        frequency: "monthly"
      };
      analysisContent.rentVerificationNeeded = true;
      analysisContent.extractionConfidence = analysisContent.extractionConfidence || {};
      analysisContent.extractionConfidence.rent = "low";
      analysisContent.regexRentValues = regexData.potentialRentValues;
    }
    
    return analysisContent;
  } catch (error) {
    console.error("Error analyzing lease with OpenAI:", error);
    // Fall back to basic analysis if GPT fails
    return generateFallbackAnalysis(documentText, regexData);
  }
}

/**
 * Generate a fallback analysis when AI services fail
 */
function generateFallbackAnalysis(text: string, regexData: any = null): any {
  console.log("Generating fallback analysis using regex data");
  
  const defaultData = {
    summary: "We've extracted basic information from your lease document. Some details may need verification.",
    extractionConfidence: { 
      rent: "low", 
      securityDeposit: "low",
      term: "low",
      parties: "low"
    },
    complexTerms: [],
    unusualClauses: [],
    questions: [
      "What is the exact monthly rent amount?",
      "What is the security deposit amount?",
      "When does the lease begin and end?",
      "Who are all the tenants on the lease?",
      "What utilities are you responsible for?"
    ]
  };
  
  // If we have regex data, use it
  if (regexData) {
    // Create extractedData structure if we found anything with regex
    const extractedData: any = {};
    
    // Add financial data if found
    if (regexData.potentialRentValues || regexData.potentialDepositValues) {
      extractedData.financial = {};
      
      if (regexData.potentialRentValues && regexData.potentialRentValues.length > 0) {
        // Use the most common value or the first one
        extractedData.financial.rent = {
          amount: regexData.potentialRentValues[0],
          frequency: "monthly"
        };
      }
      
      if (regexData.potentialDepositValues && regexData.potentialDepositValues.length > 0) {
        extractedData.financial.securityDeposit = regexData.potentialDepositValues[0];
      }
    }
    
    // Add tenant data if found
    if (regexData.potentialTenants && regexData.potentialTenants.length > 0) {
      extractedData.parties = {
        tenants: regexData.potentialTenants
      };
    }
    
    // Add the extracted data to the default
    if (Object.keys(extractedData).length > 0) {
      defaultData.extractedData = extractedData;
      
      // Set verification flag if we found multiple potential values
      if (regexData.potentialRentValues && regexData.potentialRentValues.length > 1) {
        defaultData.rentVerificationNeeded = true;
        defaultData.regexRentValues = regexData.potentialRentValues;
      }
    }
  }
  
  return defaultData;
}

/**
 * Get file mime type based on file name extension
 */
function getMimeType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch(extension) {
    case 'pdf':
      return 'application/pdf';
    case 'doc':
      return 'application/msword';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'txt':
      return 'text/plain';
    default:
      return 'application/octet-stream';
  }
}

// Main function to handle HTTP requests
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const requestData = await req.json();
    const { fileBase64, fileName, fileType } = requestData;
    
    if (!fileBase64 || !fileName) {
      return new Response(
        JSON.stringify({ error: 'Missing file data or file name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Processing document: ${fileName} (${fileType || 'unknown type'})`);
    
    // Determine MIME type based on file name if not provided
    const mimeType = fileType || getMimeType(fileName);
    
    // Process with Google Document AI
    let documentAIResults;
    let extractedText = "";
    let documentStructure = null;
    
    try {
      documentAIResults = await processDocumentWithDocumentAI(fileBase64, mimeType);
      
      // Extract text from Document AI results
      if (documentAIResults?.document?.text) {
        extractedText = documentAIResults.document.text;
        documentStructure = {
          pages: documentAIResults.document.pages,
          entities: documentAIResults.document.entities,
        };
        
        console.log(`Successfully extracted ${extractedText.length} characters of text`);
      } else {
        console.warn("Document AI did not return text content");
      }
    } catch (error) {
      console.error("Document AI processing failed, falling back to regex only:", error);
    }
    
    // Extract financial data with regex as a backup method
    const regexData = extractFinancialDataWithRegex(extractedText);
    
    // Use GPT-4o to analyze the lease document
    const analysisResults = await analyzeLeaseWithGPT(extractedText, documentStructure, regexData);
    
    // Return the final analysis results
    return new Response(
      JSON.stringify(analysisResults),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Error in document-ai-lease-analyzer function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Processing failed', 
        details: error.message, 
        summary: "We couldn't process your document. Please try again or contact support." 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to extract financial data from text using regex
function extractFinancialDataWithRegex(text: string): {
  potentialRentValues: number[] | null;
  potentialDepositValues: number[] | null;
  potentialTenants: string[] | null;
} {
  // Multiple regex patterns to catch different formats of rent specification
  const rentPatterns = [
    /rent(?:'s)?\s*monthly\s*rent\s*(?:for\s*the\s*(?:apartment|unit|property))?\s*is\s*\$?([\d,]+(?:\.\d{1,2})?)/gi,
    /rent.*?\$\s*([\d,]+(?:\.\d{1,2})?)/gi,
    /rent\s*(?:is|shall\s*be|will\s*be|amount)?\s*(?:is|\:)?\s*\$?([\d,]+(?:\.\d{1,2})?)/gi,
    /(?:tenant|lessee)(?:\s*shall|\s*will|\s*agrees\s*to)?\s*pay\s*\$?([\d,]+(?:\.\d{1,2})?)/gi,
    /\$([\d,]+(?:\.\d{1,2})?)(?:\s*|\s*dollars\s*)(?:per|\/)\s*(?:month|mo)/gi,
    /(?:RENT|PAYMENT|BASE\s+RENT|MONTHLY\s+RENT)(?:\s*:|\.|\\s+is|\s+shall\s+be|\s+will\s+be)\s*\$?([\d,]+(?:\.\d{1,2})?)/gi
  ];

  const depositPatterns = [
    /security\s*deposit(?:\s*is|\s*shall\s*be|\s*will\s*be|\s*in\s*the\s*amount\s*of)?\s*\$?([\d,]+(?:\.\d{1,2})?)/gi,
    /deposit(?:\s*is|\s*shall\s*be|\s*will\s*be|\s*in\s*the\s*amount\s*of)?\s*\$?([\d,]+(?:\.\d{1,2})?)/gi,
    /\$?([\d,]+(?:\.\d{1,2})?)\s*(?:security\s*deposit|deposit)/gi
  ];

  const tenantPatterns = [
    /tenant(?:s)?(?:\s*name|\s*is|\s*are)?(?:\s*:)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
    /lessee(?:s)?(?:\s*name|\s*is|\s*are)?(?:\s*:)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
    /this\s*agreement\s*(?:is\s*)?(?:made\s*and\s*entered\s*into\s*)?(?:by\s*and\s*between\s*)?(?:.*?)\s*and\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi
  ];

  const rentMatches = new Set<number>();
  const depositMatches = new Set<number>();
  const tenantMatches = new Set<string>();

  console.log("Searching for financial data with regex");

  // Search for rent matches
  for (const pattern of rentPatterns) {
    let match;
    // Reset lastIndex for the regex
    pattern.lastIndex = 0;
    
    while ((match = pattern.exec(text)) !== null) {
      // Clean up the match: remove commas and convert to number
      const value = parseFloat(match[1].replace(/,/g, ""));
      if (!isNaN(value) && value > 0 && value < 20000) { // Reasonable rent range
        rentMatches.add(value);
      }
    }
  }

  // Search for deposit matches
  for (const pattern of depositPatterns) {
    let match;
    pattern.lastIndex = 0;
    while ((match = pattern.exec(text)) !== null) {
      const value = parseFloat(match[1].replace(/,/g, ""));
      if (!isNaN(value) && value > 0 && value < 20000) {
        depositMatches.add(value);
      }
    }
  }

  // Search for tenant names
  for (const pattern of tenantPatterns) {
    let match;
    pattern.lastIndex = 0;
    while ((match = pattern.exec(text)) !== null) {
      // Basic name validation
      if (match[1] && match[1].length > 2 && /[A-Za-z]/.test(match[1])) {
        tenantMatches.add(match[1].trim());
      }
    }
  }

  const results = {
    potentialRentValues: rentMatches.size > 0 ? Array.from(rentMatches) : null,
    potentialDepositValues: depositMatches.size > 0 ? Array.from(depositMatches) : null,
    potentialTenants: tenantMatches.size > 0 ? Array.from(tenantMatches) : null,
  };

  console.log("Regex extracted financial data:", results);
  return results;
}

/**
 * Enhanced analysis of the extracted document text using OpenAI's GPT-4o
 */
async function analyzeLeaseWithGPT(documentText: string, documentStructure: any, regexData: any): Promise<any> {
  if (!openai) {
    console.warn("OpenAI API key not configured. Using fallback analysis.");
    return generateFallbackAnalysis(documentText, regexData);
  }

  console.log("Analyzing lease with GPT-4o");
  
  try {
    const systemPrompt = `You are an expert legal assistant specializing in rental lease agreements. 
    Analyze the provided lease document and extract key information in a structured format.
    
    DO NOT FABRICATE ANY INFORMATION. If information is not present in the document, clearly indicate it is missing or unknown.
    
    CRITICAL FINANCIAL INFORMATION EXTRACTION:
    - Pay special attention to RENT AMOUNT - look for monthly rent, base rent, or annual rent divided by 12
    - Common rent formats include:
      * "$5,300 per month"
      * "monthly rent: $5,300" 
      * "Tenant shall pay $5,300"
      * "rent will be $5,300 per month"
      * "RENT: $5,300"
      * "agrees to pay $5,300 monthly"
    
    IMPORTANT GUIDELINES:
    1. Only extract information that is EXPLICITLY stated in the document
    2. Mark any fields where information isn't explicitly provided as "unknown" or "not specified"
    3. Do NOT make assumptions about values not present in the text
    4. For renewal type, ONLY set as "automatic" if explicitly stated - otherwise use "not specified" or extract what's stated
    
    Format your response as JSON with the following structure:
    {
      "summary": "Clear overview of the lease",
      "complexTerms": [
        { "term": "Name of term", "explanation": "Plain language explanation" }
      ],
      "unusualClauses": [
        { "clause": "Description of clause", "concern": "Why it's unusual or concerning", "riskLevel": "high|medium|low" }
      ],
      "questions": [
        "Question 1",
        "Question 2"
      ],
      "extractedData": {
        // Detailed structured data about financial terms, dates, parties, etc.
      },
      "extractionConfidence": {
        "rent": "high|medium|low",
        "securityDeposit": "high|medium|low",
        "lateFee": "high|medium|low",
        "term": "high|medium|low",
        "utilities": "high|medium|low"
      }
    }`;

    // Context data packet that includes regex findings to help guide the AI
    const contextData = {
      documentStructure: documentStructure,
      regexFindings: regexData,
    };

    // Call OpenAI API for analysis
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Use gpt-4o for best results, gpt-4o-mini for cost efficiency
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: documentText },
        { 
          role: "user", 
          content: `Additional context: ${JSON.stringify(contextData)}. 
          If the regex found potential rent values ${JSON.stringify(regexData?.potentialRentValues)}, 
          please consider these in your extraction and explain if you choose a different value.
          DO NOT make up information that isn't in the document. If you don't find something, mark it as "unknown" or "not specified".`
        }
      ],
      temperature: 0.1, // Lower temperature for more deterministic results
      response_format: { type: "json_object" }
    });

    // Parse and validate the analysis
    const analysisContent = JSON.parse(response.choices[0].message.content);
    
    // Add the regex findings to help with verification
    analysisContent.regexFindings = regexData;
    
    // Run validation checks between AI and regex extractions
    if (analysisContent.extractedData?.financial?.rent && regexData?.potentialRentValues) {
      const aiRent = analysisContent.extractedData.financial.rent.amount;
      
      // If regex found values that match the AI extraction, increase confidence
      if (regexData.potentialRentValues.includes(aiRent)) {
        analysisContent.extractionConfidence.rent = "high";
        console.log(`AI rent value (${aiRent}) matches regex findings - setting confidence to high`);
      } 
      // If regex found values that differ from AI extraction, flag for verification
      else if (regexData.potentialRentValues.length > 0) {
        analysisContent.rentVerificationNeeded = true;
        analysisContent.alternativeRentValues = regexData.potentialRentValues;
        analysisContent.regexRentValues = regexData.potentialRentValues;
        console.log(`AI rent value (${aiRent}) doesn't match regex findings - verification needed`);
      }
    }
    
    // If AI didn't find rent but regex did, prompt for verification
    if (!analysisContent.extractedData?.financial?.rent?.amount && regexData?.potentialRentValues?.length > 0) {
      console.log(`AI didn't extract rent but regex found values - setting default and requiring verification`);
      // Set a default rent value from regex for verification
      if (!analysisContent.extractedData) {
        analysisContent.extractedData = {};
      }
      if (!analysisContent.extractedData.financial) {
        analysisContent.extractedData.financial = {};
      }
      analysisContent.extractedData.financial.rent = {
        amount: regexData.potentialRentValues[0],
        frequency: "monthly"
      };
      analysisContent.rentVerificationNeeded = true;
      analysisContent.extractionConfidence = analysisContent.extractionConfidence || {};
      analysisContent.extractionConfidence.rent = "low";
      analysisContent.regexRentValues = regexData.potentialRentValues;
    }
    
    return analysisContent;
  } catch (error) {
    console.error("Error analyzing lease with OpenAI:", error);
    // Fall back to basic analysis if GPT fails
    return generateFallbackAnalysis(documentText, regexData);
  }
}

/**
 * Generate a fallback analysis when AI services fail
 */
function generateFallbackAnalysis(text: string, regexData: any = null): any {
  console.log("Generating fallback analysis using regex data");
  
  const defaultData = {
    summary: "We've extracted basic information from your lease document. Some details may need verification.",
    extractionConfidence: { 
      rent: "low", 
      securityDeposit: "low",
      term: "low",
      parties: "low"
    },
    complexTerms: [],
    unusualClauses: [],
    questions: [
      "What is the exact monthly rent amount?",
      "What is the security deposit amount?",
      "When does the lease begin and end?",
      "Who are all the tenants on the lease?",
      "What utilities are you responsible for?"
    ]
  };
  
  // If we have regex data, use it
  if (regexData) {
    // Create extractedData structure if we found anything with regex
    const extractedData: any = {};
    
    // Add financial data if found
    if (regexData.potentialRentValues || regexData.potentialDepositValues) {
      extractedData.financial = {};
      
      if (regexData.potentialRentValues && regexData.potentialRentValues.length > 0) {
        // Use the most common value or the first one
        extractedData.financial.rent = {
          amount: regexData.potentialRentValues[0],
          frequency: "monthly"
        };
      }
      
      if (regexData.potentialDepositValues && regexData.potentialDepositValues.length > 0) {
        extractedData.financial.securityDeposit = regexData.potentialDepositValues[0];
      }
    }
    
    // Add tenant data if found
    if (regexData.potentialTenants && regexData.potentialTenants.length > 0) {
      extractedData.parties = {
        tenants: regexData.potentialTenants
      };
    }
    
    // Add the extracted data to the default
    if (Object.keys(extractedData).length > 0) {
      defaultData.extractedData = extractedData;
      
      // Set verification flag if we found multiple potential values
      if (regexData.potentialRentValues && regexData.potentialRentValues.length > 1) {
        defaultData.rentVerificationNeeded = true;
        defaultData.regexRentValues = regexData.potentialRentValues;
      }
    }
  }
  
  return defaultData;
}
```

Write out the full new code that the AI meant to put in the file supabase/functions/_router.ts, replacing the comments with the actual code.
I want
