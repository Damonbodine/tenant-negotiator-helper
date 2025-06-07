import React from 'react';
import { useArtifactStore } from '@/shared/stores/artifactStore';
import { Button } from '@/shared/ui/button';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Badge } from '@/shared/ui/badge';
import { 
  BarChart3, 
  Table, 
  Map, 
  Calculator, 
  FileText, 
  MessageSquare,
  TrendingUp,
  Home,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ARTIFACT_ICONS = {
  'rent-trend-chart': BarChart3,
  'property-comparison': Table,
  'negotiation-roadmap': MessageSquare,
  'market-heatmap': Map,
  'affordability-calculator': Calculator,
  'lease-analyzer': FileText,
  'script-generator': MessageSquare,
  'market-position-indicator': TrendingUp,
  'neighborhood-insights': MapPin,
};

const PRIORITY_COLORS = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
};

export const ArtifactHistory: React.FC = () => {
  const { artifacts, currentArtifactId, setCurrentArtifact } = useArtifactStore();

  const sortedArtifacts = [...artifacts].sort((a, b) => 
    b.timestamp.getTime() - a.timestamp.getTime()
  );

  if (artifacts.length <= 1) {
    return null;
  }

  return (
    <div className="p-3">
      <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
        Artifact History
      </h4>
      
      <ScrollArea className="max-h-32">
        <div className="space-y-1">
          {sortedArtifacts.map((artifact) => {
            const Icon = ARTIFACT_ICONS[artifact.type] || FileText;
            const isActive = artifact.id === currentArtifactId;
            
            return (
              <Button
                key={artifact.id}
                variant={isActive ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setCurrentArtifact(artifact.id)}
                className={cn(
                  "w-full justify-start gap-2 h-8 px-2 text-xs",
                  isActive && "bg-secondary"
                )}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="relative">
                    <Icon className="h-3 w-3 text-muted-foreground" />
                    <div 
                      className={cn(
                        "absolute -top-1 -right-1 w-2 h-2 rounded-full",
                        PRIORITY_COLORS[artifact.priority]
                      )}
                    />
                  </div>
                  
                  <span className="truncate">
                    {artifact.title}
                  </span>
                </div>
                
                <span className="text-xs text-muted-foreground">
                  {artifact.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </Button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};