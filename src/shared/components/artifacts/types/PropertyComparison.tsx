import React from 'react';
import { Card } from '@/shared/ui/card';
import { VisualArtifact } from '@/shared/types/artifacts';

interface PropertyComparisonProps {
  data: any;
  artifact: VisualArtifact;
}

const PropertyComparison: React.FC<PropertyComparisonProps> = ({ data, artifact }) => {
  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Property Comparison</h3>
      <div className="h-64 flex items-center justify-center bg-muted/50 rounded-lg">
        <p className="text-muted-foreground">Property comparison table coming soon...</p>
      </div>
    </Card>
  );
};

export default PropertyComparison;