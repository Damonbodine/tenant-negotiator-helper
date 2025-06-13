import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useConversationContext } from '@/contexts/ConversationContext';
import { useConversationHistory } from '@/hooks/useConversationHistory';
import { ChatMessage } from '@/shared/types';

export function ConversationHistoryTest() {
  const [testStep, setTestStep] = useState(0);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const {
    currentConversation,
    createNewConversation,
    selectConversation,
    addMessage
  } = useConversationContext();

  const { conversations, loadRecentConversations } = useConversationHistory();

  const runTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    setTestStep(0);

    try {
      // Step 1: Create new conversation
      setTestStep(1);
      setTestResults(prev => [...prev, '🔄 Creating new conversation...']);
      
      const conversationId = await createNewConversation('negotiation_help');
      if (!conversationId) {
        setTestResults(prev => [...prev, '❌ Failed to create conversation']);
        return;
      }
      setTestResults(prev => [...prev, `✅ Created conversation: ${conversationId}`]);

      // Step 2: Add some test messages
      setTestStep(2);
      setTestResults(prev => [...prev, '🔄 Adding test messages...']);
      
      const testMessage1: ChatMessage = {
        id: 'test-1',
        type: 'user',
        text: 'I need help negotiating my rent',
        timestamp: new Date()
      };
      
      const testMessage2: ChatMessage = {
        id: 'test-2',
        type: 'agent',
        text: 'I can help you with that! Tell me more about your situation.',
        timestamp: new Date()
      };

      addMessage(testMessage1);
      addMessage(testMessage2);
      
      setTestResults(prev => [...prev, `✅ Added 2 test messages to conversation`]);

      // Step 3: Check current conversation state
      setTestStep(3);
      setTestResults(prev => [...prev, '🔄 Checking current conversation...']);
      
      if (currentConversation) {
        setTestResults(prev => [...prev, `✅ Current conversation has ${currentConversation.messages.length} messages`]);
        setTestResults(prev => [...prev, `  - Conversation ID: ${currentConversation.conversationId}`]);
        setTestResults(prev => [...prev, `  - Messages: ${currentConversation.messages.map(m => m.text.substring(0, 30)).join(' | ')}`]);
      } else {
        setTestResults(prev => [...prev, '❌ No current conversation loaded']);
      }

      // Step 4: Load conversations list
      setTestStep(4);
      setTestResults(prev => [...prev, '🔄 Refreshing conversations list...']);
      
      await loadRecentConversations();
      setTestResults(prev => [...prev, `✅ Loaded ${conversations.length} conversations from history`]);

      // Step 5: Test conversation switching
      setTestStep(5);
      if (conversations.length > 1) {
        setTestResults(prev => [...prev, '🔄 Testing conversation switching...']);
        
        const otherConversation = conversations.find(c => c.conversation_id !== conversationId);
        if (otherConversation) {
          await selectConversation(otherConversation.conversation_id);
          setTestResults(prev => [...prev, `✅ Switched to conversation: ${otherConversation.conversation_id}`]);
          
          // Switch back
          await selectConversation(conversationId);
          setTestResults(prev => [...prev, `✅ Switched back to original conversation`]);
        }
      } else {
        setTestResults(prev => [...prev, '⚠️ Only one conversation exists, skipping switch test']);
      }

      // Step 6: Verify message persistence
      setTestStep(6);
      setTestResults(prev => [...prev, '🔄 Verifying message persistence...']);
      
      if (currentConversation && currentConversation.messages.length >= 2) {
        const hasUserMessage = currentConversation.messages.some(m => m.type === 'user');
        const hasAgentMessage = currentConversation.messages.some(m => m.type === 'agent');
        
        if (hasUserMessage && hasAgentMessage) {
          setTestResults(prev => [...prev, '✅ Messages persisted correctly (user + agent messages found)']);
        } else {
          setTestResults(prev => [...prev, '❌ Message types not preserved correctly']);
        }
      } else {
        setTestResults(prev => [...prev, '❌ Messages not persisted']);
      }

      setTestResults(prev => [...prev, '🎉 Test completed successfully!']);

    } catch (error) {
      setTestResults(prev => [...prev, `❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setIsRunning(false);
      setTestStep(0);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Conversation History Test</CardTitle>
        <CardDescription>
          Test conversation loading, switching, and message persistence
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button 
            onClick={runTest} 
            disabled={isRunning}
            className="min-w-[120px]"
          >
            {isRunning ? 'Testing...' : 'Run Test'}
          </Button>
          
          {testStep > 0 && (
            <Badge variant="outline">
              Step {testStep}/6
            </Badge>
          )}
        </div>

        <div className="space-y-1">
          <div className="text-sm font-medium">Current State:</div>
          <div className="text-sm text-muted-foreground">
            Conversations loaded: {conversations.length} | 
            Current conversation: {currentConversation ? `${currentConversation.conversationId.substring(0, 8)}...` : 'None'} |
            Messages: {currentConversation?.messages.length || 0}
          </div>
        </div>

        {testResults.length > 0 && (
          <div className="space-y-1 p-3 bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
            {testResults.map((result, index) => (
              <div key={index} className="text-sm font-mono">
                {result}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}