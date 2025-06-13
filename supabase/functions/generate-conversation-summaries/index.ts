import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    // Ensure we're only accepting POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { conversationId, userId } = await req.json()

    if (!conversationId || !userId) {
      return new Response(
        JSON.stringify({ error: 'conversationId and userId are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get conversation details
    const { data: conversation, error: conversationError } = await supabaseClient
      .from('rental_conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single()

    if (conversationError || !conversation) {
      return new Response(
        JSON.stringify({ error: 'Conversation not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get all messages for this conversation (excluding existing summaries/transcripts)
    const { data: messages, error: messagesError } = await supabaseClient
      .from('rental_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .not('metadata->>messageType', 'eq', 'summary')
      .not('metadata->>messageType', 'eq', 'transcript')
      .order('created_at', { ascending: true })

    if (messagesError || !messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No messages found for conversation' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Generate transcript
    const transcript = messages.map((msg) => {
      const speaker = msg.role === 'user' ? 'Renter' : 'AI Landlord'
      const timestamp = new Date(msg.created_at).toLocaleTimeString()
      return `[${timestamp}] ${speaker}: ${msg.content}`
    }).join('\n\n')

    // Generate AI summary using OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const summaryPrompt = `Please analyze this voice practice negotiation session and provide a structured summary:

CONVERSATION TRANSCRIPT:
${transcript}

SCENARIO: ${conversation.context?.scenario || 'Random negotiation scenario'}

Please provide:
1. **Session Overview**: Brief description of what was negotiated
2. **Key Points Discussed**: Main topics and arguments
3. **Negotiation Strategies Used**: What tactics the renter tried
4. **AI Feedback**: Strengths and areas for improvement
5. **Outcomes**: Any agreements or next steps mentioned
6. **Learning Opportunities**: Specific suggestions for future practice

Keep the summary concise but comprehensive, focusing on the renter's performance and learning.`

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are an expert negotiation coach analyzing practice sessions.' },
          { role: 'user', content: summaryPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    })

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text()
      console.error('OpenAI API error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to generate summary' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const openaiData = await openaiResponse.json()
    const summary = openaiData.choices[0]?.message?.content || 'Summary generation failed'

    // Save summary and transcript to database
    const { error: summaryError } = await supabaseClient
      .from('rental_messages')
      .insert({
        conversation_id: conversationId,
        role: 'system',
        content: summary,
        metadata: {
          messageType: 'summary',
          practiceMode: 'voice',
          scenario: conversation.context?.scenario,
          timestamp: new Date().toISOString(),
          messageCount: messages.length,
          generatedBy: 'edge-function'
        }
      })

    const { error: transcriptError } = await supabaseClient
      .from('rental_messages')
      .insert({
        conversation_id: conversationId,
        role: 'system',
        content: transcript,
        metadata: {
          messageType: 'transcript',
          practiceMode: 'voice',
          scenario: conversation.context?.scenario,
          timestamp: new Date().toISOString(),
          messageCount: messages.length,
          generatedBy: 'edge-function'
        }
      })

    // Update conversation context
    const { error: updateError } = await supabaseClient
      .from('rental_conversations')
      .update({
        context: {
          ...conversation.context,
          hasSummary: true,
          hasTranscript: true,
          summaryGenerated: new Date().toISOString()
        }
      })
      .eq('id', conversationId)

    if (summaryError || transcriptError || updateError) {
      console.error('Database errors:', { summaryError, transcriptError, updateError })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        summary, 
        transcript,
        messageCount: messages.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in generate-conversation-summaries function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})