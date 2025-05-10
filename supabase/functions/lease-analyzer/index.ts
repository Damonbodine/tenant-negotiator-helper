
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { extract as extractPdfText } from "https://deno.land/x/pdfjs@v0.1.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// OpenAI API key from environment variable
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// Enhanced regular expressions for critical financial data extraction
// Updated to catch more variations of rent statements including "shall pay" forms
const rentRegex = /(?:(?:monthly |annual )?(?:base )?rent:?\s*\$?([\d,]+(?:\.\d{2})?))|(?:\$([\d,]+(?:\.\d{2})?)\s*(?:per|\/)\s*(?:month|mo))|(?:(?:tenant |lessee )?(?:shall |will |agrees to )?pay\s*\$?([\d,]+(?:\.\d{2})?)\s*(?:per|\/|as|in|for)?\s*(?:month|mo|rent|monthly))|(?:rent(?:\s*is|\s*shall\s*be|\s*will\s*be)?\s*\$?([\d,]+(?:\.\d{2})?))/gi;

const securityDepositRegex = /(?:security deposit:?\s*\$?([\d,]+(?:\.\d{2})?))|(?:deposit(?:\s*of|\s*in\s*the\s*amount\s*of|\s*amount)?\s*\$?([\d,]+(?:\.\d{2})?))|(?:deposit:?\s*\$?([\d,]+(?:\.\d{2})?))/gi;

/**
 * Extract potential rent values using regex from document text
 */
function extractFinancialDataWithRegex(text: string) {
  // Log the text being searched for diagnostic purposes
  console.log(`Searching for financial data in text sample: ${text.slice(0, 200)}...`);
  
  const rentMatches = [...text.matchAll(rentRegex)];
  const depositMatches = [...text.matchAll(securityDepositRegex)];
  
  console.log(`Found ${rentMatches.length} potential rent matches`);
  
  // Process rent matches - now handling more capture groups
  const potentialRentValues = rentMatches.map(match => {
    // Check all capture groups (we have more now)
    const value = match[1] || match[2] || match[3] || match[4];
    if (!value) return null;
    return parseFloat(value.replace(/,/g, ''));
  }).filter(Boolean);
  
  // Process deposit matches - now handling more capture groups
  const potentialDepositValues = depositMatches.map(match => {
    const value = match[1] || match[2] || match[3];
    if (!value) return null;
    return parseFloat(value.replace(/,/g, ''));
  }).filter(Boolean);
  
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
  
  // Add extra spacing after dollar signs to help regex
  text = text.replace(/\$/g, '$ ');
  text = text.replace(/\$ /g, '$');
  
  return text;
}

/**
 * Find sections that are likely to contain rent information
 */
