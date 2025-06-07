import React from 'react';
import { Card } from '@/shared/ui/card';
import { VisualArtifact } from '@/shared/types/artifacts';

interface RentTrendChartProps {
  data: any;
  artifact: VisualArtifact;
}

const RentTrendChart: React.FC<RentTrendChartProps> = ({ data, artifact }) => {
  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Rent Trend Chart</h3>
      <div className="h-64 flex items-center justify-center bg-muted/50 rounded-lg">
        <p className="text-muted-foreground">Chart visualization coming soon...</p>
      </div>
    </Card>
  );
};

export default RentTrendChart;