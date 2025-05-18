
/**
 * Lease Document Analyzer – Google Document AI
 * Supabase Edge Function (Deno runtime)
 *
 * 2025-05-18
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import * as pdfjs from "npm:pdfjs-dist@4/legacy/build/pdf.js";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// API key from environment variable
const googleApiKey = Deno.env.get("GOOGLE_DOCUMENTAI_API_KEY");
const openaiApiKey = Deno.env.get("OPENAI_RENTERS_MENTOR_KEY");

/* ------------------------------------------------------------------ */
/*  1.  Helpers & Text Extraction                                     */
/* ------------------------------------------------------------------ */

/**
 * Enhanced PDF text extraction with structural analysis
 */
async function extractPdfText(bytes: Uint8Array): Promise<{
  fullText: string;
  sections: { [key: string]: string };
  hasStructure: boolean;
}> {
  try {
    console.log("Starting PDF text extraction");
    const doc = await pdfjs.getDocument({ data: bytes }).promise;
    
    let fullText = "";
    const pageTexts: string[] = [];
    let currentSection = "";
    const sections: { [key: string]: string } = {};
    
    // Common lease section headings
    const sectionHeadings = [
      "lease agreement", "rental agreement", "term", "rent", "security deposit",
      "utilities", "maintenance", "tenant responsibilities", "landlord responsibilities",
      "termination", "entry", "pets", "alterations", "assignment", "subletting",
      "rules and regulations", "default", "attorney fees", "notices", "lead disclosure"
    ];
    
    console.log(`PDF has ${doc.numPages} pages`);
    
    // First pass: extract all text
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      
      // Extract and clean text
      const pageText = content.items
        .map((it: any) => it.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      
      fullText += pageText + "\n";
      pageTexts.push(pageText);
    }
    
    // Second pass: try to identify sections
    let hasFoundStructure = false;
    
    // Simple section detection
    for (const heading of sectionHeadings) {
      const regex = new RegExp(`(${heading})[:\\s]`, "i");
      const match = fullText.match(regex);
      
      if (match) {
        hasFoundStructure = true;
        const startIndex = match.index || 0;
        
        // Find the next section or end of text
        let endIndex = fullText.length;
        for (const nextHeading of sectionHeadings) {
          const nextRegex = new RegExp(`(${nextHeading})[:\\s]`, "i");
          const nextMatch = fullText.slice(startIndex + heading.length).match(nextRegex);
          
          if (nextMatch && nextMatch.index) {
            const possibleEndIndex = startIndex + heading.length + nextMatch.index;
            if (possibleEndIndex > startIndex && possibleEndIndex < endIndex) {
              endIndex = possibleEndIndex;
            }
          }
        }
        
        // Extract the section content
        const sectionContent = fullText.slice(startIndex, endIndex).trim();
        sections[heading.toLowerCase()] = sectionContent;
      }
    }
    
    console.log(`Extracted ${Object.keys(sections).length} sections from lease`);
    
    return { 
      fullText, 
      sections, 
      hasStructure: hasFoundStructure 
    };
  } catch (error) {
    console.error("Error extracting PDF text:", error);
    return {
      fullText: "",
      sections: {},
      hasStructure: false,
    };
  }
}

/**
 * Extract financial data using regex as fallback
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

  console.log("Searching for financial data in text sample:", text.substring(0, 300));

  // Search for rent matches
  for (const pattern of rentPatterns) {
    let match;
    // Reset lastIndex for the regex
    pattern.lastIndex = 0;
    
    let matches = 0;
    while ((match = pattern.exec(text)) !== null) {
      matches++;
      // Clean up the match: remove commas and convert to number
      const value = parseFloat(match[1].replace(/,/g, ""));
      if (!isNaN(value) && value > 0 && value < 20000) { // Reasonable rent range
        rentMatches.add(value);
      }
    }
    console.log(`Found ${matches} potential matches using pattern: ${pattern}`);
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
 * Generate default analysis result with fallback data
 */
