import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useConversationHistory } from '@/hooks/useConversationHistory';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Database, MessageSquare, User } from 'lucide-react';

export function ConversationDebugPanel() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isDebugging, setIsDebugging] = useState(false);
  const { conversations, isLoading, error, loadRecentConversations } = useConversationHistory();

  const runDiagnostics = async () => {
    setIsDebugging(true);
    const info: any = {
      timestamp: new Date().toISOString(),
      frontend: {},
      database: {},
      rpc: {}
    };

    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      info.user = {
        authenticated: !!session?.user,
        userId: session?.user?.id || 'none'
      };

      if (session?.user) {
        const userId = session.user.id;

        // Test direct database access
        const { data: dbConversations, error: dbError } = await supabase
          .from('rental_conversations')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        info.database = {
          directQuery: {
            success: !dbError,
            error: dbError?.message,
            count: dbConversations?.length || 0,
            conversations: dbConversations?.slice(0, 3) || []
          }
        };

        // Test RPC function
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('get_user_recent_conversations', { 
            p_user_id: userId, 
            conversation_limit: 20 
          });

        info.rpc = {
          success: !rpcError,
          error: rpcError?.message,
          count: rpcData?.length || 0,
          data: rpcData?.slice(0, 3) || []
        };

        // Test messages
        const { data: dbMessages, error: msgError } = await supabase
          .from('rental_messages')
          .select(`
            id, conversation_id, role, content,
            rental_conversations!inner(user_id)
          `)
          .eq('rental_conversations.user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);

        info.database.messages = {
          success: !msgError,
          error: msgError?.message,
          count: dbMessages?.length || 0
        };
      }

      // Frontend hook info
      info.frontend = {
        hookLoading: isLoading,
        hookError: error,
        hookConversations: conversations.length,
        conversations: conversations.slice(0, 3)
      };

    } catch (err) {
      info.error = err instanceof Error ? err.message : 'Unknown error';
    }

    setDebugInfo(info);
    setIsDebugging(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, [conversations]);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Conversation History Debug Panel
        </CardTitle>
        <CardDescription>
          Diagnose why conversation history isn't showing up
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runDiagnostics} 
            disabled={isDebugging}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isDebugging ? 'animate-spin' : ''}`} />
            Run Diagnostics
          </Button>
          <Button 
            onClick={loadRecentConversations} 
            variant="outline"
          >
            Reload Conversations
          </Button>
        </div>

        {debugInfo.timestamp && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* User Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  User Status
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-xs space-y-1">
                  <div>Auth: {debugInfo.user?.authenticated ? '✅' : '❌'}</div>
                  <div>ID: {debugInfo.user?.userId?.substring(0, 8)}...</div>
                </div>
              </CardContent>
            </Card>

            {/* Database Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Database
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-xs space-y-1">
                  <div>Conversations: {debugInfo.database?.directQuery?.success ? '✅' : '❌'} ({debugInfo.database?.directQuery?.count || 0})</div>
                  <div>Messages: {debugInfo.database?.messages?.success ? '✅' : '❌'} ({debugInfo.database?.messages?.count || 0})</div>
                  <div>RPC: {debugInfo.rpc?.success ? '✅' : '❌'} ({debugInfo.rpc?.count || 0})</div>
                  {(debugInfo.database?.directQuery?.error || debugInfo.rpc?.error) && (
                    <div className="text-red-500 text-xs mt-1">
                      {debugInfo.database?.directQuery?.error || debugInfo.rpc?.error}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Frontend Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Frontend Hook
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-xs space-y-1">
                  <div>Loading: {debugInfo.frontend?.hookLoading ? '🔄' : '✅'}</div>
                  <div>Error: {debugInfo.frontend?.hookError ? '❌' : '✅'}</div>
                  <div>Count: {debugInfo.frontend?.hookConversations || 0}</div>
                  {debugInfo.frontend?.hookError && (
                    <div className="text-red-500 text-xs mt-1">
                      {debugInfo.frontend.hookError}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Detailed Data */}
        {debugInfo.database?.directQuery?.conversations?.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Sample Database Conversations</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <pre className="text-xs overflow-auto max-h-40 bg-gray-50 p-2 rounded">
                {JSON.stringify(debugInfo.database.directQuery.conversations, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {debugInfo.rpc?.data?.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Sample RPC Results</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <pre className="text-xs overflow-auto max-h-40 bg-gray-50 p-2 rounded">
                {JSON.stringify(debugInfo.rpc.data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}