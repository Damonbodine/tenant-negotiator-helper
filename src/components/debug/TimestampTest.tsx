import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useConversationHistory } from '@/hooks/useConversationHistory';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

export function TimestampTest() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { startNewConversation, loadRecentConversations } = useConversationHistory();

  const runTimestampTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      // Test 1: Create new conversation
      setTestResults(prev => [...prev, { step: 'Creating new conversation...', status: 'running' }]);
      
      const conversationId = await startNewConversation('negotiation_help');
      if (!conversationId) {
        setTestResults(prev => [...prev, { step: 'Create conversation', status: 'failed', message: 'No conversation ID returned' }]);
        return;
      }

      setTestResults(prev => [...prev, { step: 'Create conversation', status: 'success', message: `ID: ${conversationId}` }]);

      // Test 2: Check database directly
      setTestResults(prev => [...prev, { step: 'Checking database...', status: 'running' }]);
      
      const { data: dbData, error: dbError } = await supabase
        .from('rental_conversations')
        .select('id, created_at, updated_at, conversation_type')
        .eq('id', conversationId)
        .single();

      if (dbError) {
        setTestResults(prev => [...prev, { step: 'Check database', status: 'failed', message: dbError.message }]);
        return;
      }

      const hasValidTimestamps = !!(dbData.created_at && dbData.updated_at);
      setTestResults(prev => [...prev, { 
        step: 'Check database', 
        status: hasValidTimestamps ? 'success' : 'failed',
        message: hasValidTimestamps 
          ? `created_at: ${dbData.created_at}, updated_at: ${dbData.updated_at}`
          : `NULL timestamps - created_at: ${dbData.created_at}, updated_at: ${dbData.updated_at}`
      }]);

      // Test 3: Test RPC function
      setTestResults(prev => [...prev, { step: 'Testing RPC function...', status: 'running' }]);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setTestResults(prev => [...prev, { step: 'Test RPC', status: 'failed', message: 'Not authenticated' }]);
        return;
      }

      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_user_recent_conversations', { 
          p_user_id: session.user.id,
          conversation_limit: 5 
        });

      if (rpcError) {
        setTestResults(prev => [...prev, { step: 'Test RPC', status: 'failed', message: rpcError.message }]);
        return;
      }

      const ourConversation = rpcData.find((c: any) => c.conversation_id === conversationId);
      const rpcHasValidTimestamp = !!(ourConversation?.created_at);
      
      setTestResults(prev => [...prev, { 
        step: 'Test RPC', 
        status: rpcHasValidTimestamp ? 'success' : 'failed',
        message: rpcHasValidTimestamp 
          ? `RPC returned: ${ourConversation.created_at}`
          : `RPC returned NULL/undefined: ${ourConversation?.created_at}`
      }]);

      // Test 4: Test frontend parsing
      setTestResults(prev => [...prev, { step: 'Testing frontend parsing...', status: 'running' }]);
      
      await loadRecentConversations();
      
      setTestResults(prev => [...prev, { 
        step: 'Frontend parsing', 
        status: 'success',
        message: 'Check conversation list for proper date display'
      }]);

    } catch (error) {
      setTestResults(prev => [...prev, { 
        step: 'Test failed', 
        status: 'failed', 
        message: error instanceof Error ? error.message : 'Unknown error'
      }]);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Timestamp Fix Test</CardTitle>
        <CardDescription>
          Test if conversation timestamps are working properly after the fix
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runTimestampTest} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? 'Testing...' : 'Run Timestamp Test'}
        </Button>

        {testResults.length > 0 && (
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">{result.step}</span>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(result.status)}>
                    {result.status}
                  </Badge>
                  {result.message && (
                    <span className="text-sm text-gray-600 max-w-xs truncate">
                      {result.message}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}