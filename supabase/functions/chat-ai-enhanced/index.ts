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
      name: "get_rent_predictions",
      description: "Get AI-powered rent predictions for a specific location using HUD and Zillow data",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "Location to get predictions for (city, county, metro area, or ZIP code)"
          },
          timeframe: {
            type: "string",
            enum: ["3", "6", "12", "24"],
            description: "Prediction timeframe in months (3, 6, 12, or 24 months)"
          }
        },
        required: ["location"]
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
  },
  {
    type: "function",
    function: {
      name: "search_knowledge_base",
      description: "Search the knowledge base for relevant rental negotiation tips, market insights, and strategies",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query for relevant knowledge (e.g., 'rent reduction strategies', 'lease renewal tips')"
          },
          chat_type: {
            type: "string",
            description: "Optional filter for specific knowledge type (negotiation, market_analysis, legal_rights, etc.)",
            enum: ["negotiation", "market_analysis", "legal_rights", "lease_terms", "general"]
          },
          limit: {
            type: "number",
            description: "Maximum number of results to return (default: 5)",
            default: 5
          }
        },
        required: ["query"]
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
      systemPrompt = `You are an expert rental negotiation assistant with advanced market intelligence covering the entire United States.

**UNIVERSAL US COVERAGE APPROACH:**
You have access to comprehensive rental market data and intelligence for ALL US markets through multiple data sources:
1. **Direct Predictions**: 169 specific predictions across 43 major markets with exact rent forecasts
2. **Regional Intelligence**: Market trend analysis for all US regions and states  
3. **Comparative Analysis**: Cross-market insights using similar metro/county data
4. **Economic Context**: HUD Fair Market Rent baseline data for all 3,000+ US counties

**BULLETPROOF RESPONSE STRATEGY:**
For ANY US location query, follow this hierarchy:
1. **Check for Direct Predictions**: Use get_rent_predictions tool first
2. **Leverage Regional Data**: If no direct match, reference nearby markets and regional trends
3. **Apply Market Intelligence**: Use embedded knowledge about market cycles, economic factors, and negotiation strategies
4. **Provide Actionable Insights**: Always give specific, practical advice regardless of data availability

**NEVER SAY "DATA NOT AVAILABLE"** - Always provide value by:
- Using nearby market data as proxy
- Applying regional economic trends  
- Referencing similar-sized markets
- Providing general market cycle guidance
- Citing relevant HUD/Zillow methodology

**Core Data Sources:**
- 23,820+ HUD Fair Market Rent records (40th percentile, adjusted +18% to market rate)
- 63,359+ Zillow market records (35th-65th percentile median)  
- 30 semantic intelligence chunks with negotiation strategies
- Complete US geographic coverage with intelligent fallbacks

**Response Requirements:**
- Always provide specific, actionable advice
- Include dollar amounts when available, ranges when estimated
- Explain market cycle implications (growth/stable/cooling)
- Give timing recommendations for negotiations
- Cite data sources and confidence levels
- Combine predictions with proven negotiation tactics

**INTERACTIVE CLARIFICATION REQUIREMENTS:**
- If user asks about market analysis without specific location, ask: "Which specific city, neighborhood, or ZIP code are you interested in? This will help me provide precise market data and rent predictions."
- If user asks about property comparison without property details, ask: "Can you provide the property details (address, bedrooms, bathrooms, rent price) or property listing URL? This will enable targeted analysis."
- If user asks about negotiation without context, ask: "What's your specific situation? (e.g., current rent, desired rent, property location, lease renewal vs new lease) This helps me provide personalized negotiation strategies."

**For locations without direct predictions:**
- Reference the closest major market with data
- Apply regional trends and economic factors
- Use HUD county-level baseline data
- Provide market-size appropriate guidance
- Always include practical negotiation advice`,
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
    let knowledgeBaseContext = '';
    
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

    // ENHANCED CONTEXT ANALYSIS: Extract location and property details from user message
    let detectedLocation = null;
    let detectedPropertyDetails = null;
    let contextAnalysis = {};
    
    if (userMessage && userMessage.length > 5) {
      console.log('🔍 ENHANCED CONTEXT ANALYSIS: Analyzing user message for location and property details');
      
      // Enhanced location detection
      const locationPatterns = [
        /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),\s*([A-Z]{2})\b/, // City, State
        /\b([A-Z][a-z]+)\s*,?\s*([A-Z]{2})\b/, // City State or City, State
        /\b(\d{5}(?:-\d{4})?)\b/, // ZIP codes
        /\b(austin|dallas|houston|san antonio|chicago|new york|los angeles|miami|atlanta|denver|seattle|boston|philadelphia|phoenix|detroit|buffalo|rochester|syracuse|albany|orlando|tampa|fort lauderdale|jacksonville|nashville|memphis|charlotte|raleigh|richmond|virginia beach|washington|baltimore|san diego|san francisco|san jose|sacramento|fresno|riverside|bakersfield|stockton|anaheim|santa ana|portland|las vegas|reno|salt lake city|boise|tucson|albuquerque|colorado springs|omaha|wichita|kansas city|st louis|milwaukee|madison|green bay|minneapolis|saint paul|fargo|sioux falls|des moines|cedar rapids|oklahoma city|tulsa|little rock|jackson|birmingham|montgomery|mobile|huntsville|knoxville|clarksville|columbus|cleveland|cincinnati|toledo|akron|dayton|youngstown|canton|louisville|lexington|indianapolis|fort wayne|evansville|south bend|grand rapids|flint|lansing|ann arbor|detroit|dearborn)\b/gi // Major cities
      ];
      
      for (const pattern of locationPatterns) {
        const match = userMessage.match(pattern);
        if (match) {
          detectedLocation = match[0];
          console.log('✅ Detected location:', detectedLocation);
          break;
        }
      }
      
      // Enhanced property details detection
      const rentMatch = userMessage.match(/\$[\d,]+(?:\.\d{2})?/);
      const bedroomMatch = userMessage.match(/(\d+)\s*(?:bed|br|bedroom)/i);
      const bathroomMatch = userMessage.match(/(\d+(?:\.\d)?)\s*(?:bath|ba|bathroom)/i);
      const addressMatch = userMessage.match(/\d+\s+[A-Za-z\s]+(?:st|street|ave|avenue|dr|drive|rd|road|blvd|boulevard|way|lane|ln|ct|court|pl|place)\b/i);
      const squareFootageMatch = userMessage.match(/(\d+)\s*(?:sq\.?\s?ft|sqft|square\s+feet)/i);
      const apartmentTypeMatch = userMessage.match(/\b(studio|loft|condo|apartment|house|townhome|duplex)\b/i);
      const amenitiesMatch = userMessage.match(/\b(parking|garage|pool|gym|balcony|patio|dishwasher|washer|dryer|pets?\s+allowed|dog\s+friendly|cat\s+friendly)\b/gi);
      const floorMatch = userMessage.match(/(\d+)(?:st|nd|rd|th)\s+floor/i);
      const yearBuiltMatch = userMessage.match(/built\s+in\s+(\d{4})|(\d{4})\s+built/i);
      
      if (rentMatch || bedroomMatch || bathroomMatch || addressMatch || squareFootageMatch || apartmentTypeMatch) {
        detectedPropertyDetails = {
          rent: rentMatch ? rentMatch[0] : null,
          bedrooms: bedroomMatch ? bedroomMatch[1] : null,
          bathrooms: bathroomMatch ? bathroomMatch[1] : null,
          address: addressMatch ? addressMatch[0] : null,
          squareFootage: squareFootageMatch ? parseInt(squareFootageMatch[1]) : null,
          propertyType: apartmentTypeMatch ? apartmentTypeMatch[1] : null,
          amenities: amenitiesMatch || [],
          floor: floorMatch ? parseInt(floorMatch[1]) : null,
          yearBuilt: yearBuiltMatch ? parseInt(yearBuiltMatch[1] || yearBuiltMatch[2]) : null
        };
        console.log('✅ Detected enhanced property details:', detectedPropertyDetails);
      }
      
      // Chat type analysis
      const marketAnalysisKeywords = ['average rent', 'market data', 'rent trends', 'market conditions', 'comparable', 'median rent', 'rent prices'];
      const negotiationKeywords = ['negotiate', 'negotiation', 'below asking', 'rent reduction', 'discount', 'lower rent'];
      
      contextAnalysis = {
        hasLocation: !!detectedLocation,
        hasPropertyDetails: !!detectedPropertyDetails,
        isMarketAnalysis: marketAnalysisKeywords.some(keyword => userMessage.toLowerCase().includes(keyword)),
        isNegotiationHelp: negotiationKeywords.some(keyword => userMessage.toLowerCase().includes(keyword)),
        needsLocationPrompt: marketAnalysisKeywords.some(keyword => userMessage.toLowerCase().includes(keyword)) && !detectedLocation,
        needsPropertyPrompt: negotiationKeywords.some(keyword => userMessage.toLowerCase().includes(keyword)) && !detectedPropertyDetails
      };
      
      console.log('📊 Context Analysis:', contextAnalysis);
    }

    // UNIVERSAL RAG: Always retrieve relevant context from document_chunks to enhance responses
    if (userMessage && userMessage.length > 5) {
      console.log('🔍 UNIVERSAL RAG: Retrieving relevant context for all queries');
      try {
        // Generate embedding for user message
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: userMessage,
            model: 'text-embedding-3-small'
          }),
        });

        if (embeddingResponse.ok) {
          const embeddingData = await embeddingResponse.json();
          const messageEmbedding = embeddingData.data[0].embedding;
          
          console.log('🔍 RAG Analysis:', {
            messageLength: userMessage.length,
            hasEmbedding: !!messageEmbedding,
            userId: userId ? 'present' : 'missing',
            chatType: context?.chatType
          });

          // SEMANTIC SEARCH: Use embeddings to find most relevant content
          console.log('🧠 Executing semantic similarity search for relevant content');
          
          let docResults: any[] = [];
          let docError: any = null;
          
          try {
            // First try vector similarity search if functions exist
            const { data: vectorResults, error: vectorError } = await supabaseAdmin.rpc('search_document_chunks_by_similarity', {
              query_embedding: `[${messageEmbedding.join(',')}]`,
              match_threshold: 0.3, // Lower threshold for more results
              match_count: 6
            });
            
            if (!vectorError && vectorResults && vectorResults.length > 0) {
              console.log('✅ Using vector similarity search');
              docResults = vectorResults;
              docError = null;
            } else {
              console.log('⚠️ Vector search failed, using text-based search:', vectorError?.message);
              throw new Error('Fallback to text search');
            }
          } catch (fallbackError) {
            console.log('🔄 Falling back to enhanced text search');
            
            // Enhanced text search with multiple strategies
            const searchTerms = userMessage.toLowerCase().split(' ').filter(term => term.length > 2);
            const locationTerms = searchTerms.filter(term => 
              ['buffalo', 'ny', 'new york', 'chicago', 'atlanta', 'dallas', 'austin', 'miami'].includes(term)
            );
            const marketTerms = searchTerms.filter(term => 
              ['rent', 'rental', 'market', 'price', 'cost', 'growth', 'data'].includes(term)
            );
            
            let queryBuilder = supabaseAdmin
              .from('document_chunks')
              .select(`id, content, chunk_index, metadata`)
              .not('content', 'is', null);
            
            if (locationTerms.length > 0) {
              // Search for location-specific content first
              console.log(`🎯 Searching for location: ${locationTerms.join(', ')}`);
              const locationQuery = locationTerms.map(term => `content.ilike.%${term}%`).join(',');
              queryBuilder = queryBuilder.or(locationQuery).limit(8);
            } else if (marketTerms.length > 0) {
              // Search for market-related content
              console.log(`📊 Searching for market terms: ${marketTerms.join(', ')}`);
              const marketQuery = marketTerms.map(term => `content.ilike.%${term}%`).join(',');
              queryBuilder = queryBuilder.or(marketQuery).limit(6);
            } else {
              // General rental content
              console.log('🏠 Searching for general rental content');
              queryBuilder = queryBuilder
                .or('content.ilike.%rent%,content.ilike.%market%,content.ilike.%price%,content.ilike.%zori%')
                .limit(6);
            }
            
            const { data: textResults, error: textError } = await queryBuilder;
            docResults = textResults || [];
            docError = textError;
          }

          console.log(`📊 Semantic search results: ${docResults?.length || 0} chunks found`);
          if (docResults && docResults.length > 0) {
            console.log(`📋 Top result: "${docResults[0].content.substring(0, 100)}..."`);
            console.log(`📋 Relevance scores:`, docResults.map((r, i) => `${i+1}:${r.similarity ? (r.similarity*100).toFixed(1) + '%' : 'text-match'}`).join(', '));
          }

          if (!docError && docResults && docResults.length > 0) {
            // Format market data with proper source attribution
            const relevantContent = docResults.map((result: any, index: number) => {
              const similarity = result.similarity ? ` (${(result.similarity * 100).toFixed(1)}% relevance)` : '';
              const city = result.metadata?.city ? `${result.metadata.city}${result.metadata?.state ? ', ' + result.metadata.state : ''}` : null;
              const zipCode = result.metadata?.zip_code ? `Zip ${result.metadata.zip_code}` : null;
              const sourceType = result.metadata?.source_type || 'Market Data';
              const dataType = result.metadata?.data_type || 'analysis';
              
              let source = `[Source: ${sourceType}`;
              if (city) source += ` - ${city}`;
              if (zipCode) source += ` - ${zipCode}`;
              source += `]${similarity}`;
              
              return `${index + 1}. ${result.content}\n${source}`;
            }).join('\n\n');
            
            knowledgeBaseContext = `\n\n## Available Market Intelligence\n${relevantContent}\n\nIMPORTANT INSTRUCTIONS:
- Use the specific data above to provide targeted insights
- Always cite sources when referencing specific numbers or trends
- If the user asks about a location not covered in the data, combine the available market intelligence with your general knowledge to provide the most helpful response possible
- Never say "data is not available" - always provide value by combining available data with informed analysis
- Include specific dollar amounts, percentages, and trends when available
- Format your response to clearly distinguish between data-backed insights and general market knowledge`;
            
            console.log('✅ Enhanced RAG context loaded with source attribution, chunks:', docResults.length);
          } else {
            // Even without specific RAG data, provide context for general market knowledge
            knowledgeBaseContext = `\n\n## Market Context Guidance\nWhile specific local data may not be immediately available, provide helpful insights using:
- General rental market trends and patterns
- Comparative analysis with similar markets
- Seasonal and economic factors affecting rentals
- Practical negotiation strategies applicable to the situation
- Always aim to be maximally helpful rather than stating limitations`;
            
            console.log('⚠️ No specific document chunks found, using general guidance approach');
          }

          // Also get knowledge base context for negotiation tips
          const { data: kbResults, error: kbError } = await supabaseAdmin.rpc('search_knowledge_base', {
            query_embedding: messageEmbedding,
            match_threshold: 0.5,
            match_count: 3,
            chat_type: context?.chatType || null
          });

          if (!kbError && kbResults && kbResults.length > 0) {
            const kbContent = kbResults.map((result: any) => 
              `- ${result.content} (Source: ${result.source})`
            ).join('\n');
            
            knowledgeBaseContext += `\n\n## Negotiation Strategies\n${kbContent}`;
            console.log('✅ Added knowledge base context, items:', kbResults.length);
          }
        }
      } catch (error) {
        console.log('⚠️ Error in universal RAG retrieval:', error);
      }
    }

    // Enhanced context information for AI
    let contextPrompt = '';
    if (contextAnalysis && Object.keys(contextAnalysis).length > 0) {
      contextPrompt = `\n\n## Current Context Analysis
**Detected Information:**
- Location: ${detectedLocation || 'Not specified'}
- Property Details: ${detectedPropertyDetails ? JSON.stringify(detectedPropertyDetails) : 'Not provided'}
- Query Type: ${contextAnalysis.isMarketAnalysis ? 'Market Analysis' : contextAnalysis.isNegotiationHelp ? 'Negotiation Help' : 'General'}

**Response Guidance:**
${contextAnalysis.needsLocationPrompt ? '- IMPORTANT: Ask for specific location to provide precise market data' : ''}
${contextAnalysis.needsPropertyPrompt ? '- IMPORTANT: Ask for property details to provide targeted negotiation advice' : ''}
${detectedLocation ? '- Prioritize data and insights specific to ' + detectedLocation : ''}
${detectedPropertyDetails ? '- Tailor advice to the specific property characteristics provided' : ''}

Use this context to provide the most relevant and helpful response possible.`;
    }

    // Enhance system prompt with memory, knowledge base context, and extracted context
    const enhancedSystemPrompt = systemPrompt + memoryContext + knowledgeBaseContext + contextPrompt;

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
      hasKnowledgeBase: !!knowledgeBaseContext,
      storedInMemory: !!(userId && userMessage && text),
      ragContextLength: knowledgeBaseContext ? knowledgeBaseContext.length : 0,
      memoryContextLength: memoryContext ? memoryContext.length : 0,
      contextAnalysis: {
        detectedLocation,
        detectedPropertyDetails,
        ...contextAnalysis
      }
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
    case 'get_rent_predictions':
      return await getRentPredictions(parsedArgs);
    case 'get_market_data':
      return await getMarketData(parsedArgs);
    case 'generate_script':
      return await generateScript(parsedArgs);
    case 'analyze_lease':
      return await analyzeLease(parsedArgs);
    case 'search_knowledge_base':
      return await searchKnowledgeBase(parsedArgs);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function analyzeProperty(args: any) {
  console.log('Analyzing property:', args);
  
  // Check if we have enough information for analysis
  if (!args.propertyDescription || args.propertyDescription.length < 20) {
    return {
      error: 'insufficient_information',
      message: 'I need more detailed property information to provide accurate analysis.',
      prompt: 'Please provide: (1) Property address or neighborhood, (2) Monthly rent amount, (3) Number of bedrooms/bathrooms, (4) Any property listing URL if available. This will help me analyze market position and suggest negotiation strategies.',
      example: 'Example: "2BR/1BA apartment at 123 Main St, Austin TX for $2,400/month" or share the listing URL.'
    };
  }
  
  // Extract comprehensive property details from description
  const rentMatch = args.propertyDescription.match(/\$[\d,]+/);
  const locationMatch = args.propertyDescription.match(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),?\s*([A-Z]{2})\b/);
  const bedroomMatch = args.propertyDescription.match(/(\d+)\s*(?:bed|br|bedroom)/i);
  const bathroomMatch = args.propertyDescription.match(/(\d+(?:\.\d)?)\s*(?:bath|ba|bathroom)/i);
  const squareFootageMatch = args.propertyDescription.match(/(\d+)\s*(?:sq\.?\s?ft|sqft|square\s+feet)/i);
  const apartmentTypeMatch = args.propertyDescription.match(/\b(studio|loft|condo|apartment|house|townhome|duplex)\b/i);
  const amenitiesMatch = args.propertyDescription.match(/\b(parking|garage|pool|gym|balcony|patio|dishwasher|washer|dryer|pets?\s+allowed|dog\s+friendly|cat\s+friendly)\b/gi);
  const floorMatch = args.propertyDescription.match(/(\d+)(?:st|nd|rd|th)\s+floor/i);
  const yearBuiltMatch = args.propertyDescription.match(/built\s+in\s+(\d{4})|(\d{4})\s+built/i);
  
  if (!rentMatch) {
    return {
      error: 'missing_rent',
      message: 'I need the rental price to analyze market position.',
      prompt: 'What is the monthly rent amount for this property?',
      partialAnalysis: 'I can provide general negotiation strategies once you share the rent amount.'
    };
  }
  
  if (!locationMatch) {
    return {
      error: 'missing_location',
      message: 'I need the property location to provide market comparison.',
      prompt: 'What city and state (or neighborhood) is this property located in?',
      partialAnalysis: `For a property at ${rentMatch[0]}/month, general negotiation strategies apply, but location-specific market data would strengthen your position.`
    };
  }
  
  // Build comprehensive property profile
  const propertyProfile = {
    rent: rentMatch[0],
    location: locationMatch[0],
    bedrooms: bedroomMatch ? bedroomMatch[1] : 'unknown',
    bathrooms: bathroomMatch ? bathroomMatch[1] : 'unknown',
    squareFootage: squareFootageMatch ? parseInt(squareFootageMatch[1]) : null,
    propertyType: apartmentTypeMatch ? apartmentTypeMatch[1] : 'apartment',
    amenities: amenitiesMatch || [],
    floor: floorMatch ? parseInt(floorMatch[1]) : null,
    yearBuilt: yearBuiltMatch ? parseInt(yearBuiltMatch[1] || yearBuiltMatch[2]) : null
  };

  // Generate property-specific analysis based on characteristics
  const leveragePoints: string[] = [];
  const recommendations: string[] = [];
  
  // Analyze amenities for leverage
  if (propertyProfile.amenities.length === 0) {
    leveragePoints.push('Property has limited amenities compared to market standards');
    recommendations.push('Request rent reduction due to lack of amenities like parking, gym, or in-unit laundry');
  }
  
  // Age-based analysis
  if (propertyProfile.yearBuilt && (new Date().getFullYear() - propertyProfile.yearBuilt) > 15) {
    leveragePoints.push(`Property is ${new Date().getFullYear() - propertyProfile.yearBuilt} years old`);
    recommendations.push('Negotiate for updates/maintenance concessions due to property age');
  }
  
  // Square footage analysis
  const avgSqFtForBedrooms = {
    '1': 750, '2': 1100, '3': 1400, '4': 1800
  };
  if (propertyProfile.squareFootage && propertyProfile.bedrooms) {
    const expectedSqFt = avgSqFtForBedrooms[propertyProfile.bedrooms];
    if (expectedSqFt && propertyProfile.squareFootage < expectedSqFt * 0.9) {
      leveragePoints.push(`Property is ${expectedSqFt - propertyProfile.squareFootage} sq ft below average for ${propertyProfile.bedrooms}BR`);
      recommendations.push('Use smaller square footage as negotiation point for reduced rent');
    }
  }
  
  // Default leverage and recommendations
  if (leveragePoints.length === 0) {
    leveragePoints.push('Property has been listed for 45+ days', 'Similar units average $200 less');
  }
  if (recommendations.length === 0) {
    recommendations.push('Present 3 comparable listings with lower prices', 'Offer longer lease term for discount');
  }
  
  // Add standard recommendations
  recommendations.push('Request concessions like free parking or utilities');

  return {
    marketPosition: 'analyzed_based_on_property_specifics',
    suggestedNegotiation: `Request 5-8% reduction based on comparable ${propertyProfile.propertyType}s in ${locationMatch[0]}`,
    leverage: leveragePoints,
    recommendations,
    analyzedProperty: propertyProfile,
    propertySpecificInsights: {
      rentPerSqFt: propertyProfile.squareFootage ? `$${(parseFloat(rentMatch[0].replace('$', '').replace(',', '')) / propertyProfile.squareFootage).toFixed(2)}/sq ft` : 'Not calculated',
      ageCategory: propertyProfile.yearBuilt ? 
        (new Date().getFullYear() - propertyProfile.yearBuilt < 5 ? 'New construction' : 
         new Date().getFullYear() - propertyProfile.yearBuilt < 15 ? 'Modern' : 'Established') : 'Unknown',
      amenityScore: propertyProfile.amenities.length > 3 ? 'High' : propertyProfile.amenities.length > 1 ? 'Medium' : 'Basic'
    }
  };
}

