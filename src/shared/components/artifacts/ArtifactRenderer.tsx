import React, { lazy, Suspense } from 'react';
import { VisualArtifact } from '@/shared/types/artifacts';
import { Card } from '@/shared/ui/card';
import { AlertCircle } from 'lucide-react';

// Lazy load artifact components with error handling
const RentTrendChart = lazy(() => 
  import('./types/RentTrendChart').catch(() => {
    console.error('Failed to load RentTrendChart component');
    return { default: () => <div>Failed to load component</div> };
  })
);
const PropertyComparison = lazy(() => 
  import('./types/PropertyComparison').catch(() => {
    console.error('Failed to load PropertyComparison component');
    return { default: () => <div>Failed to load component</div> };
  })
);
const NegotiationRoadmap = lazy(() => 
  import('./types/NegotiationRoadmap').catch(() => {
    console.error('Failed to load NegotiationRoadmap component');
    return { default: () => <div>Failed to load component</div> };
  })
);
const MarketHeatmap = lazy(() => 
  import('./types/MarketHeatmap').catch(() => {
    console.error('Failed to load MarketHeatmap component');
    return { default: () => <div>Failed to load component</div> };
  })
);
const AffordabilityCalculator = lazy(() => 
  import('./types/AffordabilityCalculator').catch(() => {
    console.error('Failed to load AffordabilityCalculator component');
    return { default: () => <div>Failed to load component</div> };
  })
);
const LeaseAnalyzer = lazy(() => 
  import('./types/LeaseAnalyzer').catch(() => {
    console.error('Failed to load LeaseAnalyzer component');
    return { default: () => <div>Failed to load component</div> };
  })
);
const ScriptGenerator = lazy(() => 
  import('./types/ScriptGenerator').catch(() => {
    console.error('Failed to load ScriptGenerator component');
    return { default: () => <div>Failed to load component</div> };
  })
);
const MarketPositionIndicator = lazy(() => 
  import('./types/MarketPositionIndicator').catch(() => {
    console.error('Failed to load MarketPositionIndicator component');
    return { default: () => <div>Failed to load component</div> };
  })
);
const NeighborhoodInsights = lazy(() => 
  import('./types/NeighborhoodInsights').catch(() => {
    console.error('Failed to load NeighborhoodInsights component');
    return { default: () => <div>Failed to load component</div> };
  })
);

const ARTIFACT_COMPONENTS = {
  'rent-trend-chart': RentTrendChart,
  'property-comparison': PropertyComparison,
  'negotiation-roadmap': NegotiationRoadmap,
  'market-heatmap': MarketHeatmap,
  'affordability-calculator': AffordabilityCalculator,
  'lease-analyzer': LeaseAnalyzer,
  'script-generator': ScriptGenerator,
  'market-position-indicator': MarketPositionIndicator,
  'neighborhood-insights': NeighborhoodInsights,
};

interface ArtifactRendererProps {
  artifact: VisualArtifact;
  className?: string;
}

export const ArtifactRenderer: React.FC<ArtifactRendererProps> = ({ 
  artifact, 
  className 
}) => {
  const Component = ARTIFACT_COMPONENTS[artifact.type];

  if (!Component) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center gap-2 text-amber-600">
          <AlertCircle className="h-5 w-5" />
          <div>
            <h4 className="font-medium">Unknown Artifact Type</h4>
            <p className="text-sm text-muted-foreground">
              Artifact type "{artifact.type}" is not supported yet.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Suspense fallback={<ArtifactSkeleton />}>
        <ErrorBoundary>
          <Component data={artifact.data} artifact={artifact} />
        </ErrorBoundary>
      </Suspense>
    </div>
  );
};

// Error boundary for artifact components
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Artifact component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <div>
              <h4 className="font-medium">Component Error</h4>
              <p className="text-sm text-muted-foreground">
                Failed to render this artifact. Please try refreshing the page.
              </p>
            </div>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

const ArtifactSkeleton: React.FC = () => (
  <Card className="p-6">
    <div className="space-y-4">
      <div className="h-6 bg-muted rounded animate-pulse w-1/2" />
      <div className="h-32 bg-muted rounded animate-pulse" />
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse" />
        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
      </div>
    </div>
  </Card>
);