function extractRentSections(text: string): string[] {
  const rentSectionRegex = /(?:RENT|PAYMENT|FINANCIAL TERMS|MONTHLY PAYMENT)(?:.+?)(?:\n\n|\r\n\r\n|SECTION|PARAGRAPH)/gis;
  const matches = [...text.matchAll(rentSectionRegex)].map(match => match[0]);
  
  if (matches.length > 0) {
    console.log(`Found ${matches.length} sections that might contain rent information`);
    return matches;
  }
  
  // If no specific sections found, return empty array
  return [];
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
    
    // Extract potential financial data with regex as a backup/validation method
    const regexExtractedData = extractFinancialDataWithRegex(processedText);
    console.log("Regex extracted financial data:", regexExtractedData);

    // Look for sections that likely contain rent information
    const rentSections = extractRentSections(processedText);
    
    // If there's no OpenAI API key, return a simulated response for development
    if (!openAIApiKey) {
      console.warn("No OpenAI API key found in environment. Returning simulated analysis.");
      
      return new Response(
        JSON.stringify({
          summary: "This is a simulated lease analysis. To get actual AI analysis, add an OpenAI API key to your Supabase edge function secrets.",
          complexTerms: [
            { 
              term: "Indemnification Clause (Section 14)", 
              explanation: "This clause requires you to protect the landlord from legal responsibility for damages or injuries."
            },
            { 
              term: "Joint and Several Liability (Section 8)", 
              explanation: "If you have roommates, each person is responsible for the full rent."
            }
          ],
          unusualClauses: [
            {
              clause: "Excessive Late Fee",
              concern: "The late fee exceeds what's typical in most jurisdictions."
            }
          ],
          questions: [
            "Can the automatic renewal clause be modified?",
            "Is the late fee negotiable?",
            "What maintenance tasks am I responsible for?"
          ],
          extractedData: {
            financial: {
              rent: {amount: 1500, frequency: "monthly"},
              securityDeposit: 1500,
              lateFee: {amount: 50, gracePeriod: 5, type: "fixed"},
              utilities: {
                included: ["water", "trash"],
                tenant: ["electricity", "gas", "internet"]
              },
              otherFees: [{type: "pet", amount: 25, frequency: "monthly"}]
            },
            term: {
              start: "2023-06-01",
              end: "2024-05-31",
              durationMonths: 12,
              renewalType: "automatic",
              renewalNoticeDays: 60,
              earlyTermination: {allowed: true, fee: "2 months rent"}
            },
            parties: {
              landlord: "Acme Property Management",
              tenants: ["John Doe", "Jane Smith"],
              jointAndSeveralLiability: true
            },
            property: {
              address: "123 Main St, Apt 4B, Anytown, CA 12345",
              type: "apartment",
              amenities: ["parking space", "pool access"],
              furnishings: ["refrigerator", "stove"]
            },
            responsibilities: {
              maintenance: {
                landlord: ["structural repairs", "major appliances"],
                tenant: ["minor repairs under $100", "lawn care"]
              },
              utilities: {
                landlord: ["water", "trash"],
                tenant: ["electricity", "gas", "internet"]
              },
              insurance: {
                requiredForTenant: true,
                minimumCoverage: "$100,000"
              }
            },
            criticalDates: [
              {label: "Rent due", date: "1st of each month"},
              {label: "Lease renewal deadline", date: "60 days before lease end"},
              {label: "Move-out inspection", date: "Last week of lease"}
            ]
          },
          extractionConfidence: {
            rent: "medium",
            securityDeposit: "medium",
            lateFee: "low",
            term: "medium",
            utilities: "medium"
          },
          regexFindings: regexExtractedData
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare the improved prompt for OpenAI with enhanced data extraction
    const systemPrompt = `You are an expert legal assistant specializing in rental lease agreements. 
    Analyze the provided lease document and extract key information in a structured format.
    
    CRITICAL FINANCIAL INFORMATION EXTRACTION:
    - Pay special attention to RENT AMOUNT - look for monthly rent, base rent, or annual rent divided by 12
    - Common rent formats include:
      * "$1,800 per month"
      * "monthly rent: $1,800" 
      * "Tenant shall pay $1,800"
      * "rent will be $1,800 per month"
      * "RENT: $1,800"
      * "agrees to pay $1,800 monthly"
    - Look specifically in sections labeled "RENT", "PAYMENT", or "FINANCIAL TERMS" 
    - If multiple rent values appear, look for context to determine the primary current rent amount
    - If you find multiple possible rent values, list them all in your confidence assessment
    - Report a confidence level (high, medium, low) for each extracted value
    
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
    
    Also provide a risk assessment for key clauses (high, medium, low) with explanation.
    
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
        "financial": {
          "rent": {"amount": 1800, "frequency": "monthly"},
          "securityDeposit": 1800,
          "lateFee": {"amount": 50, "gracePeriod": 5, "type": "fixed|percentage"},
          "utilities": {
            "included": ["water", "trash"],
            "tenant": ["electricity", "gas", "internet"]
          },
          "otherFees": [{"type": "pet", "amount": 25, "frequency": "monthly"}]
        },
        "term": {
          "start": "YYYY-MM-DD",
          "end": "YYYY-MM-DD",
          "durationMonths": 12,
          "renewalType": "automatic|manual",
          "renewalNoticeDays": 60,
          "earlyTermination": {"allowed": true, "fee": "description"}
        },
        "parties": {
          "landlord": "Name/Company",
          "tenants": ["Name 1", "Name 2"],
          "jointAndSeveralLiability": true
        },
        "property": {
          "address": "Full address",
          "type": "apartment|house|condo",
          "amenities": ["list", "of", "amenities"],
          "furnishings": ["list", "of", "furnishings"]
        },
        "responsibilities": {
          "maintenance": {
            "landlord": ["list", "of", "responsibilities"],
            "tenant": ["list", "of", "responsibilities"]
          },
          "utilities": {
            "landlord": ["list", "of", "utilities"],
            "tenant": ["list", "of", "utilities"]
          },
          "insurance": {
            "requiredForTenant": true,
            "minimumCoverage": "amount"
          }
        },
        "criticalDates": [
          {"label": "Rent due", "date": "1st of each month"},
          {"label": "Lease renewal deadline", "date": "60 days before lease end"},
          {"label": "Move-out inspection", "date": "within X days of moveout"}
        ]
      },
      "extractionConfidence": {
        "rent": "high|medium|low",
        "securityDeposit": "high|medium|low",
        "lateFee": "high|medium|low",
        "term": "high|medium|low",
        "utilities": "high|medium|low"
      },
      "additionalRentValues": [1500, 1800, 2000] // Include if multiple values found
    }`;

    // Prepare a data packet for OpenAI that includes our regex findings to help guide the AI
    let contextData = {
      documentType,
      fileName,
      regexFindings: regexExtractedData,
      rentSectionsFound: rentSections
    };

    // Call OpenAI API to analyze the document using the improved model
    console.log("Sending document to OpenAI for analysis");
    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openAIApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o", // Continuing with this model but with improved prompting
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: processedText },
          { 
            role: "user", 
            content: `Additional context: ${JSON.stringify(contextData)}. 
            If the regex found potential rent values ${JSON.stringify(regexExtractedData.potentialRentValues)}, 
            please consider these in your extraction and explain if you choose a different value.`
          }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      })
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.text();
      console.error("OpenAI API error:", errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to analyze document', details: errorData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openAIData = await openAIResponse.json();
    console.log("Received OpenAI response");
    
    // Parse the content from the AI response
    let analysisContent = JSON.parse(openAIData.choices[0].message.content);
    
    // Add the regex findings to help with verification
    analysisContent.regexFindings = regexExtractedData;
    
    // Run improved validation checks between AI and regex extractions
    if (analysisContent.extractedData?.financial?.rent && regexExtractedData.potentialRentValues) {
      const aiRent = analysisContent.extractedData.financial.rent.amount;
      
      // If regex found values that match the AI extraction, increase confidence
      if (regexExtractedData.potentialRentValues.includes(aiRent)) {
        analysisContent.extractionConfidence.rent = "high";
      } 
      // If regex found values that differ from AI extraction, flag for verification
      else if (regexExtractedData.potentialRentValues.length > 0) {
        // Find the closest value from regex matches
        const closestRentValue = regexExtractedData.potentialRentValues.reduce((prev, curr) => 
          Math.abs(curr - aiRent) < Math.abs(prev - aiRent) ? curr : prev
        );
        
        // Lower threshold to trigger verification (was 50, now 10)
        if (Math.abs(closestRentValue - aiRent) > 10) {
          analysisContent.rentVerificationNeeded = true;
          analysisContent.alternativeRentValues = regexExtractedData.potentialRentValues;
        }
      }
    }
    
    // Always include regex values in the response for validation
    if (regexExtractedData.potentialRentValues && regexExtractedData.potentialRentValues.length > 0) {
      analysisContent.regexRentValues = regexExtractedData.potentialRentValues;
    }
    
    // Return the analyzed data with validation information
    return new Response(
      JSON.stringify(analysisContent),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Error in lease-analyzer function:", error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
