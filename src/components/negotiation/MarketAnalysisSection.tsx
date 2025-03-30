
import { ArrowDown, ArrowUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AnalysisResult } from "./types";
import { PriceRankIndicator } from "./PriceRankIndicator";

interface MarketAnalysisSectionProps {
  analysis: AnalysisResult;
  formatPrice: (price: number | null) => string;
}

export function MarketAnalysisSection({ analysis, formatPrice }: MarketAnalysisSectionProps) {
  return (
    <div>
      <h3 className="font-medium text-lg mb-3">Market Analysis</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card className="bg-blue-50 border border-blue-100">
          <CardContent className="p-4">
            <div className="text-sm text-blue-600 mb-1">Average Similar Rental</div>
            <div className="text-2xl font-bold">{formatPrice(analysis.averagePrice)}</div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border border-green-100">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-green-600 mb-1">Lower Priced Rentals</div>
              <div className="text-2xl font-bold">{analysis.lowerPriced}</div>
            </div>
            <ArrowDown className="h-8 w-8 text-green-500" />
          </CardContent>
        </Card>

        <Card className="bg-red-50 border border-red-100">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-red-600 mb-1">Higher Priced Rentals</div>
              <div className="text-2xl font-bold">{analysis.higherPriced}</div>
            </div>
            <ArrowUp className="h-8 w-8 text-red-500" />
          </CardContent>
        </Card>
      </div>

      <div className="bg-slate-50 p-4 rounded-lg border mb-4">
        <h4 className="font-medium mb-2">Price Assessment</h4>
        <p>{analysis.priceAssessment}</p>
      </div>

      {analysis.priceRank !== null && (
        <PriceRankIndicator priceRank={analysis.priceRank} />
      )}
    </div>
  );
}
