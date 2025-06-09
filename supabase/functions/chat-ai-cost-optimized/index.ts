import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { getCachedEmbedding, cacheEmbedding, getCachedResponse, cacheResponse, getCostAnalytics } from '../_shared/cost-optimizer.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client for rental memory storage
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

console.log('🚀 Cost-Optimized Chat AI Function Started');
console.log('💰 Environment check:', {
  hasOpenAI: !!OPENAI_API_KEY,
  hasSupabaseUrl: !!supabaseUrl,
  hasServiceKey: !!supabaseServiceKey
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      prompt,
      message,
      enableToolCalling = false,
      history = [],
      context = {},
      systemPrompt = `You are an expert rental negotiation assistant with comprehensive market intelligence.

**COST-OPTIMIZED OPERATION:**
This system uses intelligent caching to reduce API costs while maintaining high-quality responses.
- Cached responses for similar queries (85%+ similarity)
- Cached embeddings for duplicate content  
- Smart TTL based on content type
- Real-time cost tracking and optimization

**CORE CAPABILITIES:**
- Universal US market coverage with 86K+ rental records
- Real-time rent predictions and market analysis
- Negotiation strategy generation
- Property comparison and analysis
- Voice practice integration

Provide specific, actionable advice with exact dollar amounts and percentages when available.
Always cite your data sources and confidence levels.`,
      test = false
    } = await req.json();

    // Handle test mode for analytics
    if (test) {
      const analytics = getCostAnalytics();
      return new Response(JSON.stringify({
        testMode: true,
        costOptimization: {
          ...analytics,
          status: 'active',
          estimatedMonthlySavings: analytics.totalSaved * 30, // Rough monthly estimate
          optimizationLevel: analytics.cacheHitRate > 0.4 ? 'excellent' : 
                           analytics.cacheHitRate > 0.2 ? 'good' : 'initializing'
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('💬 Cost-optimized chat called:', { 
      promptLength: prompt?.length,
      messageLength: message?.length,
      enableToolCalling,
      hasContext: !!context,
      userId: context?.userId
    });

    const userMessage = message || prompt;
    if (!userMessage) {
      throw new Error('No message provided');
    }

    // COST OPTIMIZATION: Check response cache first
    console.log('💰 Checking response cache...');
    const cachedResponse = getCachedResponse(userMessage, systemPrompt);
    
    if (cachedResponse.cached && cachedResponse.response) {
      console.log(`💰 MASSIVE SAVINGS: Used cached response, saved $${cachedResponse.costSaved.toFixed(4)}`);
      
      return new Response(JSON.stringify({ 
        text: cachedResponse.response,
        model: 'gpt-4-1106-preview',
        cached: true,
        costSaved: cachedResponse.costSaved,
        source: 'cache'
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase clients
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabaseUser = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const userId = context?.userId;
    let knowledgeBaseContext = '';

    // COST-OPTIMIZED RAG: Only for queries that need market data
    const needsMarketData = userMessage.toLowerCase().includes('market') || 
                           userMessage.toLowerCase().includes('rent') ||
                           userMessage.toLowerCase().includes('price') ||
                           userMessage.toLowerCase().includes('negotiate');

    if (needsMarketData && userMessage.length > 10) {
      console.log('💰 Market data needed - checking embedding cache...');
      
      // Try cached embedding first
      const cachedEmbedding = await getCachedEmbedding(userMessage);
      let messageEmbedding: number[];

      if (cachedEmbedding.cached && cachedEmbedding.embedding) {
        messageEmbedding = cachedEmbedding.embedding;
        console.log(`💰 Used cached embedding, saved $${cachedEmbedding.costSaved.toFixed(4)}`);
      } else {
        console.log('💸 Generating new embedding...');
        // Generate new embedding
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
          messageEmbedding = embeddingData.data[0].embedding;
          
          // Cache for future use
          cacheEmbedding(userMessage, messageEmbedding);
          console.log('💾 Cached new embedding for future savings');
        } else {
          throw new Error('Failed to generate embedding');
        }
      }

      // Quick RAG search with timeout
      try {
        const searchPromise = supabaseAdmin.rpc('search_document_chunks_by_similarity', {
          query_embedding: `[${messageEmbedding.join(',')}]`,
          match_threshold: 0.4,
          match_count: 4 // Reduced for cost optimization
        });

        const { data: ragResults, error: ragError } = await Promise.race([
          searchPromise,
          new Promise<{data: null, error: any}>((resolve) => 
            setTimeout(() => resolve({data: null, error: {message: 'Search timeout'}}), 3000)
          )
        ]);

        if (!ragError && ragResults && ragResults.length > 0) {
          const relevantContent = ragResults.map((result: any, index: number) => 
            `${index + 1}. ${result.content}`
          ).join('\n\n');
          
          knowledgeBaseContext = `\n\n## Market Intelligence\n${relevantContent}\n\nUse this data to provide specific, actionable insights.`;
          console.log('✅ RAG context loaded:', ragResults.length, 'chunks');
        }
      } catch (error) {
        console.log('⚠️ RAG search failed (non-blocking):', error);
      }
    }

    // Prepare enhanced system prompt
    const enhancedSystemPrompt = systemPrompt + knowledgeBaseContext;

    // Call OpenAI with timeout
    console.log('🤖 Calling OpenAI (cost-optimized)...');
    const requestBody = {
      model: 'gpt-4-1106-preview',
      messages: [
        { role: 'system', content: enhancedSystemPrompt },
        ...history,
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 3000, // Reduced for cost optimization
    };

    const openAIRequest = fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    // 20-second timeout for cost control
    const response = await Promise.race([
      openAIRequest,
      new Promise<Response>((_, reject) => 
        setTimeout(() => reject(new Error('OpenAI timeout')), 20000)
      )
    ]);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API error');
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message;
    const text = aiMessage?.content || "";

    // COST OPTIMIZATION: Cache the response for future similar queries
    if (text && text.length > 50) {
      cacheResponse(userMessage, systemPrompt, text);
      console.log('💾 Cached response for future cost savings');
    }

    // Store in rental memory (simplified for cost optimization)
    if (userId && userMessage && text) {
      try {
        console.log('💾 Storing in rental memory...');
        const { data: conversation, error: convError } = await supabaseAdmin
          .from('rental_conversations')
          .insert({
            user_id: userId,
            conversation_type: 'general_advice',
            conversation_intent: { 
              cost_optimized: true,
              cached_response: false,
              ai_model: data.model 
            },
            context_properties: [],
            key_insights: [],
            action_items: [],
            follow_up_needed: false
          })
          .select()
          .single();

        if (!convError && conversation) {
          // Store messages
          await Promise.all([
            supabaseAdmin.from('rental_messages').insert({
              conversation_id: conversation.id,
              role: 'user',
              content: userMessage,
              referenced_properties: [],
              generated_insights: { timestamp: new Date().toISOString() }
            }),
            supabaseAdmin.from('rental_messages').insert({
              conversation_id: conversation.id,
              role: 'assistant',
              content: text,
              referenced_properties: [],
              generated_insights: { 
                ai_model: data.model,
                cost_optimized: true,
                timestamp: new Date().toISOString() 
              },
              model_used: data.model
            })
          ]);
          console.log('✅ Stored in rental memory');
        }
      } catch (error) {
        console.log('⚠️ Memory storage failed (non-blocking):', error);
      }
    }

    // Get final cost analytics
    const analytics = getCostAnalytics();

    return new Response(JSON.stringify({ 
      text,
      model: data.model,
      cached: false,
      costOptimization: {
        totalSavedThisSession: analytics.totalSaved,
        cacheHitRate: analytics.cacheHitRate,
        estimatedCostThisRequest: userMessage.length * 0.000075 // Rough estimate
      },
      hasKnowledgeBase: !!knowledgeBaseContext,
      storedInMemory: !!(userId && userMessage && text)
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('💸 Error in cost-optimized chat:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      suggestion: 'Cost optimization may have failed - falling back to standard processing'
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});