function generateDefault(regexData: any = null): any {
  const defaultData = {
    summary: "We couldn't fully analyze this lease document. Please verify key details manually.",
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
 * Process document using Google Document AI
 */
async function processWithGoogleDocAI(documentBytes: string, documentType: string): Promise<any> {
  if (!googleApiKey) {
    console.warn("Google Document AI API key not found");
    return null;
  }

  try {
    console.log("Sending document to Google Document AI...");
    
    // Determine the appropriate processor based on document type
    const processorId = "form-parser-processor"; // Replace with your actual processor ID
    const projectId = "your-google-project-id"; // Replace with your actual project ID
    const location = "us"; // Replace with your processor's location
    
    // Google Document AI API endpoint
    const endpoint = `https://documentai.googleapis.com/v1/projects/${projectId}/locations/${location}/processors/${processorId}:process`;
    
    // Call the Document AI API
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${googleApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        rawDocument: {
          content: documentBytes,
          mimeType: documentType
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Document AI API error:", errorText);
      return null;
    }
    
    const result = await response.json();
    console.log("Google Document AI processing complete");
    
    // Process the result to extract lease-specific information
    // This would need to be customized based on your specific processor and needs
    // For now, we'll return a simple structure
    return {
      document: result.document,
      text: result.document.text,
      formFields: result.document.pages.flatMap((page: any) => page.formFields || [])
    };
  } catch (error) {
    console.error("Error processing document with Google Document AI:", error);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  2.  Main Handler                                                  */
/* ------------------------------------------------------------------ */

serve(async (req) => {
  // CORS pre-flight
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    console.log("Lease document analyzer function called");
    const startTime = Date.now();
    const body = await req.json();
    const debug = !!body.debug;

    if (debug) {
      console.log("Debug mode enabled");
    }

    let documentText = "";
    let documentBytes = null;
    let extractedText = null;

    /* Process document: extract text or use provided text */
    if (body.documentBytes) {
      console.log(`Processing document bytes of length: ${body.documentBytes.length}`);
      documentBytes = Uint8Array.from(
        atob(body.documentBytes),
        (c) => c.charCodeAt(0),
      );
      
      // Enhanced PDF text extraction
      if (body.documentType === 'application/pdf') {
        extractedText = await extractPdfText(documentBytes);
        documentText = extractedText.fullText;
      } else {
        // For non-PDF files, try basic text conversion
        documentText = new TextDecoder().decode(documentBytes);
      }
    } else if (body.documentText) {
      console.log("Using provided document text");
      documentText = body.documentText;
    } else {
      return new Response(
        JSON.stringify({ 
          error: "No document provided", 
          message: "Either documentBytes or documentText must be provided"
        }),
        { status: 400, headers: cors },
      );
    }

    console.log(`Document length: ${documentText.length} characters`);
    
    // If the document text is too short, return an error
    if (documentText.length < 100) {
      console.error("Document text is too short");
      return new Response(
        JSON.stringify({ 
          error: "The document text is too short for meaningful analysis",
          summary: "The uploaded document doesn't contain enough text to analyze. Please upload a complete lease document."
        }),
        { status: 400, headers: cors },
      );
    }

    // Run regex extraction on the text as early fallback/verification mechanism
    const regexData = extractFinancialDataWithRegex(documentText);

    // Try Google Document AI if available
    let result = null;
    
    if (googleApiKey && body.documentBytes) {
      console.log("Attempting analysis with Google Document AI");
      try {
        const googleResult = await processWithGoogleDocAI(
          body.documentBytes,
          body.documentType || "application/pdf"
        );
        
        if (googleResult) {
          // Transform Google Document AI results to our expected format
          // This would need to be customized based on your specific processor output
          result = {
            summary: "Lease analysis completed with Google Document AI",
            extractedData: {
              financial: {
                rent: {
                  amount: 0,  // This would come from processed form fields
                  frequency: "monthly"
                },
                securityDeposit: 0  // This would come from processed form fields
              },
              term: {
                start: null,
                end: null,
                durationMonths: 12  // Default
              }
            },
            flags: []  // Would be populated based on analysis
          };
          
          // Here you would parse the form fields to find relevant lease information
          
          // Add regex findings for verification UI
          result.regexFindings = regexData;
        }
      } catch (apiError) {
        console.error("Google Document AI analysis failed:", apiError);
      }
    } else {
      console.log("Google Document AI API key not available, using fallback methods");
    }

    // Fall back to regex extraction if no AI analysis was successful
    if (!result) {
      console.log("Falling back to regex-based analysis");
      result = generateDefault(regexData);
      
      // Add API status to the result for debugging
      result.apiStatus = {
        googleDocumentAI: googleApiKey ? "failed" : "not configured",
        openAI: openaiApiKey ? "not attempted" : "not configured",
        processingTime: Date.now() - startTime
      };
    }

    // Return the result
    return new Response(JSON.stringify(result), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Fatal error in lease document analyzer:", err);
    return new Response(
      JSON.stringify({ 
        error: "Server error",
        details: err.message,
        summary: "We encountered an error analyzing your document. Please try again."
      }),
      { status: 500, headers: cors },
    );
  }
});
