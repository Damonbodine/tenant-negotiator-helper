import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, FileText, MessageSquare, TrendingUp, Eye, Download, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Conversation {
  id: string;
  title: string;
  conversation_type: string;
  created_at: string;
  updated_at: string;
  context: any;
  messageCount?: number;
}

interface ConversationDetails {
  conversation: Conversation;
  messages: any[];
  summary?: string;
  transcript?: string;
}

export function ConversationHistory() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  // Load user's voice practice conversations
  useEffect(() => {
    if (!user?.id) return;

    const loadConversations = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('rental_conversations')
          .select('*')
          .eq('user_id', user.id)
          .eq('conversation_type', 'voice_practice')
          .order('updated_at', { ascending: false });

        if (error) {
          console.error('Error loading conversations:', error);
          return;
        }

        setConversations(data || []);
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [user?.id]);

  // Load conversation details (messages, summary, transcript)
  const loadConversationDetails = async (conversationId: string) => {
    setDetailsLoading(true);
    try {
      // Load conversation
      const { data: conversationData, error: conversationError } = await (supabase as any)
        .from('rental_conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (conversationError) {
        console.error('Error loading conversation:', conversationError);
        return;
      }

      // Load all messages
      const { data: messagesData, error: messagesError } = await (supabase as any)
        .from('rental_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error loading messages:', messagesError);
        return;
      }

      // Separate regular messages from summary/transcript
      const regularMessages = messagesData?.filter(msg => 
        msg.metadata?.messageType !== 'summary' && msg.metadata?.messageType !== 'transcript'
      ) || [];

      const summaryMessage = messagesData?.find(msg => 
        msg.metadata?.messageType === 'summary'
      );

      const transcriptMessage = messagesData?.find(msg => 
        msg.metadata?.messageType === 'transcript'
      );

      setSelectedConversation({
        conversation: conversationData,
        messages: regularMessages,
        summary: summaryMessage?.content,
        transcript: transcriptMessage?.content
      });

    } catch (error) {
      console.error('Error loading conversation details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Generate summary for conversation that doesn't have one
  const generateSummary = async (conversationId: string) => {
    if (!user?.id) return;

    setGeneratingSummary(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-conversation-summaries', {
        body: { 
          conversationId,
          userId: user.id
        }
      });

      if (error) {
        console.error('Error generating summary:', error);
        alert('Failed to generate summary. Please try again.');
        return;
      }

      // Refresh the conversation details if this is the selected conversation
      if (selectedConversation?.conversation.id === conversationId) {
        await loadConversationDetails(conversationId);
      }

      // Refresh the conversations list to update the badges
      const { data: updatedConversations, error: listError } = await (supabase as any)
        .from('rental_conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('conversation_type', 'voice_practice')
        .order('updated_at', { ascending: false });

      if (!listError && updatedConversations) {
        setConversations(updatedConversations);
      }

    } catch (error) {
      console.error('Error generating summary:', error);
      alert('Failed to generate summary. Please try again.');
    } finally {
      setGeneratingSummary(false);
    }
  };

  // Download transcript as text file
  const downloadTranscript = (conversation: Conversation, transcript: string) => {
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice-practice-transcript-${conversation.created_at.split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Conversation History...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sign In Required</CardTitle>
          <CardDescription>
            Please sign in to view your conversation history and summaries.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Voice Practice History
          </CardTitle>
          <CardDescription>
            View transcripts, summaries, and analysis of your negotiation practice sessions
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {conversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Practice Sessions Yet</h3>
              <p className="text-gray-500">
                Start a voice practice session to see transcripts and summaries here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {conversations.map((conversation) => (
                <Card key={conversation.id} className="cursor-pointer hover:bg-gray-50" 
                      onClick={() => loadConversationDetails(conversation.id)}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium">{conversation.title}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(conversation.created_at).toLocaleDateString()}
                          </span>
                          {conversation.context?.scenario && (
                            <Badge variant="outline" className="text-xs">
                              {conversation.context.scenario}
                            </Badge>
                          )}
                          {conversation.context?.messageCount && (
                            <span>{conversation.context.messageCount} messages</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {conversation.context?.hasSummary && (
                          <Badge variant="secondary" className="text-xs">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Summary
                          </Badge>
                        )}
                        {conversation.context?.hasTranscript && (
                          <Badge variant="secondary" className="text-xs">
                            <FileText className="h-3 w-3 mr-1" />
                            Transcript
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversation Details Modal/Panel */}
      {selectedConversation && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{selectedConversation.conversation.title}</CardTitle>
                <CardDescription>
                  {new Date(selectedConversation.conversation.created_at).toLocaleString()}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {!selectedConversation.summary && (
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => generateSummary(selectedConversation.conversation.id)}
                    disabled={generatingSummary}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {generatingSummary ? 'Generating...' : 'Generate Summary'}
                  </Button>
                )}
                {selectedConversation.transcript && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => downloadTranscript(selectedConversation.conversation, selectedConversation.transcript!)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setSelectedConversation(null)}>
                  Close
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {detailsLoading ? (
              <div className="text-center py-8">Loading conversation details...</div>
            ) : (
              <Tabs defaultValue="summary" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="summary" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Summary
                  </TabsTrigger>
                  <TabsTrigger value="transcript" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Full Transcript
                  </TabsTrigger>
                  <TabsTrigger value="messages" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Messages
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="space-y-4">
                  {selectedConversation.summary ? (
                    <ScrollArea className="h-96 w-full border rounded-lg p-4">
                      <div className="prose prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                          {selectedConversation.summary}
                        </pre>
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No summary available for this conversation.
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="transcript" className="space-y-4">
                  {selectedConversation.transcript ? (
                    <ScrollArea className="h-96 w-full border rounded-lg p-4">
                      <div className="font-mono text-sm">
                        <pre className="whitespace-pre-wrap">
                          {selectedConversation.transcript}
                        </pre>
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No transcript available for this conversation.
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="messages" className="space-y-4">
                  <ScrollArea className="h-96 w-full">
                    <div className="space-y-3">
                      {selectedConversation.messages.map((message, index) => (
                        <div
                          key={message.id}
                          className={`p-3 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-blue-50 border-l-4 border-blue-500 ml-4'
                              : 'bg-green-50 border-l-4 border-green-500 mr-4'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium">
                              {message.role === 'user' ? 'You' : 'AI Landlord'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(message.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm">{message.content}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}