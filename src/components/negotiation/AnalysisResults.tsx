
import { ScrollArea } from "@/components/ui/scroll-area";
import { AnalysisResult } from "./types";
import { PropertyDetailsSection } from "./PropertyDetailsSection";
import { MarketAnalysisSection } from "./MarketAnalysisSection";
import { NegotiationStrategySection } from "./NegotiationStrategySection";
import { ComparablePropertiesSection } from "./ComparablePropertiesSection";

interface AnalysisResultsProps {
  analysis: AnalysisResult;
  formatPrice: (price: number | null) => string;
  formatSqFt: (sqft: number | null) => string;
}

export function AnalysisResults({ 
  analysis, 
  formatPrice,
  formatSqFt
}: AnalysisResultsProps) {
  return (
    <ScrollArea className="flex-1 pr-4 -mr-4">
      <div className="space-y-6">
        <PropertyDetailsSection 
          property={analysis.subjectProperty} 
          formatPrice={formatPrice}
          formatSqFt={formatSqFt}
        />
        <MarketAnalysisSection 
          analysis={analysis}
          formatPrice={formatPrice}
        />
        <NegotiationStrategySection 
          strategy={analysis.negotiationStrategy} 
        />
        <ComparablePropertiesSection 
          comparables={analysis.comparables}
          formatPrice={formatPrice}
          formatSqFt={formatSqFt}
        />
      </div>
    </ScrollArea>
  );
}
