import React from 'react';
import { Card } from '@/shared/ui/card';
import { VisualArtifact } from '@/shared/types/artifacts';

interface NeighborhoodInsightsProps {
  data: any;
  artifact: VisualArtifact;
}

const NeighborhoodInsights: React.FC<NeighborhoodInsightsProps> = ({ data, artifact }) => {
  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Neighborhood Insights</h3>
      <div className="h-64 flex items-center justify-center bg-muted/50 rounded-lg">
        <p className="text-muted-foreground">Neighborhood analysis coming soon...</p>
      </div>
    </Card>
  );
};

export default NeighborhoodInsights;