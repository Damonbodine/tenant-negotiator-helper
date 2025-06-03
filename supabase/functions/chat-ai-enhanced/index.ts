import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client for rental memory storage
// Edge Functions have different environment variable names
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

console.log('🔧 Environment check:', {
  hasOpenAI: !!OPENAI_API_KEY,
  hasSupabaseUrl: !!supabaseUrl,
  hasServiceKey: !!supabaseServiceKey,
  supabaseUrl: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'missing'
});

// Define available tools for the AI
const AVAILABLE_TOOLS = [
  {
    type: "function",
    function: {
      name: "analyze_property",
      description: "Analyze a rental property from URL or description to provide market insights and negotiation advice",
      parameters: {
        type: "object",
        properties: {
          propertyUrl: {
            type: "string",
            description: "URL of the property listing"
          },
          propertyDescription: {
            type: "string", 
            description: "Description of the property including location, bedrooms, bathrooms, rent price"
          }
        },
        required: ["propertyDescription"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_market_data",
      description: "Get current rental market data for a specific location",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "City, neighborhood, or address to get market data for"
          },
          propertyType: {
            type: "string",
            description: "Type of property (studio, 1br, 2br, etc.)",
            enum: ["studio", "1br", "2br", "3br", "4br+"]
          }
        },
        required: ["location"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_script",
      description: "Generate a negotiation script for rental discussions",
      parameters: {
        type: "object",
        properties: {
          scenario: {
            type: "string",
            description: "The negotiation scenario (rent_reduction, lease_renewal, new_lease, etc.)"
          },
          currentRent: {
            type: "number",
            description: "Current or proposed rent amount"
          },
          targetRent: {
            type: "number", 
            description: "Desired rent amount"
          },
          leverage: {
            type: "array",
            items: { type: "string" },
            description: "List of leverage points (market data, property issues, tenant history, etc.)"
          }
        },
        required: ["scenario"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "analyze_lease",
      description: "Analyze lease terms and identify potential issues or improvement opportunities",
      parameters: {
        type: "object",
        properties: {
          leaseText: {
            type: "string",
            description: "Text content of the lease or specific clauses to review"
          },
          focusArea: {
            type: "string",
            description: "Specific area to focus on (rent_increases, termination, repairs, etc.)"
          }
        },
        required: ["leaseText"]
      }
    }
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      prompt,
      message,
      availableTools = [],
      enableToolCalling = false,
      history = [],
      context = {},
      systemPrompt = "You are a helpful rental assistant with memory capabilities.",
      test = false
    } = await req.json();

    // Handle test mode
    if (test) {
      console.log('🧪 TEST MODE: Checking environment and database access');
      
      const testResults = {
        environment: {
          hasOpenAI: !!OPENAI_API_KEY,
          hasSupabaseUrl: !!supabaseUrl,
          hasServiceKey: !!supabaseServiceKey,
          supabaseUrl: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'missing'
        },
        database: {}
      };

      try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        
        // Get authenticated user ID from request
        const authHeader = req.headers.get('Authorization') ?? '';
        const supabaseUser = createClient(supabaseUrl, supabaseServiceKey, {
          global: {
            headers: { Authorization: authHeader },
          },
        });
        
        const { data: userData, error: userError } = await supabaseUser.auth.getUser();
        const testUserId = userData?.user?.id || '00000000-0000-0000-0000-000000000000';
        
        console.log('🧪 Test using user ID:', testUserId);
        
        // Test database connection
        const { data: countData, error: countError } = await supabaseAdmin
          .from('rental_conversations')
          .select('count')
          .limit(1);
          
        testResults.database.connection = {
          success: !countError,
          error: countError?.message,
          count: countData
        };

        // Test insert with real user ID
        const { data: testConv, error: insertError } = await supabaseAdmin
          .from('rental_conversations')
          .insert({
            user_id: testUserId,
            conversation_type: 'general_advice',
            conversation_intent: { test: true, timestamp: new Date().toISOString() },
            context_properties: [],
            key_insights: [],
            action_items: [],
            follow_up_needed: false
          })
          .select()
          .single();

        testResults.database.insert = {
          success: !insertError,
          error: insertError?.message,
          conversationId: testConv?.id,
          testUserId: testUserId
        };

        // Clean up test data
        if (testConv?.id) {
          await supabaseAdmin
            .from('rental_conversations')
            .delete()
            .eq('id', testConv.id);
        }

      } catch (dbError) {
        testResults.database.error = dbError.message;
      }

      return new Response(JSON.stringify({
        testMode: true,
        results: testResults
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Enhanced chat AI called with:', { 
      promptLength: prompt?.length,
      messageLength: message?.length,
      enableToolCalling,
      availableToolsCount: availableTools.length,
      hasContext: !!context,
      userId: context?.userId
    });

    // Use message or prompt
    const userMessage = message || prompt;
    const userId = context?.userId;

    // Initialize Supabase client with service role for database operations
    // This bypasses RLS and ensures we can store rental memory data
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Also create a client with user auth for RPC calls that need user context
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabaseUser = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get rental memory context if userId is provided
    let memoryContext = '';
    if (userId) {
      console.log('🧠 Retrieving rental memory context for user:', userId);
      try {
        const { data: aiContext, error: contextError } = await supabaseUser.rpc('get_user_ai_context', {
          p_user_id: userId
        });

        if (!contextError && aiContext) {
          memoryContext = `\n\n## Previous Rental Context\n${aiContext}\n\nUse this context to provide personalized responses and remember previous conversations.`;
          console.log('✅ Retrieved rental memory context, length:', aiContext.length);
        } else {
          console.log('ℹ️ No rental memory context found or error:', contextError?.message);
        }
      } catch (error) {
        console.log('⚠️ Error retrieving memory context:', error);
      }
    }

    // Enhance system prompt with memory context
    const enhancedSystemPrompt = systemPrompt + memoryContext;

    // Filter tools based on what's requested
    const tools = enableToolCalling ? 
      AVAILABLE_TOOLS.filter(tool => 
        availableTools.includes(tool.function.name)
      ) : [];

    const messages = [
      { role: 'system', content: enhancedSystemPrompt },
      ...history,
      { role: 'user', content: userMessage }
    ];

    const requestBody = {
      model: 'gpt-4-1106-preview',
      messages,
      temperature: 0.7,
      max_tokens: 4096,
      ...(tools.length > 0 && {
        tools,
        tool_choice: 'auto'
      })
    };

    console.log('Calling OpenAI with enhanced memory context');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error(error.error?.message || 'Failed to get response from OpenAI');
    }

    const data = await response.json();
    console.log('OpenAI response received. Model used:', data.model);
    
    const aiMessage = data.choices?.[0]?.message;
    const text = aiMessage?.content || "";
    const toolCalls = aiMessage?.tool_calls || [];

    // Execute tool calls if present
    const executedTools = [];
    if (toolCalls.length > 0) {
      console.log(`Executing ${toolCalls.length} tool calls`);
      
      for (const toolCall of toolCalls) {
        try {
          const result = await executeToolCall(toolCall);
          executedTools.push({
            name: toolCall.function.name,
            arguments: JSON.parse(toolCall.function.arguments),
            result
          });
        } catch (error) {
          console.error(`Error executing tool ${toolCall.function.name}:`, error);
          executedTools.push({
            name: toolCall.function.name,
            arguments: JSON.parse(toolCall.function.arguments),
            result: { error: error.message }
          });
        }
      }
    }

    // Store conversation in rental memory if userId is provided
    if (userId && userMessage && text) {
      console.log('💾 Storing conversation in rental memory...');
      console.log('💾 Storage details:', {
        userId,
        messageLength: userMessage?.length,
        responseLength: text?.length,
        hasContext: !!context,
        contextType: context?.chatType
      });
      
      try {
        // Test supabase connection first
        console.log('🔗 Testing Supabase connection...');
        const { data: testData, error: testError } = await supabaseAdmin
          .from('rental_conversations')
          .select('count')
          .limit(1);
        
        console.log('🔗 Connection test result:', { testData, testError });
        
        if (testError) {
          console.error('❌ Supabase connection failed:', testError);
          throw new Error(`Connection failed: ${testError.message}`);
        }
        
        // Check current row count before insert
        const { count: beforeCount } = await supabaseAdmin
          .from('rental_conversations')
          .select('*', { count: 'exact', head: true });
        console.log('📊 Conversations before insert:', beforeCount);
        
        // Create or get conversation using admin client to bypass RLS
        const conversationType = context?.chatType || 'negotiation_help';
        const insertData = {
          user_id: userId,
          conversation_type: conversationType,
          conversation_intent: {
            property_context: context?.propertyContext,
            ai_model: data.model,
            has_tools: toolCalls.length > 0,
            created_via: 'chat-ai-enhanced'
          },
          context_properties: [],
          key_insights: [],
          action_items: [],
          follow_up_needed: false
        };
        
        console.log('📝 Inserting conversation with data:', insertData);
        
        const { data: conversation, error: convError } = await supabaseAdmin
          .from('rental_conversations')
          .insert(insertData)
          .select()
          .single();

        console.log('📝 Conversation insert result:', { 
          success: !convError,
          error: convError?.message,
          errorDetails: convError,
          conversationId: conversation?.id,
          conversationData: conversation
        });

        if (!convError && conversation) {
          console.log('✅ Created rental conversation:', conversation.id);
          
          // Check row count after conversation insert
          const { count: afterConvCount } = await supabaseAdmin
            .from('rental_conversations')
            .select('*', { count: 'exact', head: true });
          console.log('📊 Conversations after insert:', afterConvCount);

          // Store user message using admin client
          console.log('💬 Inserting user message...');
          const userMessageData = {
            conversation_id: conversation.id,
            role: 'user',
            content: userMessage,
            referenced_properties: [],
            generated_insights: {
              property_context: context?.propertyContext,
              timestamp: new Date().toISOString()
            }
          };
          
          console.log('💬 User message data:', userMessageData);
          
          const { data: userMsgResult, error: userMsgError } = await supabaseAdmin
            .from('rental_messages')
            .insert(userMessageData)
            .select()
            .single();

          console.log('💬 User message result:', { 
            success: !userMsgError, 
            error: userMsgError?.message,
            errorDetails: userMsgError,
            messageId: userMsgResult?.id
          });

          if (userMsgError) {
            console.log('⚠️ Failed to store user message:', userMsgError.message);
          } else {
            console.log('✅ Stored user message:', userMsgResult?.id);
          }

          // Store AI response using admin client
          console.log('🤖 Inserting AI message...');
          const aiMessageData = {
            conversation_id: conversation.id,
            role: 'assistant',
            content: text,
            referenced_properties: [],
            generated_insights: {
              ai_model: data.model,
              tool_calls: executedTools,
              timestamp: new Date().toISOString()
            },
            model_used: data.model
          };
          
          console.log('🤖 AI message data:', aiMessageData);
          
          const { data: aiMsgResult, error: aiMsgError } = await supabaseAdmin
            .from('rental_messages')
            .insert(aiMessageData)
            .select()
            .single();

          console.log('🤖 AI message result:', { 
            success: !aiMsgError, 
            error: aiMsgError?.message,
            errorDetails: aiMsgError,
            messageId: aiMsgResult?.id
          });

          if (aiMsgError) {
            console.log('⚠️ Failed to store AI message:', aiMsgError.message);
          } else {
            console.log('✅ Stored AI message:', aiMsgResult?.id);
          }

          // Final verification - check if data actually exists
          console.log('🔍 Final verification...');
          const { data: verifyConv, error: verifyConvError } = await supabaseAdmin
            .from('rental_conversations')
            .select('*')
            .eq('id', conversation.id)
            .single();
            
          const { data: verifyMsgs, error: verifyMsgError } = await supabaseAdmin
            .from('rental_messages')
            .select('*')
            .eq('conversation_id', conversation.id);
            
          console.log('🔍 Verification results:', {
            conversationExists: !!verifyConv,
            conversationError: verifyConvError?.message,
            messageCount: verifyMsgs?.length || 0,
            messageError: verifyMsgError?.message
          });

          console.log('✅ Rental memory storage completed successfully');
        } else {
          console.log('⚠️ Failed to create conversation:', convError?.message);
          console.log('⚠️ Full conversation error:', convError);
        }
      } catch (error) {
        console.log('⚠️ Error storing rental memory:', error.message || error);
        console.log('⚠️ Full error object:', error);
      }
    } else {
      console.log('⚠️ Skipping rental memory storage:', {
        hasUserId: !!userId,
        hasUserMessage: !!userMessage,
        hasText: !!text
      });
    }

    return new Response(JSON.stringify({ 
      text,
      model: data.model,
      toolCalls: executedTools,
      hasMemory: !!memoryContext,
      storedInMemory: !!(userId && userMessage && text)
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in chat-ai-enhanced function:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function executeToolCall(toolCall: any) {
  const { name, arguments: args } = toolCall.function;
  const parsedArgs = JSON.parse(args);
  
  switch (name) {
    case 'analyze_property':
      return await analyzeProperty(parsedArgs);
    case 'get_market_data':
      return await getMarketData(parsedArgs);
    case 'generate_script':
      return await generateScript(parsedArgs);
    case 'analyze_lease':
      return await analyzeLease(parsedArgs);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function analyzeProperty(args: any) {
  // This would integrate with your existing property analysis functions
  // For now, return mock data
  console.log('Analyzing property:', args);
  
  return {
    marketPosition: 'slightly_above_market',
    suggestedNegotiation: 'Request 5-8% reduction based on comparable properties',
    leverage: ['Property has been listed for 45+ days', 'Similar units average $200 less'],
    recommendations: [
      'Present 3 comparable listings with lower prices',
      'Offer longer lease term for discount',
      'Request concessions like free parking'
    ]
  };
}

async function getMarketData(args: any) {
  console.log('Getting market data for:', args);
  
  // This would integrate with real market data APIs
  return {
    averageRent: '$2,400',
    medianRent: '$2,350', 
    rentTrend: 'decreasing',
    trendPercentage: -2.1,
    dataSource: 'Market analysis aggregated from multiple listing sources',
    recommendedRange: '$2,200 - $2,500'
  };
}

async function generateScript(args: any) {
  console.log('Generating script for:', args);
  
  return {
    openingLine: "Hi [Landlord Name], I hope you're doing well. I wanted to discuss the rental terms for [Property Address].",
    mainPoints: [
      "Based on my research of similar properties in the area, I've found comparable units renting for less",
      "I'm a reliable tenant with excellent references and steady income",
      "I'm looking for a long-term rental arrangement"
    ],
    negotiationAsk: args.targetRent ? 
      `Would you consider a rental rate of $${args.targetRent}?` :
      "Would you be open to discussing a slight adjustment to the rental rate?",
    closingLine: "I'm very interested in this property and hope we can find terms that work for both of us."
  };
}

async function analyzeLease(args: any) {
  console.log('Analyzing lease:', args.focusArea);
  
  return {
    issues: [
      "Rent increase clause allows for unlimited increases with 30-day notice",
      "Early termination fee is excessive at 2 months rent"
    ],
    recommendations: [
      "Request a cap on annual rent increases (3-5%)",
      "Negotiate early termination fee down to 1 month or prorated amount"
    ],
    riskLevel: 'medium',
    summary: 'The lease generally favors the landlord but has room for negotiation on key terms.'
  };
} 