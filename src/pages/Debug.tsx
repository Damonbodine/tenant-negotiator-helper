import { TimestampTest } from '@/components/debug/TimestampTest';
import { ConversationFlowTest } from '@/components/debug/ConversationFlowTest';
import { ConversationDebugPanel } from '@/components/debug/ConversationDebugPanel';
import { ConversationHistoryTest } from '@/components/debug/ConversationHistoryTest';

export default function Debug() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Debug Panel</h1>
        <p className="text-muted-foreground">Test conversation memory and timestamp functionality</p>
      </div>
      
      <div className="grid gap-8">
        <ConversationHistoryTest />
        <TimestampTest />
        <ConversationDebugPanel />
        <ConversationFlowTest />
      </div>
    </div>
  );
}