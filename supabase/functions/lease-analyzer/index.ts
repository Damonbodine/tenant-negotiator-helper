
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// OpenAI API key from environment variable
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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

    const { documentText, documentType } = requestData;

    if (!documentText) {
      return new Response(
        JSON.stringify({ error: 'Document text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing lease document of type: ${documentType}`);
    console.log(`Document length: ${documentText.length} characters`);

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
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare the prompt for OpenAI with enhanced data extraction
    const systemPrompt = `You are an expert legal assistant specializing in rental lease agreements. 
    Analyze the provided lease document and extract key information in a structured format.
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
          "rent": {"amount": 1500, "frequency": "monthly"},
          "securityDeposit": 1500,
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
      }
    }`;

    // Call OpenAI API to analyze the document
    console.log("Sending document to OpenAI for analysis");
    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openAIApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: documentText }
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
    const analysisContent = JSON.parse(openAIData.choices[0].message.content);
    
    // Return the analyzed data
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
