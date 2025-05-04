
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    const { goals, propertyDetails, marketInfo, additionalContext } = requestData;

    if (!goals) {
      return new Response(
        JSON.stringify({ error: 'Negotiation goals are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating negotiation script for goals: ${goals}`);
    console.log(`Property details: ${JSON.stringify(propertyDetails)}`);
    
    // If there's no OpenAI API key, return a simulated response for development
    if (!openAIApiKey) {
      console.warn("No OpenAI API key found in environment. Returning simulated script.");
      
      return new Response(
        JSON.stringify({
          introduction: "Hello, I wanted to discuss the possibility of adjusting my rent for the upcoming renewal. I've really enjoyed living here for the past year and would like to continue.",
          mainPoints: [
            { 
              point: "I've done some research on comparable units in this area.", 
              reasoning: "Similar units in this neighborhood are currently renting for about $1,400, which is $100 less than my current rate."
            },
            { 
              point: "I've been a responsible tenant with an excellent payment history.", 
              reasoning: "I've never missed a payment and always report maintenance issues promptly, which helps protect your investment."
            },
            { 
              point: "I'm willing to sign a longer lease term.", 
              reasoning: "This gives you stability and reduces turnover costs, which can be substantial with finding new tenants."
            }
          ],
          objectionResponses: [
            {
              objection: "Our operating costs have increased.",
              response: "I understand costs rise, but maintaining good tenants also has value. Perhaps we could meet in the middle with a smaller increase than initially proposed?"
            },
            {
              objection: "The market in this area is very competitive.",
              response: "I've actually collected several listings of comparable units in this building and neighborhood that are priced lower. Would you like to see the specific examples I've found?"
            }
          ],
          closing: "I really value living here and hope we can find a solution that works for both of us. A slight adjustment to the rent would allow me to stay longer term, which provides stability for both of us. Could we agree to $1,450 per month for the next year?",
          feedback: {
            persuasiveness: 8,
            tone: "Professional and reasonable",
            suggestions: [
              "Consider adding specific examples of comparable properties with prices",
              "You could emphasize how you've taken care of the property",
              "Add a specific proposed rent amount in your introduction to anchor the negotiation"
            ]
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare the prompt for OpenAI
    const systemPrompt = `You are an expert negotiation coach specializing in rental agreements. 
    Create a structured negotiation script based on the tenant's goals and property details.
    
    Format your response as a JSON object with the following structure:
    {
      "introduction": "Opening statement that establishes rapport and briefly states purpose",
      "mainPoints": [
        { "point": "Main negotiation point", "reasoning": "Supporting data or reasoning" }
      ],
      "objectionResponses": [
        { "objection": "Potential landlord objection", "response": "Effective counter-response" }
      ],
      "closing": "Concluding statement that summarizes position and suggests next steps",
      "feedback": {
        "persuasiveness": 7, // Score out of 10
        "tone": "Professional and assertive", // Brief tone analysis
        "suggestions": ["Improvement suggestion 1", "Improvement suggestion 2"]
      }
    }
    
    Include 3 main negotiation points with supporting reasoning, and prepare 2-3 responses to common landlord objections.
    Make the script persuasive but professional, focusing on mutual benefit when possible.
    Base your suggestions on rental market norms and negotiation best practices.`;

    // Call OpenAI API to generate the script
    console.log("Sending request to OpenAI for script generation");
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
          { role: "user", content: `
            Tenant's Goals: ${goals}
            
            Property Details: ${JSON.stringify(propertyDetails)}
            
            Market Information: ${marketInfo || "No additional market information provided."}
            
            Additional Context: ${additionalContext || "No additional context provided."}
            
            Please create a personalized negotiation script based on these details.
          `}
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.text();
      console.error("OpenAI API error:", errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to generate script', details: errorData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openAIData = await openAIResponse.json();
    console.log("Received OpenAI response");
    
    // Parse the content from the AI response
    const scriptContent = JSON.parse(openAIData.choices[0].message.content);
    
    // Return the script data
    return new Response(
      JSON.stringify(scriptContent),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Error in script-generator function:", error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