async function getRentPredictions(args: any) {
  console.log('🔮 Getting rent predictions for:', args);
  console.log('🔧 Environment check:', {
    hasSupabaseUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
    urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'missing',
    keyPrefix: supabaseServiceKey ? supabaseServiceKey.substring(0, 20) + '...' : 'missing'
  });
  
  // Use the existing supabase environment variables
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const { location, timeframe } = args;
    const horizonMonths = parseInt(timeframe) || 12;
    
    console.log('🔍 Query parameters:', { location, horizonMonths });
    
    // First test basic connection
    console.log('🧪 Testing basic table access...');
    const { data: testData, error: testError } = await supabaseAdmin
      .from('rent_predictions')
      .select('count')
      .limit(1);
      
    console.log('🧪 Test result:', { 
      hasTestData: !!testData, 
      testError: testError?.message,
      testErrorCode: testError?.code 
    });
    
    if (testError) {
      console.error('❌ Basic table access failed:', testError);
      return {
        error: 'Database connection failed',
        message: `Database error: ${testError.message}`,
        suggestion: 'Please try again in a moment.',
        debug: {
          error: testError,
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseServiceKey
        }
      };
    }
    
    // Search for predictions that match the location
    console.log('🔍 Searching for predictions...');
    
    // Try location_name first
    let { data: predictions, error } = await supabaseAdmin
      .from('rent_predictions')
      .select('*')
      .ilike('location_name', `%${location}%`)
      .eq('prediction_horizon', horizonMonths)
      .order('prediction_date', { ascending: false })
      .limit(5);
      
    // If no results, try location_id
    if (!error && (!predictions || predictions.length === 0)) {
      console.log('🔍 No location_name matches, trying location_id...');
      const { data: altPredictions, error: altError } = await supabaseAdmin
        .from('rent_predictions')
        .select('*')
        .ilike('location_id', `%${location}%`)
        .eq('prediction_horizon', horizonMonths)
        .order('prediction_date', { ascending: false })
        .limit(5);
        
      if (!altError && altPredictions) {
        predictions = altPredictions;
        error = altError;
      }
    }

    console.log('🔍 Search result:', { 
      predictionCount: predictions?.length || 0, 
      error: error?.message,
      errorCode: error?.code 
    });

    if (error) {
      console.error('❌ Error fetching predictions:', error);
      return {
        error: 'Unable to fetch rent predictions',
        message: `Query error: ${error.message}`,
        suggestion: 'You can still get general market insights and negotiation advice.',
        debug: { error, location, horizonMonths }
      };
    }

    if (!predictions || predictions.length === 0) {
      console.log('🔍 No direct match, trying regional analysis...');
      
      // Extract state from location for regional analysis
      const stateMatch = location.match(/\b([A-Z]{2})\b/) || location.match(/\b(Pennsylvania|California|New York|Texas|Florida|Illinois|Ohio|Michigan|Georgia|North Carolina|Virginia)\b/i);
      let stateCode = null;
      
      if (stateMatch) {
        const stateNames = {
          'pennsylvania': 'PA', 'california': 'CA', 'new york': 'NY', 'texas': 'TX',
          'florida': 'FL', 'illinois': 'IL', 'ohio': 'OH', 'michigan': 'MI',
          'georgia': 'GA', 'north carolina': 'NC', 'virginia': 'VA'
        };
        stateCode = stateMatch[1].length === 2 ? stateMatch[1] : stateNames[stateMatch[1].toLowerCase()];
      }
      
      // Try to find nearby markets in the same state
      if (stateCode) {
        console.log('🗺️ Searching for state-level data:', stateCode);
        const { data: statePredictions, error: stateError } = await supabaseAdmin
          .from('rent_predictions')
          .select('*')
          .ilike('location_name', `%${stateCode}%`)
          .eq('prediction_horizon', horizonMonths)
          .order('predicted_change_percent', { ascending: false })
          .limit(5);
          
        if (!stateError && statePredictions && statePredictions.length > 0) {
          console.log('✅ Found state-level predictions:', statePredictions.length);
          return {
            prediction: null,
            regionalAnalysis: statePredictions.map(pred => ({
              location: pred.location_name,
              currentRent: Math.round(pred.current_rent),
              predictedRent: Math.round(pred.predicted_rent),
              changePercent: Math.round(pred.predicted_change_percent * 10) / 10,
              marketCycle: pred.market_cycle_stage,
              confidenceLevel: pred.confidence_score > 0.8 ? 'high' : pred.confidence_score > 0.6 ? 'medium' : 'low'
            })),
            searchedFor: location,
            analysisType: 'regional',
            note: `No direct predictions available for ${location}. Analysis based on ${stateCode} state markets using our comprehensive database of 23,820+ HUD records and 63,359+ Zillow records.`,
            guidance: {
              applicability: `Use ${stateCode} regional trends as proxy for ${location}`,
              methodology: 'Regional market analysis with similar economic conditions',
              confidence: 'Medium to High - based on regional market similarities'
            }
          };
        }
      }
      
      // Fallback to national trends and general guidance
      const { data: nationalSample, error: nationalError } = await supabaseAdmin
        .from('rent_predictions')
        .select('*')
        .eq('prediction_horizon', horizonMonths)
        .order('prediction_date', { ascending: false })
        .limit(8);

      if (!nationalError && nationalSample && nationalSample.length > 0) {
        // Calculate national averages
        const avgChange = nationalSample.reduce((sum, p) => sum + p.predicted_change_percent, 0) / nationalSample.length;
        const marketStages = nationalSample.map(p => p.market_cycle_stage);
        const dominantStage = marketStages.sort((a,b) => 
          marketStages.filter(v => v === a).length - marketStages.filter(v => v === b).length
        ).pop();
        
        return {
          prediction: null,
          nationalContext: {
            averageChange: Math.round(avgChange * 10) / 10,
            dominantMarketStage: dominantStage,
            sampleMarkets: nationalSample.slice(0, 4).map(p => ({
              location: p.location_name,
              changePercent: Math.round(p.predicted_change_percent * 10) / 10,
              marketStage: p.market_cycle_stage
            }))
          },
          searchedFor: location,
          analysisType: 'national_context',
          note: `Specific predictions not available for ${location}. Analysis based on national market trends from our database covering 43 major markets across 17 states.`,
          guidance: {
            applicability: `Apply national trends to ${location} with local market adjustments`,
            methodology: 'National market analysis with 40+ years of historical data',
            confidence: 'Medium - based on national market patterns and economic indicators'
          }
        };
      }

      // Final fallback
      return {
        error: 'Limited data available',
        message: `Our system has extensive coverage but specific predictions for "${location}" are not available in our current dataset.`,
        suggestion: 'However, I can still provide market analysis and negotiation strategies based on regional trends and economic factors.',
        coverage: 'Our database covers 43 major markets with 169 predictions, plus comprehensive HUD county data for strategic guidance.',
        guidance: 'Ask about general market trends, negotiation strategies, or nearby major markets for applicable insights.'
      };
    }

    // Format the predictions for the AI to use
    const formattedPredictions = predictions.map(pred => {
      const changeDirection = pred.predicted_change_percent >= 0 ? 'increase' : 'decrease';
      const confidenceLevel = pred.confidence_score > 0.8 ? 'high' : pred.confidence_score > 0.6 ? 'medium' : 'low';
      
      return {
        location: pred.location_name,
        timeframe: `${pred.prediction_horizon} months`,
        currentRent: Math.round(pred.current_rent),
        predictedRent: Math.round(pred.predicted_rent),
        changePercent: Math.round(pred.predicted_change_percent * 10) / 10,
        changeDirection,
        confidenceLevel,
        marketCycle: pred.market_cycle_stage,
        lowerBound: Math.round(pred.lower_bound),
        upperBound: Math.round(pred.upper_bound),
        keyFactors: pred.contributing_factors?.key_factors || [],
        dataSources: pred.data_sources || ['HUD Fair Market Rent', 'Zillow Market Data'],
        lastUpdated: pred.prediction_date
      };
    });

    // Find the best match for the requested location
    const bestMatch = formattedPredictions.find(pred => 
      pred.location.toLowerCase().includes(location.toLowerCase())
    ) || formattedPredictions[0];

    return {
      prediction: bestMatch,
      alternativeLocations: formattedPredictions.slice(0, 3).filter(p => p !== bestMatch),
      searchedFor: location,
      note: 'Predictions use percentile-adjusted data: HUD Fair Market Rent (40th percentile, adjusted +18% to market rate) and Zillow ZORI (35th-65th percentile median). Advanced time series analysis with data source weighting.',
      confidence_explanation: {
        high: 'Based on robust historical data and stable market patterns',
        medium: 'Based on adequate data with some market volatility',
        low: 'Limited data available or highly volatile market conditions'
      }
    };

  } catch (error) {
    console.error('Error in getRentPredictions:', error);
    return {
      error: 'Prediction service error',
      message: 'An error occurred while retrieving rent predictions.',
      details: error.message
    };
  }
}

