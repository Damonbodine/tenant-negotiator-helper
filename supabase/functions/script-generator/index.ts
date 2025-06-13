
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

    const { goals, propertyDetails, marketInfo, additionalContext, mode, script, formData } = requestData;

    // Handle email template generation mode
    if (mode === 'email_template') {
      console.log('Email template mode detected');
      console.log('Script data received:', script ? 'Present' : 'Missing');
      console.log('Form data received:', formData ? 'Present' : 'Missing');
      
      if (!script) {
        console.error('No script provided for email template generation');
        return new Response(
          JSON.stringify({ error: 'Script is required for email template generation' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate script structure
      if (typeof script !== 'object') {
        console.error('Script is not an object:', typeof script);
        return new Response(
          JSON.stringify({ error: 'Script must be an object' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!script.mainPoints || !Array.isArray(script.mainPoints)) {
        console.error('Script missing mainPoints array:', script);
        return new Response(
          JSON.stringify({ error: 'Script must contain mainPoints array' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Generating email template from script');
      return await generateEmailTemplate(script, formData, openAIApiKey);
    }

    // Original script generation logic
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

// Function to generate email template from script
async function generateEmailTemplate(script: any, formData: any, openAIApiKey: string) {
  console.log('Generating email template with OpenAI');
  console.log('OpenAI API Key available:', !!openAIApiKey);
  console.log('OpenAI API Key length:', openAIApiKey?.length || 0);
  
  // If no OpenAI API key, return a simulated email template
  if (!openAIApiKey) {
    console.warn("No OpenAI API key found. Returning simulated email template.");
    
    return new Response(
      JSON.stringify({
        subject: "Request for Lease Renewal Discussion",
        greeting: "Dear Property Manager,",
        body: `I hope this email finds you well. I am writing to discuss my upcoming lease renewal and explore the possibility of adjusting the rental terms.

I have thoroughly enjoyed living at this property and would like to continue as your tenant. Based on my research of comparable properties in the area, I believe there may be room for discussion regarding the rental rate.

${script.mainPoints.map((point: any, i: number) => `${i + 1}. ${point.point}`).join('\n')}

I am committed to being a responsible tenant and would appreciate the opportunity to discuss these points with you. I believe we can reach an agreement that works well for both parties.`,
        closing: "Thank you for your time and consideration. I look forward to hearing from you soon.",
        signature: "Best regards,\n[Your Name]\n[Your Phone Number]\n[Your Email]",
        fullEmail: `Dear Property Manager,

I hope this email finds you well. I am writing to discuss my upcoming lease renewal and explore the possibility of adjusting the rental terms.

I have thoroughly enjoyed living at this property and would like to continue as your tenant. Based on my research of comparable properties in the area, I believe there may be room for discussion regarding the rental rate.

${script.mainPoints.map((point: any, i: number) => `${i + 1}. ${point.point}`).join('\n')}

I am committed to being a responsible tenant and would appreciate the opportunity to discuss these points with you. I believe we can reach an agreement that works well for both parties.

Thank you for your time and consideration. I look forward to hearing from you soon.

Best regards,
[Your Name]
[Your Phone Number]
[Your Email]`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Prepare the prompt for OpenAI
  const systemPrompt = `You are an expert in professional business communication and rental negotiations. 
  Convert the provided negotiation script into a professional, well-structured email template.
  
  Format your response as a JSON object with the following structure:
  {
    "subject": "Professional subject line for the email",
    "greeting": "Appropriate greeting (e.g., Dear Property Manager,)",
    "body": "Main email content based on the script points",
    "closing": "Professional closing statement",
    "signature": "Email signature placeholder",
    "fullEmail": "Complete formatted email ready to send"
  }
  
  Guidelines:
  - Keep the tone professional but friendly
  - Structure the email logically with clear paragraphs
  - Include the main negotiation points from the script
  - Make it sound like a reasonable request, not a demand
  - Include appropriate business email etiquette
  - Make the subject line clear and professional`;

  try {
    console.log('Making OpenAI API call...');
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
            Please convert this negotiation script into a professional email template:
            
            Goals: ${formData?.goals || 'Not provided'}
            Property Type: ${formData?.propertyType || 'Not provided'}
            Current Rent: ${formData?.currentRent || 'Not provided'}
            Target Rent: ${formData?.targetRent || 'Not provided'}
            
            Script Content:
            Introduction: ${script.introduction}
            
            Main Points:
            ${script.mainPoints.map((point: any, i: number) => `${i + 1}. ${point.point} - ${point.reasoning}`).join('\n')}
            
            Closing: ${script.closing}
            
            Please create a professional email that incorporates these elements naturally.
          `}
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });
    
    console.log('OpenAI API response status:', openAIResponse.status);
    console.log('OpenAI API response headers:', openAIResponse.headers);

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.text();
      console.error("OpenAI API error:", errorData);
      throw new Error('Failed to generate email template');
    }

    const openAIData = await openAIResponse.json();
    console.log('OpenAI response data:', openAIData);
    
    const emailTemplate = JSON.parse(openAIData.choices[0].message.content);
    console.log('Parsed email template:', emailTemplate);
    
    return new Response(
      JSON.stringify(emailTemplate),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Error generating email template:", error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate email template', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
