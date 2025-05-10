
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Claude API key from environment variable 
// We'll use the stored key from Supabase secrets
const claudeApiKey = Deno.env.get('CLAUDE_API_KEY') || "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";

// Reuse the existing regex patterns for financial data extraction
const rentPatterns = [
  /(?:RENT|PAYMENT|BASE\s+RENT|MONTHLY\s+RENT)(?:\s*:|\.|\s+is|\s+shall\s+be|\s+will\s+be)\s*\$?([\d,]+(?:\.\d{1,2})?)/ig,
  /\$([\d,]+(?:\.\d{1,2})?)\s*(?:per|\/)\s*(?:month|mo)/ig,
  /(?:tenant|lessee)(?:\s*shall|\s*will|\s*agrees\s*to)?\s*pay\s*\$?([\d,]+(?:\.\d{1,2})?)/ig,
  /rent\s*(?:is|shall\s*be|will\s*be|amount)?\s*(?:is|\:)?\s*\$?([\d,]+(?:\.\d{1,2})?)/ig,
  /rent.*?\$\s*([\d,]+(?:\.\d{1,2})?)/ig,
  /tenant(?:'s)?\s*monthly\s*rent\s*(?:for\s*the\s*(?:apartment|unit|property))?\s*is\s*\$?([\d,]+(?:\.\d{1,2})?)/ig
];

const securityDepositPatterns = [
  /(?:security\s*deposit)(?:\s*:|\.|\s+is|\s+shall\s+be|\s+will\s+be|\s*of|\s*amount|\s*in\s*the\s*amount\s*of)?\s*\$?([\d,]+(?:\.\d{1,2})?)/ig,
  /(?:deposit|security\s*deposit)\s*(?:of|is|in\s*the\s*amount\s*of|amount|:)?\s*\$?([\d,]+(?:\.\d{1,2})?)/ig
];

/**
 * Extract potential rent values using regex from document text
 */
function extractFinancialDataWithRegex(text: string) {
  // Log the text being searched for diagnostic purposes
  console.log(`Searching for financial data in text sample: ${text.slice(0, 200)}...`);
  
  let potentialRentValues: number[] = [];
  let potentialDepositValues: number[] = [];
  
  // Search using all rent patterns
  rentPatterns.forEach(pattern => {
    const matches = [...text.matchAll(pattern)];
    console.log(`Found ${matches.length} potential matches using pattern: ${pattern}`);
    
    matches.forEach(match => {
      // Take the first capturing group that has a value
      const capturedGroups = match.slice(1).filter(Boolean);
      if (capturedGroups.length > 0) {
        const valueStr = capturedGroups[0].replace(/,/g, '');
        const value = parseFloat(valueStr);
        
        if (!isNaN(value) && value > 100) { // Filter out very low values that are likely not rent
          potentialRentValues.push(value);
        }
      }
    });
  });
  
  // Search using all security deposit patterns
  securityDepositPatterns.forEach(pattern => {
    const matches = [...text.matchAll(pattern)];
    
    matches.forEach(match => {
      // Take the first capturing group that has a value
      const capturedGroups = match.slice(1).filter(Boolean);
      if (capturedGroups.length > 0) {
        const valueStr = capturedGroups[0].replace(/,/g, '');
        const value = parseFloat(valueStr);
        
        if (!isNaN(value) && value > 100) {
          potentialDepositValues.push(value);
        }
      }
    });
  });
  
  // Log the found values
  if (potentialRentValues.length > 0) {
    console.log("Potential rent values found by regex:", potentialRentValues);
  }
  
  if (potentialDepositValues.length > 0) {
    console.log("Potential deposit values found by regex:", potentialDepositValues);
  }
  
  return {
    potentialRentValues: potentialRentValues.length > 0 ? potentialRentValues : null,
    potentialDepositValues: potentialDepositValues.length > 0 ? potentialDepositValues : null
  };
}

/**
 * Process extracted text to normalize and clean it
 */
function preprocessDocumentText(text: string): string {
  // Normalize whitespace
  text = text.replace(/\s+/g, ' ');
  
  // Fix common OCR/extraction issues
  text = text.replace(/\$\s+/g, '$');
  text = text.replace(/(\d),(\d)/g, '$1$2'); // Sometimes commas in numbers get separated
  
  // Add periods after section numbers to help with section identification
  text = text.replace(/(\d+)[\s\r\n]+([A-Z]{2,})/g, '$1. $2');
  
  // Normalize section headers
  text = text.replace(/(\d+\s*\.?\s*)(RENT|PAYMENT)(\s|\.|\:)/gi, '$1RENT: ');
  text = text.replace(/(\d+\s*\.?\s*)(SECURITY\s*DEPOSIT)(\s|\.|\:)/gi, '$1SECURITY DEPOSIT: ');
  
  return text;
}

/**
 * Find sections that are likely to contain rent information
 */
function extractRentSections(text: string): string[] {
  // Look for sections with headers like "3. RENT" or "RENT:" 
  const rentSectionPatterns = [
    /(?:\d+\s*\.?\s*)?(?:RENT|PAYMENT|FINANCIAL TERMS|MONTHLY PAYMENT)(?:.+?)(?:\n\n|\r\n\r\n|SECTION|PARAGRAPH|^\s*\d+\s*\.)/gis,
    /(?:RENT|PAYMENT)(?:\s*:|\.|\s+is|\s+shall\s+be|\s+will\s+be)(?:.+?)(?:\n\n|\r\n\r\n|SECTION|PARAGRAPH)/gis,
  ];
  
  let sections: string[] = [];
  
  rentSectionPatterns.forEach(pattern => {
    const matches = [...text.matchAll(pattern)].map(match => match[0]);
    sections = [...sections, ...matches];
  });
  
  if (sections.length > 0) {
    console.log(`Found ${sections.length} sections that might contain rent information`);
    return sections;
  }
  
  // If no specific sections found, search for sentences containing rent references
  const rentReferences = text.match(/[^.!?]+(?:rent|payment|pay|monthly)[^.!?]+\$/gi);
  if (rentReferences && rentReferences.length > 0) {
    console.log(`Found ${rentReferences.length} sentences with rent references`);
    return rentReferences;
  }
  
  // If no specific sections found, return empty array
  return [];
}

/**
 * Identify common lease templates based on text patterns
 */
function identifyLeaseTemplate(text: string): string | null {
  // Look for common lease template identifiers
  if (text.match(/STANDARD RESIDENTIAL LEASE AGREEMENT/i)) {
    return "standard";
  } else if (text.match(/APARTMENT LEASE CONTRACT/i)) {
    return "apartment_association";
  } else if (text.match(/RENTAL AGREEMENT AND DEPOSIT RECEIPT/i)) {
    return "california_association";
  }
  return null;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    let requestData;
    try {
      requestData = await req.json();
      console.log("Received request data:", JSON.stringify(requestData, null, 2));
    } catch (e) {
      console.error("Error parsing request JSON:", e);
      return new Response(
        JSON.stringify({ error: 'Invalid request format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { documentText, documentType, fileName } = requestData;

    if (!documentText) {
      return new Response(
        JSON.stringify({ error: 'Document text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing lease document of type: ${documentType}`);
    console.log(`Document length: ${documentText.length} characters`);

    // Preprocess the document text to improve extraction quality
    const processedText = preprocessDocumentText(documentText);
    
    // Identify lease template for specialized handling
    const leaseTemplate = identifyLeaseTemplate(processedText);
    if (leaseTemplate) {
      console.log(`Identified lease template: ${leaseTemplate}`);
    }
    
    // Extract potential financial data with regex as a backup/validation method
    const regexExtractedData = extractFinancialDataWithRegex(processedText);
    console.log("Regex extracted financial data:", regexExtractedData);

    // Look for sections that likely contain rent information
    const rentSections = extractRentSections(processedText);

    // Prepare the context data for Claude with our regex findings
    let contextData = {
      documentType,
      fileName,
      regexFindings: regexExtractedData,
      rentSectionsFound: rentSections,
      leaseTemplate: leaseTemplate
    };

    // The system prompt for Claude to analyze the document
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
      * "Monthly Rent Amount: $5,300.00"
      * "Monthly Rent $5,300.00"
      * "Rent Amount. $5,300 per month"
      * "Base Rent. The Tenant will pay $5,300 each month."
      * "3. RENT: $5,300"
      * "RENT/LEASE PAYMENT. Tenant shall pay rent in the amount of $5,300"
    - Look specifically in sections labeled "RENT", "PAYMENT", "FINANCIAL TERMS" or "LEASE TERMS" 
    - If multiple rent values appear, look for context to determine the primary current rent amount
    - If you find multiple possible rent values, list them all in your confidence assessment
    - Report a confidence level (high, medium, low) for each extracted value
    - DO NOT make up or estimate any financial values if they're not clearly stated in the document
    
    IMPORTANT GUIDELINES:
    1. Only extract information that is EXPLICITLY stated in the document
    2. Mark any fields where information isn't explicitly provided as "unknown" or "not specified"
    3. Do NOT make assumptions about values not present in the text
    4. For renewal type, ONLY set as "automatic" if explicitly stated - otherwise use "not specified" or extract what's stated
    5. Only include amenities explicitly mentioned in the lease - do not assume amenities like "gym" unless specified
    6. For tenant/landlord names, extract exactly as written in the document - don't make up names
    7. Only include insurance requirements if explicitly mentioned
    
    Focus on identifying:
    
    1. A clear summary of the lease terms (200-300 words)
    
    2. Complex legal terms that might be difficult for tenants to understand, with plain-language explanations
    
    3. Any unusual or potentially problematic clauses that differ from standard leases
    
    4. Questions the tenant should ask before signing
    
    5. Extract structured data from the lease with the following schema:
      - Financial information (rent amount and frequency, security deposit, late fees, utilities included/excluded, other fees)
      - Term information (start/end dates, duration, renewal terms, early termination)
      - Party information (landlord/property manager details, tenants, joint liability)
      - Property details (address, unit type, amenities, furnishings included)
      - Responsibility allocation (maintenance, utilities, insurance requirements)
      - Critical dates (rent due dates, renewal deadlines, move-out notice)
    
    Also provide a risk assessment for key clauses (high, medium, low) with explanation.`;

    console.log("Sending document to Claude for analysis");
    
    // Call Claude API to analyze the document
    // Updated model name to 'claude-3-opus-20240229'
    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": claudeApiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [
          { 
            role: "user", 
            content: [
              { 
                type: "text", 
                text: `Please analyze this lease document: ${processedText}\n\nAdditional context: ${JSON.stringify(contextData)}. 
                If the regex found potential rent values ${JSON.stringify(regexExtractedData.potentialRentValues)}, 
                please consider these in your extraction and explain if you choose a different value.
                DO NOT make up information that isn't in the document. If you don't find something, mark it as "unknown" or "not specified".`
              }
            ]
          }
        ]
      })
    });

    if (!claudeResponse.ok) {
      const errorData = await claudeResponse.text();
      console.error("Claude API error:", errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to analyze document with Claude', details: errorData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const claudeData = await claudeResponse.json();
    console.log("Received Claude response");
    
    // Parse the content from Claude's response
    let analysisContent;
    try {
      analysisContent = JSON.parse(claudeData.content[0].text);
    } catch (error) {
      console.error("Error parsing Claude response:", error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse Claude response', 
          details: claudeData.content[0].text.slice(0, 500) + "...",
          rawResponse: claudeData.content[0].text
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Add the regex findings to help with verification
    analysisContent.regexFindings = regexExtractedData;
    
    // Run improved validation checks between AI and regex extractions
    if (analysisContent.extractedData?.financial?.rent && regexExtractedData.potentialRentValues) {
      const aiRent = analysisContent.extractedData.financial.rent.amount;
      
      // If regex found values that match the AI extraction, increase confidence
      if (regexExtractedData.potentialRentValues.includes(aiRent)) {
        analysisContent.extractionConfidence.rent = "high";
        console.log(`AI rent value (${aiRent}) matches regex findings - setting confidence to high`);
      } 
      // If regex found values that differ from AI extraction, flag for verification
      else if (regexExtractedData.potentialRentValues.length > 0) {
        analysisContent.rentVerificationNeeded = true;
        analysisContent.alternativeRentValues = regexExtractedData.potentialRentValues;
        console.log(`AI rent value (${aiRent}) doesn't match regex findings - verification needed`);
      }
    }
    
    // Always include regex values in the response for validation
    if (regexExtractedData.potentialRentValues && regexExtractedData.potentialRentValues.length > 0) {
      analysisContent.regexRentValues = regexExtractedData.potentialRentValues;
      
      // If AI didn't find a rent value but regex did, prompt for verification
      if (!analysisContent.extractedData?.financial?.rent?.amount && regexExtractedData.potentialRentValues.length > 0) {
        console.log(`AI didn't extract rent but regex found values - setting default and requiring verification`);
        // Set a default rent value from regex for verification
        if (!analysisContent.extractedData) {
          analysisContent.extractedData = {};
        }
        if (!analysisContent.extractedData.financial) {
          analysisContent.extractedData.financial = {};
        }
        analysisContent.extractedData.financial.rent = {
          amount: regexExtractedData.potentialRentValues[0],
          frequency: "monthly"
        };
        analysisContent.rentVerificationNeeded = true;
        analysisContent.extractionConfidence = analysisContent.extractionConfidence || {};
        analysisContent.extractionConfidence.rent = "low";
      }
    }
    
    // Return the analyzed data with validation information
    return new Response(
      JSON.stringify(analysisContent),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Error in claude-lease-analyzer function:", error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
