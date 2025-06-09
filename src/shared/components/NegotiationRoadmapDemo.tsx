import React, { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/components/ui/label';
import { negotiationRoadmapClient } from '@/shared/services/negotiationRoadmapClient';
import { negotiationTrigger } from '@/shared/services/negotiationTriggerService';

export const NegotiationRoadmapDemo: React.FC = () => {
  const [currentRent, setCurrentRent] = useState<number>(2500);
  const [targetReduction, setTargetReduction] = useState<number>(200);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [testMessage, setTestMessage] = useState<string>('I need help negotiating my $2500/month rent down by $200. How should I approach my landlord?');

  const handleGenerateRoadmap = async () => {
    setIsGenerating(true);
    try {
      await negotiationRoadmapClient.generateBasicRoadmap({
        currentRent,
        targetRent: currentRent - targetReduction,
        location: 'New York, NY',
        landlordType: 'individual',
        userTone: 'collaborative'
      });
    } catch (error) {
      console.error('Failed to generate roadmap:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTestTrigger = async () => {
    setIsGenerating(true);
    try {
      await negotiationTrigger.processPotentialTrigger(testMessage);
    } catch (error) {
      console.error('Failed to trigger roadmap:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>🗺️ Negotiation Roadmap Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Manual Generation */}
          <div className="space-y-4">
            <h3 className="font-semibold">Manual Generation</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currentRent">Current Rent ($)</Label>
                <Input
                  id="currentRent"
                  type="number"
                  value={currentRent}
                  onChange={(e) => setCurrentRent(Number(e.target.value))}
                />
              </div>
              
              <div>
                <Label htmlFor="targetReduction">Target Reduction ($)</Label>
                <Input
                  id="targetReduction"
                  type="number"
                  value={targetReduction}
                  onChange={(e) => setTargetReduction(Number(e.target.value))}
                />
              </div>
            </div>
            
            <Button 
              onClick={handleGenerateRoadmap} 
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? 'Generating...' : 'Generate Roadmap'}
            </Button>
          </div>

          {/* Trigger Test */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Conversation Trigger Test</h3>
            
            <div>
              <Label htmlFor="testMessage">Test Message</Label>
              <Input
                id="testMessage"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Enter a message that should trigger roadmap generation..."
              />
            </div>
            
            <Button 
              onClick={handleTestTrigger} 
              disabled={isGenerating}
              variant="outline"
              className="w-full"
            >
              {isGenerating ? 'Testing...' : 'Test Trigger'}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p><strong>How to test:</strong></p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Click "Generate Roadmap" to create a roadmap manually</li>
              <li>Or modify the test message and click "Test Trigger" to test conversation-based triggering</li>
              <li>Check the artifact panel on the right to see the generated roadmap</li>
              <li>Open browser console to see detailed logs</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};