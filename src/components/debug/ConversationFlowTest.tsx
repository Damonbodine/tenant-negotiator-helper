import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useConversationHistory } from '@/hooks/useConversationHistory';
import { chatService } from '@/shared/services/chatService';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/shared/types';
import { Play, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  data?: any;
  duration?: number;
}

export function ConversationFlowTest() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'User Authentication', status: 'pending' },
    { name: 'Create New Conversation', status: 'pending' },
    { name: 'Send First Message', status: 'pending' },
    { name: 'Verify Conversation ID', status: 'pending' },
    { name: 'Send Follow-up Message', status: 'pending' },
    { name: 'Verify Message Continuity', status: 'pending' },
    { name: 'Database Persistence', status: 'pending' },
    { name: 'Conversation Retrieval', status: 'pending' },
    { name: 'No Infinite Loops', status: 'pending' },
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const conversationIdRef = useRef<string | null>(null);
  const messageCountRef = useRef(0);
  const startTimeRef = useRef<number>(0);

  const {
    conversations,
    startNewConversation,
    addMessageToConversation,
    loadRecentConversations,
    loadConversation
  } = useConversationHistory();

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests(prev => prev.map((test, i) => 
      i === index ? { ...test, ...updates } : test
    ));
  };

  const runComprehensiveTest = async () => {
    setIsRunning(true);
    setProgress(0);
    startTimeRef.current = Date.now();
    
    // Reset all tests
    setTests(prev => prev.map(test => ({ ...test, status: 'pending', message: undefined, data: undefined })));

    try {
      // Test 1: User Authentication
      updateTest(0, { status: 'running' });
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        updateTest(0, { status: 'failed', message: 'User not authenticated' });
        return;
      }
      updateTest(0, { status: 'passed', message: `User: ${session.user.email}`, data: { userId: session.user.id } });
      setProgress(11);

      // Test 2: Create New Conversation
      updateTest(1, { status: 'running' });
      const newConversationId = await startNewConversation('negotiation_help');
      if (!newConversationId) {
        updateTest(1, { status: 'failed', message: 'Failed to create conversation' });
        return;
      }
      conversationIdRef.current = newConversationId;
      updateTest(1, { status: 'passed', message: `ID: ${newConversationId}`, data: { conversationId: newConversationId } });
      setProgress(22);

      // Test 3: Send First Message
      updateTest(2, { status: 'running' });
      const testMessage1 = "Hello, I need help negotiating my rent. It's $2500/month and I think it's too high.";
      const messages: ChatMessage[] = [{
        id: '1',
        type: 'user',
        text: testMessage1,
        timestamp: new Date()
      }];

      const response1 = await chatService.sendMessageToGemini(testMessage1, messages, conversationIdRef.current);
      if (!response1.text) {
        updateTest(2, { status: 'failed', message: 'No response received' });
        return;
      }
      messageCountRef.current = 1;
      updateTest(2, { status: 'passed', message: `Response: ${response1.text.substring(0, 100)}...`, data: response1 });
      setProgress(33);

      // Test 4: Verify Conversation ID
      updateTest(3, { status: 'running' });
      if (response1.conversationId !== conversationIdRef.current) {
        updateTest(3, { status: 'failed', message: `ID mismatch: ${response1.conversationId} vs ${conversationIdRef.current}` });
        return;
      }
      updateTest(3, { status: 'passed', message: 'Conversation ID maintained', data: { conversationId: response1.conversationId } });
      setProgress(44);

      // Test 5: Send Follow-up Message
      updateTest(4, { status: 'running' });
      const testMessage2 = "What specific strategies would you recommend for my situation?";
      const updatedMessages: ChatMessage[] = [
        ...messages,
        { id: '2', type: 'agent', text: response1.text, timestamp: new Date() },
        { id: '3', type: 'user', text: testMessage2, timestamp: new Date() }
      ];

      const response2 = await chatService.sendMessageToGemini(testMessage2, updatedMessages, conversationIdRef.current);
      if (!response2.text) {
        updateTest(4, { status: 'failed', message: 'No response to follow-up' });
        return;
      }
      messageCountRef.current = 2;
      updateTest(4, { status: 'passed', message: `Follow-up response: ${response2.text.substring(0, 100)}...`, data: response2 });
      setProgress(55);

      // Test 6: Verify Message Continuity
      updateTest(5, { status: 'running' });
      if (response2.conversationId !== conversationIdRef.current) {
        updateTest(5, { status: 'failed', message: 'Conversation ID changed between messages' });
        return;
      }
      updateTest(5, { status: 'passed', message: 'Message continuity maintained' });
      setProgress(66);

      // Test 7: Database Persistence
      updateTest(6, { status: 'running' });
      const { data: dbConversation, error: dbError } = await supabase
        .from('rental_conversations')
        .select('*, rental_messages(*)')
        .eq('id', conversationIdRef.current)
        .single();

      if (dbError || !dbConversation) {
        updateTest(6, { status: 'failed', message: `DB error: ${dbError?.message}` });
        return;
      }
      updateTest(6, { status: 'passed', message: `${dbConversation.rental_messages?.length || 0} messages in DB`, data: dbConversation });
      setProgress(77);

      // Test 8: Conversation Retrieval
      updateTest(7, { status: 'running' });
      await loadRecentConversations();
      const retrievedConversation = await loadConversation(conversationIdRef.current);
      if (!retrievedConversation) {
        updateTest(7, { status: 'failed', message: 'Could not retrieve conversation' });
        return;
      }
      updateTest(7, { status: 'passed', message: `Retrieved ${retrievedConversation.messages.length} messages`, data: retrievedConversation });
      setProgress(88);

      // Test 9: No Infinite Loops (check for reasonable response times and no excessive calls)
      updateTest(8, { status: 'running' });
      const totalTime = Date.now() - startTimeRef.current;
      const averageResponseTime = totalTime / messageCountRef.current;
      
      if (totalTime > 30000) { // 30 seconds total
        updateTest(8, { status: 'failed', message: `Total test time too long: ${totalTime}ms` });
        return;
      }
      
      if (averageResponseTime > 10000) { // 10 seconds per message
        updateTest(8, { status: 'failed', message: `Average response time too slow: ${averageResponseTime}ms` });
        return;
      }

      updateTest(8, { status: 'passed', message: `Total: ${totalTime}ms, Avg: ${Math.round(averageResponseTime)}ms/msg` });
      setProgress(100);

    } catch (error) {
      const currentTest = tests.findIndex(t => t.status === 'running');
      if (currentTest >= 0) {
        updateTest(currentTest, { status: 'failed', message: error instanceof Error ? error.message : 'Unknown error' });
      }
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const passedTests = tests.filter(t => t.status === 'passed').length;
  const failedTests = tests.filter(t => t.status === 'failed').length;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Conversation Flow Integration Test
        </CardTitle>
        <CardDescription>
          Comprehensive test to verify end-to-end conversation functionality and prevent infinite loops
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button 
            onClick={runComprehensiveTest} 
            disabled={isRunning}
            className="min-w-[120px]"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Test
              </>
            )}
          </Button>
          
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-green-50">
              ✅ {passedTests} Passed
            </Badge>
            <Badge variant="outline" className="bg-red-50">
              ❌ {failedTests} Failed
            </Badge>
          </div>
          
          {isRunning && (
            <div className="flex-1">
              <Progress value={progress} className="w-full" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          {tests.map((test, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(test.status)}
                <span className="font-medium">{test.name}</span>
                <Badge className={getStatusColor(test.status)}>
                  {test.status}
                </Badge>
              </div>
              {test.message && (
                <span className="text-sm text-gray-600 max-w-md truncate">
                  {test.message}
                </span>
              )}
            </div>
          ))}
        </div>

        {!isRunning && (passedTests > 0 || failedTests > 0) && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Test Summary</h3>
            <p className="text-sm text-gray-600">
              {failedTests === 0 
                ? "🎉 All tests passed! Your conversation flow is working correctly."
                : `⚠️ ${failedTests} test(s) failed. Please review the failures above.`
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}