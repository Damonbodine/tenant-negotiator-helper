/**
 * Enhanced Lease Analyzer – Claude 3 Sonnet with OpenAI GPT-4o fallback
 * Supabase Edge Function (Deno runtime)
 *
 * 2025-05-11
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import * as pdfjs from "npm:pdfjs-dist@4/legacy/build/pdf.js";
import { Anthropic } from "npm:@anthropic-ai/sdk@0.18.0";
import { OpenAI } from "https://esm.sh/openai@4.28.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// API clients with updated API key names
const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
const openaiApiKey = Deno.env.get("OPENAI_RENTERS_MENTOR_KEY");

const anthropic = anthropicApiKey 
  ? new Anthropic({ apiKey: anthropicApiKey })
  : null;

const openai = openaiApiKey 
  ? new OpenAI({ apiKey: openaiApiKey })
  : null;

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

/* ------------------------------------------------------------------ */
/*  2.  Model function-calling schemas                                */
/* ------------------------------------------------------------------ */

const claudeSchema = {
  name: "extractLeaseDetails",
  description: "Extract structured lease details from document text",
  parameters: {
    type: "object",
    properties: {
      summary: { 
        type: "string",
        description: "A concise summary of the main lease terms and important clauses"
      },
      complexTerms: {
        type: "array",
        description: "List of complex or concerning terms that might need further attention",
        items: {
          type: "object",
          properties: {
            term: { type: "string" },
            explanation: { type: "string" }
          }
        }
      },
      unusualClauses: {
        type: "array",
        description: "Any unusual or potentially problematic clauses",
        items: {
          type: "object",
          properties: {
            clause: { type: "string" },
            concern: { type: "string" },
            riskLevel: { type: "string", enum: ["high", "medium", "low"] }
          }
        }
      },
      questions: {
        type: "array",
        description: "Suggested questions the tenant might want to ask about the lease",
        items: { type: "string" }
      },
      extractedData: {
        type: "object",
        properties: {
          financial: {
            type: "object",
            properties: {
              rent: {
                type: "object",
                properties: {
                  amount: { type: "number" },
                  frequency: {
                    type: "string",
                    enum: ["monthly", "weekly", "biweekly", "quarterly", "yearly"]
                  },
                },
              },
              securityDeposit: { type: "number" },
              lateFee: {
                type: "object",
                properties: {
                  amount: { type: "number" },
                  gracePeriod: { type: "number" },
                  type: { type: "string", enum: ["fixed", "percentage"] },
                },
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
                  },
                },
              },
              otherFees: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string" },
                    amount: { type: "number" },
                    frequency: { type: "string" },
                  }
                }
              }
            },
          },
          term: {
            type: "object",
            properties: {
              start: { type: "string", format: "date" },
              end: { type: "string", format: "date" },
              durationMonths: { type: "number" },
              renewalType: { type: "string" },
              renewalNoticeDays: { type: "number" },
              earlyTermination: {
                type: "object",
                properties: {
                  allowed: { type: "boolean" },
                  fee: { type: "string" }
                }
              }
            },
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
          },
          property: {
            type: "object",
            properties: {
              address: { type: "string" },
              type: { type: "string" },
              amenities: { 
                type: "array",
                items: { type: "string" }
              },
              furnishings: { 
                type: "array",
                items: { type: "string" }
              },
            },
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
                  },
                },
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
                  },
                },
              },
              insurance: {
                type: "object",
                properties: {
                  requiredForTenant: { type: "boolean" },
                  minimumCoverage: { type: "string" }
                }
              }
            },
          },
          criticalDates: {
            type: "array",
            items: {
              type: "object", 
              properties: {
                label: { type: "string" },
                date: { type: "string", format: "date" }
              }
            }
          }
        }
      },
      extractionConfidence: {
        type: "object",
        properties: {
          rent: { type: "string", enum: ["high", "medium", "low"] },
          securityDeposit: { type: "string", enum: ["high", "medium", "low"] },
          lateFee: { type: "string", enum: ["high", "medium", "low"] },
          term: { type: "string", enum: ["high", "medium", "low"] },
          utilities: { type: "string", enum: ["high", "medium", "low"] }
        }
      }
    },
    required: ["summary", "extractionConfidence"]
  }
};

