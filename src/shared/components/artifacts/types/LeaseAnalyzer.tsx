import React from 'react';
import { Card } from '@/shared/ui/card';
import { VisualArtifact } from '@/shared/types/artifacts';

interface LeaseAnalyzerProps {
  data: any;
  artifact: VisualArtifact;
}

const LeaseAnalyzer: React.FC<LeaseAnalyzerProps> = ({ data, artifact }) => {
  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Lease Analyzer</h3>
      <div className="h-64 flex items-center justify-center bg-muted/50 rounded-lg">
        <p className="text-muted-foreground">Lease analysis tool coming soon...</p>
      </div>
    </Card>
  );
};

export default LeaseAnalyzer;