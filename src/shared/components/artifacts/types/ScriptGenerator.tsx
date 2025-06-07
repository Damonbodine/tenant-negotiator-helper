import React from 'react';
import { Card } from '@/shared/ui/card';
import { VisualArtifact } from '@/shared/types/artifacts';

interface ScriptGeneratorProps {
  data: any;
  artifact: VisualArtifact;
}

const ScriptGenerator: React.FC<ScriptGeneratorProps> = ({ data, artifact }) => {
  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Script Generator</h3>
      <div className="h-64 flex items-center justify-center bg-muted/50 rounded-lg">
        <p className="text-muted-foreground">Negotiation script generator coming soon...</p>
      </div>
    </Card>
  );
};

export default ScriptGenerator;