// Simplified schema for OpenAI function - must match key parts of Claude schema
const openaiSchema = {
  name: "extractLeaseDetails",
  description: "Extract structured lease details from document text",
  parameters: {
    type: "object",
    properties: {
      summary: { 
        type: "string",
        description: "A concise summary of the main lease terms and important clauses"
      },
      complexTerms: {
        type: "array",
        description: "List of complex or concerning terms that might need further attention",
        items: {
          type: "object",
          properties: {
            term: { type: "string" },
            explanation: { type: "string" }
          },
          required: ["term", "explanation"]
        }
      },
      unusualClauses: {
        type: "array",
        description: "Any unusual or potentially problematic clauses",
        items: {
          type: "object",
          properties: {
            clause: { type: "string" },
            concern: { type: "string" },
            riskLevel: { type: "string", enum: ["high", "medium", "low"] }
          },
          required: ["clause", "concern"]
        }
      },
      questions: {
        type: "array",
        description: "Suggested questions the tenant might want to ask about the lease",
        items: { type: "string" }
      },
      extractedData: {
        type: "object",
        properties: {
          financial: {
            type: "object",
            properties: {
              rent: {
                type: "object",
                properties: {
                  amount: { type: "number" },
                  frequency: { type: "string" },
                },
                required: ["amount", "frequency"]
              },
              securityDeposit: { type: "number" },
            },
          },
          term: {
            type: "object",
            properties: {
              start: { type: "string" },
              end: { type: "string" },
            },
          },
          parties: {
            type: "object",
            properties: {
              landlord: { type: "string" },
              tenants: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
      extractionConfidence: {
        type: "object",
        properties: {
          rent: { type: "string", enum: ["high", "medium", "low"] },
          securityDeposit: { type: "string", enum: ["high", "medium", "low"] },
        }
      }
    },
    required: ["summary", "extractionConfidence"]
  }
};

/* ------------------------------------------------------------------ */
/*  3.  Model-specific analysis functions                             */
/* ------------------------------------------------------------------ */

/**
 * Analyze lease document using Claude
 */
async function analyzeWithClaude(text: string): Promise<any> {
  try {
    console.log("Analyzing lease with Claude");
    
    const claude = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 4096,
      tools: [{ type: "function", function: claudeSchema }],
      tool_choice: { type: "function", function: { name: "extractLeaseDetails" } },
      messages: [
        {
          role: "system",
          content:
            "You are an expert lease-analysis assistant specialized in extracting rental lease details. Extract data according to the JSON schema provided. Be thorough but conservative: if you're unsure about a value, mark it with lower confidence or leave it as null rather than guessing. Focus especially on financial terms, lease duration, and tenant responsibilities."
        },
        { role: "user", content: text.slice(0, 30000) },
      ],
    });

    // Check for a valid Claude response with tool_calls
    const toolCalls = claude.content.filter(item => item.type === 'tool_use');
    if (toolCalls && toolCalls.length > 0 && toolCalls[0].type === 'tool_use') {
      console.log("Claude returned structured lease analysis");
      return JSON.parse(toolCalls[0].input);
    } else {
      console.error("Claude did not return valid tool_calls");
      return null;
    }
  } catch (error) {
    console.error("Error analyzing with Claude:", error);
    return null;
  }
}

/**
 * Analyze lease document using OpenAI as fallback
 */
async function analyzeWithOpenAI(text: string): Promise<any> {
  try {
    console.log("Analyzing lease with OpenAI");
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 4096,
      functions: [openaiSchema],
      function_call: { name: "extractLeaseDetails" },
      messages: [
        {
          role: "system",
          content:
            "You are an expert lease-analysis assistant specialized in extracting rental lease details. Extract data according to the JSON schema provided. Be thorough but conservative: if you're unsure about a value, mark it with lower confidence or leave it as null rather than guessing. Focus especially on financial terms, lease duration, and tenant responsibilities."
        },
        { role: "user", content: text.slice(0, 30000) },
      ],
    });

    // Check for a valid OpenAI response with function_call
    const functionCall = completion.choices[0]?.message?.function_call;
    if (functionCall && functionCall.arguments) {
      console.log("OpenAI returned structured lease analysis");
      return JSON.parse(functionCall.arguments);
    } else {
      console.error("OpenAI did not return valid function_call");
      return null;
    }
  } catch (error) {
    console.error("Error analyzing with OpenAI:", error);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  4.  Edge handler                                                  */
/* ------------------------------------------------------------------ */

serve(async (req) => {
  // CORS pre-flight
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    console.log("Lease analyzer function called");
    const body = await req.json();

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
        JSON.stringify({ error: "No document provided" }),
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

    /* Analysis path 1: Claude API if available */
    let result = null;
    if (anthropic && anthropicApiKey) {
      console.log("Attempting analysis with Claude");
      
      try {
        result = await analyzeWithClaude(documentText);
        
        // Add verification flag if Claude's rent value doesn't match regex findings
        if (result && 
            result.extractedData?.financial?.rent?.amount && 
            regexData?.potentialRentValues && 
            regexData.potentialRentValues.length > 0 &&
            !regexData.potentialRentValues.includes(result.extractedData.financial.rent.amount)) {
          result.rentVerificationNeeded = true;
          result.regexRentValues = regexData.potentialRentValues;
        }
        
        // Add regex findings for verification UI
        result.regexFindings = regexData;
        
      } catch (claudeError) {
        console.error("Claude analysis failed:", claudeError);
      }
    } else {
      console.error("No Claude API key found in environment. Trying OpenAI fallback.");
    }

    /* Analysis path 2: OpenAI fallback if Claude failed or not available */
    if (!result && openai && openaiApiKey) {
      console.log("Attempting fallback analysis with OpenAI");
      
      try {
        result = await analyzeWithOpenAI(documentText);
        
        // Add verification flag and regex findings
        if (result) {
          result.regexFindings = regexData;
          
          if (result?.extractedData?.financial?.rent?.amount && 
              regexData?.potentialRentValues && 
              regexData.potentialRentValues.length > 0 &&
              !regexData.potentialRentValues.includes(result.extractedData.financial.rent.amount)) {
            result.rentVerificationNeeded = true;
            result.regexRentValues = regexData.potentialRentValues;
          }
        }
      } catch (openaiError) {
        console.error("OpenAI analysis failed:", openaiError);
      }
    }

    /* Analysis path 3: Generate default analysis with regex data if all else fails */
    if (!result) {
      console.log("Both AI analyses failed, generating default with regex data");
      result = generateDefault(regexData);
    }

    /* Final response assembly */
    // Always include the regexFindings
    if (!result.regexFindings) {
      result.regexFindings = regexData;
    }
    
    // Ensure we have a well-structured response
    if (!result.extractedData) {
      result.extractedData = {};
    }

    return new Response(JSON.stringify(result), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Fatal error in lease analyzer:", err);
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
