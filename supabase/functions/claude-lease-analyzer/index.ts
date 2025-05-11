
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Claude API key from environment variable
const claudeApiKey = Deno.env.get('CLAUDE_API_KEY');

// Reuse the existing regex patterns for financial data extraction as fallbacks
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
 * Extract potential rent values using regex from document text as a fallback
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
 * Generate default analysis result structure with all required nested objects
 */
function generateDefaultAnalysisResult() {
  return {
    summary: "We couldn't fully analyze this lease document. Please check the extracted information and verify key details manually.",
    complexTerms: [],
    unusualClauses: [],
    questions: [
      "What is the monthly rent amount?",
      "What's the security deposit amount?",
      "Are there any late fees?",
      "What utilities are you responsible for?"
    ],
    extractedData: {
      financial: {
        rent: {
          amount: null,
          frequency: "monthly" 
        },
        securityDeposit: null,
        lateFee: {
          amount: null,
          gracePeriod: null,
          type: "fixed"
        },
        utilities: {
          included: [],
          tenant: []
        },
        otherFees: []
      },
      term: {
        start: null,
        end: null,
        durationMonths: null,
        renewalType: "not specified",
        renewalNoticeDays: null,
        earlyTermination: {
          allowed: false,
          fee: "not specified"
        }
      },
      parties: {
        landlord: null,
        tenants: [],
        jointAndSeveralLiability: null
      },
      property: {
        address: null,
        type: null,
        amenities: [],
        furnishings: []
      },
      responsibilities: {
        maintenance: {
          landlord: [],
          tenant: []
        },
        utilities: {
          landlord: [],
          tenant: []
        },
        insurance: {
          requiredForTenant: null,
          minimumCoverage: null
        }
      },
      criticalDates: []
    },
    extractionConfidence: {
      rent: "low",
      securityDeposit: "low",
      lateFee: "low",
      term: "low",
      utilities: "low"
    },
    extractionStats: {
      fieldsAttempted: 0,
      fieldsExtracted: 0,
      fieldsMissing: 0,
      completionPercentage: 0
    }
  };
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
      console.log("Received request data:", JSON.stringify(requestData, null, 2).substring(0, 500) + "...");
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
    
    // Extract potential financial data with regex as a fallback/validation method
    const regexExtractedData = extractFinancialDataWithRegex(processedText);
    console.log("Regex extracted financial data:", regexExtractedData);

    // If there's no Claude API key, return a simulated response for development
    if (!claudeApiKey) {
      console.warn("No Claude API key found in environment. Returning simulated analysis.");
      const defaultData = generateDefaultAnalysisResult();
      
      // Fill in regex data if available
      if (regexExtractedData.potentialRentValues && regexExtractedData.potentialRentValues.length > 0) {
        defaultData.extractedData.financial.rent.amount = regexExtractedData.potentialRentValues[0];
        defaultData.extractionConfidence.rent = "medium";
        defaultData.extractionStats.fieldsExtracted++;
      }
      
      return new Response(
        JSON.stringify(defaultData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Define the function schema for Claude's function calling
    const toolSchema = {
      name: "extractLeaseDetails",
      description: "Extracts detailed information from a rental lease agreement",
      parameters: {
        type: "object",
        properties: {
          summary: {
            type: "string",
            description: "A clear summary of the lease terms (200-300 words)"
          },
          complexTerms: {
            type: "array",
            items: {
              type: "object",
              properties: {
                term: { type: "string" },
                explanation: { type: "string" }
              },
              required: ["term", "explanation"]
            },
            description: "Complex legal terms that might be difficult for tenants to understand, with plain-language explanations"
          },
          unusualClauses: {
            type: "array",
            items: {
              type: "object",
              properties: {
                clause: { type: "string" },
                concern: { type: "string" },
                riskLevel: { 
                  type: "string", 
                  enum: ["high", "medium", "low"] 
                }
              },
              required: ["clause", "concern"]
            },
            description: "Any unusual or potentially problematic clauses that differ from standard leases"
          },
          questions: {
            type: "array",
            items: { type: "string" },
            description: "Questions the tenant should ask before signing"
          },
          financial: {
            type: "object",
            properties: {
              rent: {
                type: "object",
                properties: {
                  amount: { type: "number" },
                  frequency: { 
                    type: "string",
                    enum: ["monthly", "weekly", "yearly", "quarterly", "biweekly"]
                  }
                },
                required: ["amount", "frequency"]
              },
              securityDeposit: { type: "number" },
              lateFee: {
                type: "object",
                properties: {
                  amount: { type: "number" },
                  gracePeriod: { type: "number" },
                  type: { 
                    type: "string",
                    enum: ["fixed", "percentage"]
                  }
                }
              },
              utilities: {
                type: "object",
                properties: {
                  included: {
                    type: "array",
                    items: { type: "string" }
                  },
                  tenant: {
                    type: "array",
                    items: { type: "string" }
                  }
                }
              },
              otherFees: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string" },
                    amount: { type: "number" },
                    frequency: { 
                      type: "string",
                      enum: ["one-time", "monthly", "yearly"]
                    }
                  },
                  required: ["type", "amount", "frequency"]
                }
              }
            },
            description: "Financial information extracted from the lease"
          },
          term: {
            type: "object",
            properties: {
              start: { type: "string" },
              end: { type: "string" },
              durationMonths: { type: "number" },
              renewalType: { 
                type: "string",
                enum: ["automatic", "manual", "not specified"] 
              },
              renewalNoticeDays: { type: "number" },
              earlyTermination: {
                type: "object",
                properties: {
                  allowed: { type: "boolean" },
                  fee: { type: "string" }
                }
              }
            },
            description: "Term information about the lease duration and renewal terms"
          },
          parties: {
            type: "object",
            properties: {
              landlord: { type: "string" },
              tenants: {
                type: "array",
                items: { type: "string" }
              },
              jointAndSeveralLiability: { type: "boolean" }
            },
            description: "Information about the parties involved in the lease"
          },
          property: {
            type: "object",
            properties: {
              address: { type: "string" },
              type: { 
                type: "string",
                enum: ["apartment", "house", "condo", "townhouse", "room", "other"]
              },
              amenities: {
                type: "array",
                items: { type: "string" }
              },
              furnishings: {
                type: "array",
                items: { type: "string" }
              }
            },
            description: "Information about the rental property"
          },
          responsibilities: {
            type: "object",
            properties: {
              maintenance: {
                type: "object",
                properties: {
                  landlord: {
                    type: "array",
                    items: { type: "string" }
                  },
                  tenant: {
                    type: "array",
                    items: { type: "string" }
                  }
                }
              },
              utilities: {
                type: "object",
                properties: {
                  landlord: {
                    type: "array",
                    items: { type: "string" }
                  },
                  tenant: {
                    type: "array",
                    items: { type: "string" }
                  }
                }
              },
              insurance: {
                type: "object",
                properties: {
                  requiredForTenant: { type: "boolean" },
                  minimumCoverage: { type: "string" }
                }
              }
            },
            description: "Allocation of responsibilities between landlord and tenant"
          },
          criticalDates: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                date: { type: "string" }
              },
              required: ["label", "date"]
            },
            description: "Important dates mentioned in the lease"
          },
          extractionConfidence: {
            type: "object",
            properties: {
              rent: { 
                type: "string",
                enum: ["high", "medium", "low"]
              },
              securityDeposit: { 
                type: "string",
                enum: ["high", "medium", "low"]
              },
              lateFee: { 
                type: "string",
                enum: ["high", "medium", "low"]
              },
              term: { 
                type: "string",
                enum: ["high", "medium", "low"]
              },
              utilities: { 
                type: "string",
                enum: ["high", "medium", "low"]
              }
            },
            description: "Confidence level in the extraction of each field"
          }
        },
        required: ["summary", "financial"]
      }
    };

    // System prompt for Claude
    const systemPrompt = `You are an expert legal assistant specializing in rental lease agreements. 
    Analyze the provided lease document and extract key information in a structured format.
    
    DO NOT FABRICATE ANY INFORMATION. If information is not present in the document, leave the corresponding field null or empty.
    
    Pay special attention to financial information like rent amount, security deposit, and fees. Look for these in sections labeled RENT, PAYMENT, FINANCIAL TERMS, etc.`;

    console.log("Sending document to Claude API for analysis using function calling");
    
    try {
      // Call Claude API with function-calling
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
              content: `Please analyze this lease document: ${processedText.substring(0, 25000)}\n\n${regexExtractedData.potentialRentValues ? 
                `I've also detected potential rent values that may help: ${JSON.stringify(regexExtractedData.potentialRentValues)}` : 
                ''}` 
            }
          ],
          tools: [{ type: "function", function: toolSchema }]
        })
      });

      if (!claudeResponse.ok) {
        const errorData = await claudeResponse.text();
        console.error("Claude API error:", errorData);
        
        // Fall back to default data with regex values if available
        const defaultData = generateDefaultAnalysisResult();
        
        if (regexExtractedData.potentialRentValues && regexExtractedData.potentialRentValues.length > 0) {
          defaultData.extractedData.financial.rent.amount = regexExtractedData.potentialRentValues[0];
          defaultData.extractionConfidence.rent = "medium";
        }
        
        if (regexExtractedData.potentialDepositValues && regexExtractedData.potentialDepositValues.length > 0) {
          defaultData.extractedData.financial.securityDeposit = regexExtractedData.potentialDepositValues[0];
          defaultData.extractionConfidence.securityDeposit = "medium";
        }
        
        defaultData.extractionStats = {
          fieldsAttempted: 20,
          fieldsExtracted: regexExtractedData.potentialRentValues ? 1 : 0,
          fieldsMissing: 20 - (regexExtractedData.potentialRentValues ? 1 : 0),
          completionPercentage: regexExtractedData.potentialRentValues ? 5 : 0
        };
        
        return new Response(
          JSON.stringify({
            ...defaultData,
            error: 'Claude API error, falling back to regex extraction',
            details: errorData.substring(0, 500)
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const claudeData = await claudeResponse.json();
      console.log("Received Claude response, processing function call");
      
      // Process the function call from Claude
      let leaseData;
      let extractionError = null;
      
      try {
        // Check if there's a tool call in the response
        const toolCalls = claudeData.content.filter(item => item.type === 'tool_use');
        
        if (toolCalls && toolCalls.length > 0) {
          // Extract data from the tool call
          const functionCall = toolCalls[0].id;
          const args = JSON.parse(toolCalls[0].input);
          
          console.log("Successfully extracted structured data from Claude function call");
          leaseData = args;
          
          // Calculate extraction stats
          const totalFields = 20; // Rough estimate of key fields
          let fieldsExtracted = 0;
          
          if (leaseData.financial?.rent?.amount) fieldsExtracted++;
          if (leaseData.financial?.securityDeposit) fieldsExtracted++;
          if (leaseData.financial?.lateFee?.amount) fieldsExtracted++;
          if (leaseData.term?.start) fieldsExtracted++;
          if (leaseData.term?.end) fieldsExtracted++;
          if (leaseData.parties?.landlord) fieldsExtracted++;
          if (leaseData.parties?.tenants?.length > 0) fieldsExtracted++;
          if (leaseData.property?.address) fieldsExtracted++;
          // Count other fields...
          
          leaseData.extractionStats = {
            fieldsAttempted: totalFields,
            fieldsExtracted: fieldsExtracted,
            fieldsMissing: totalFields - fieldsExtracted,
            completionPercentage: Math.round((fieldsExtracted / totalFields) * 100)
          };
        } else {
          // If no tool call found, use default structure with text response
          console.log("No tool call found in Claude response, using default structure");
          
          const defaultData = generateDefaultAnalysisResult();
          
          // Get any text content from the response
          const textContents = claudeData.content.filter(item => item.type === 'text');
          if (textContents.length > 0) {
            defaultData.summary = textContents[0].text.substring(0, 500);
          }
          
          leaseData = defaultData;
        }
      } catch (err) {
        console.error("Error extracting tool call data:", err);
        extractionError = err.message;
        
        // Use default structure
        leaseData = generateDefaultAnalysisResult();
        leaseData.error = "Error extracting data from Claude response";
      }
      
      // Merge regex findings for validation and fallbacks
      if (leaseData && regexExtractedData.potentialRentValues && regexExtractedData.potentialRentValues.length > 0) {
        // If Claude didn't find a rent value but regex did, use the regex value
        if (!leaseData.financial?.rent?.amount) {
          console.log("Using regex-extracted rent value as Claude didn't find one");
          if (!leaseData.financial) leaseData.financial = {};
          if (!leaseData.financial.rent) leaseData.financial.rent = { frequency: "monthly" };
          
          leaseData.financial.rent.amount = regexExtractedData.potentialRentValues[0];
          if (!leaseData.extractionConfidence) leaseData.extractionConfidence = {};
          leaseData.extractionConfidence.rent = "medium";
          
          leaseData.rentVerificationNeeded = true;
          leaseData.alternativeRentValues = regexExtractedData.potentialRentValues;
        }
        // Store regex findings in the response for verification
        leaseData.regexFindings = regexExtractedData;
      }
      
      // Validate the structure before sending it back
      if (!leaseData.financial) {
        leaseData.financial = { 
          rent: { amount: null, frequency: "monthly" },
          securityDeposit: null
        };
        
        if (regexExtractedData.potentialRentValues && regexExtractedData.potentialRentValues.length > 0) {
          leaseData.financial.rent.amount = regexExtractedData.potentialRentValues[0];
        }
      }
      
      console.log("Sending formatted response to client");
      
      return new Response(
        JSON.stringify(leaseData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error("Error in Claude API request:", error);
      
      // Return default data structure with error information
      const defaultData = generateDefaultAnalysisResult();
      defaultData.error = `Error processing lease: ${error.message}`;
      
      // Add regex data if available
      if (regexExtractedData.potentialRentValues && regexExtractedData.potentialRentValues.length > 0) {
        defaultData.extractedData.financial.rent.amount = regexExtractedData.potentialRentValues[0];
        defaultData.extractionConfidence.rent = "medium";
      }
      
      return new Response(
        JSON.stringify(defaultData),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
  } catch (error) {
    console.error("Error in lease-analyzer function:", error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