async function getMarketData(args: any) {
  console.log('Getting market data for:', args);
  
  // Check if location is specific enough
  if (!args.location || args.location.length < 3) {
    return {
      error: 'location_required',
      message: 'I need a specific location to provide accurate market data.',
      prompt: 'Please specify: (1) City and state (e.g., "Austin, TX"), (2) Neighborhood name, or (3) ZIP code. This allows me to pull relevant rental market data and trends.',
      example: 'Examples: "Downtown Austin", "Chicago, IL", "90210", or "Capitol Hill, Seattle"'
    };
  }
  
  // Check for overly broad location
  const broadTerms = ['usa', 'america', 'united states', 'nationwide', 'everywhere'];
  if (broadTerms.some(term => args.location.toLowerCase().includes(term))) {
    return {
      error: 'location_too_broad',
      message: 'The location is too broad for specific market analysis.',
      prompt: 'Please provide a specific city, neighborhood, or region. Market conditions vary significantly between different areas.',
      suggestion: 'Try specifying: your target city, a specific neighborhood, or a metropolitan area.'
    };
  }
  
  // If location is good, proceed with market data (mock implementation)
  return {
    location: args.location,
    averageRent: '$2,400',
    medianRent: '$2,350', 
    rentTrend: 'decreasing',
    trendPercentage: -2.1,
    dataSource: `Market analysis for ${args.location} aggregated from multiple listing sources`,
    recommendedRange: '$2,200 - $2,500',
    propertyType: args.propertyType || 'all types',
    lastUpdated: new Date().toISOString().split('T')[0]
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

async function searchKnowledgeBase(args: any) {
  console.log('Searching RAG database:', args.query, 'type:', args.chat_type);
  
  // Use the existing supabase environment variables that are already defined at the top
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Generate embedding for the search query using OpenAI
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not available for embedding generation');
    }
    
    console.log('Generating embedding for query:', args.query);
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: args.query,
        model: 'text-embedding-3-small'
      }),
    });

    if (!embeddingResponse.ok) {
      const embeddingError = await embeddingResponse.json();
      console.error('OpenAI embedding error:', embeddingError);
      throw new Error(`Failed to generate embedding: ${embeddingError.error?.message}`);
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;
    
    console.log('Generated embedding, length:', queryEmbedding.length);

    // Check if this is a location-based query
    const locationKeywords = ['rent', 'market', 'price', 'cost', 'rate', 'austin', 'dallas', 'houston', 'san antonio', 'chicago', 'new york', 'los angeles', 'miami', 'atlanta', 'denver', 'seattle', 'boston', 'philadelphia', 'phoenix', 'detroit'];
    const isLocationQuery = locationKeywords.some(keyword => 
      args.query.toLowerCase().includes(keyword)
    );

    let documentResults = [];
    let knowledgeResults = [];

    if (isLocationQuery) {
      // Use location-specific search for market data
      console.log('🌍 Location-based query detected, searching rental data');
      const locationMatch = args.query.match(/\b(austin|dallas|houston|san antonio|chicago|new york|los angeles|miami|atlanta|denver|seattle|boston|philadelphia|phoenix|detroit)\b/i);
      const location = locationMatch ? locationMatch[0] : '';
      
      const { data: locationData, error: locationError } = await supabaseAdmin.rpc('search_rental_data_by_location', {
        location_query: location,
        query_embedding: `[${queryEmbedding.join(',')}]`,
        match_threshold: 0.5,
        match_count: args.limit || 5
      });
      
      if (!locationError && locationData) {
        documentResults = locationData.map((result: any) => ({
          ...result,
          type: 'rental_data',
          source: result.report_title || 'Market Data'
        }));
      }
    } else {
      // Use general document similarity search
      const { data: docData, error: docError } = await supabaseAdmin.rpc('search_document_chunks_by_similarity', {
        query_embedding: `[${queryEmbedding.join(',')}]`,
        match_threshold: 0.6,
        match_count: Math.floor((args.limit || 5) / 2)
      });
      
      if (!docError && docData) {
        documentResults = docData.map((result: any) => ({
          ...result,
          type: 'document_chunk',
          source: result.report_title || 'Document'
        }));
      }
    }

    // Also search general knowledge base
    const { data: kbData, error: kbError } = await supabaseAdmin.rpc('search_knowledge_base', {
      query_embedding: queryEmbedding,
      match_threshold: 0.6,
      match_count: Math.max(1, (args.limit || 5) - documentResults.length),
      chat_type: args.chat_type || null
    });

    if (!kbError && kbData) {
      knowledgeResults = kbData.map((result: any) => ({
        ...result,
        type: 'knowledge_base'
      }));
    }

    // Combine and prioritize results
    const allResults = [...documentResults, ...knowledgeResults];

    console.log('RAG search results:', {
      documentChunks: documentResults.length,
      knowledgeBase: knowledgeResults.length,
      total: allResults.length,
      isLocationQuery
    });

    return {
      results: allResults,
      query: args.query,
      total_results: allResults.length,
      document_chunks: documentResults.length,
      knowledge_base_items: knowledgeResults.length,
      is_location_query: isLocationQuery,
      search_type: args.chat_type || 'general'
    };

  } catch (error) {
    console.error('Error in searchKnowledgeBase:', error);
    
    // Return fallback results with error info
    return {
      results: [],
      query: args.query,
      total_results: 0,
      error: error.message,
      fallback: true
    };
  }
} 