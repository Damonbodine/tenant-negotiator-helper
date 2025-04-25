
import { useState, useEffect } from "react";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { analyzeListingUrl } from "@/listingAnalyzer/services/listingAnalyzerService";
import { Loader2, BookOpen, Search } from "lucide-react";
import { Card, CardContent } from "@/shared/ui/card";

interface MarketInsightsProps {
  initialAddress?: string;
}

const MarketInsights = ({ initialAddress = "" }: MarketInsightsProps) => {
  const [url, setUrl] = useState(initialAddress);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);

  // Auto-trigger analysis when component mounts with initialAddress
  useEffect(() => {
    if (initialAddress) {
      handleAnalyze();
    }
  }, [initialAddress]);

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError("Please enter a property URL");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const data = await analyzeListingUrl(url);
      setAnalysis(data);
    } catch (err: any) {
      console.error("Error analyzing listing:", err);
      setError(err.message || "Failed to analyze listing");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "Unknown";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(price);
  };

  // Function to handle quick actions - this was missing before
  const handleQuickAction = (action: string) => {
    switch (action) {
      case "compareRents":
        // Logic to compare rents
        console.log("Compare rents action triggered");
        break;
      case "negotiationTips":
        // Logic to show negotiation tips
        console.log("Negotiation tips action triggered");
        break;
      case "marketTrends":
        // Logic to show market trends
        console.log("Market trends action triggered");
        break;
      default:
        console.log("Unknown quick action:", action);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
            Property URL or Address
          </label>
          <Input
            id="url"
            type="text"
            placeholder="Paste listing URL or enter address"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <Button onClick={handleAnalyze} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Analyze
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-800">
          <p>{error}</p>
        </div>
      )}

      {analysis && (
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="space-y-5">
              {/* Property Details */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Property Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Address</p>
                    <p>{analysis.address || "Unknown"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Monthly Rent</p>
                    <p>{formatPrice(analysis.rent)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Bedrooms</p>
                    <p>{analysis.beds || "Unknown"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Bathrooms</p>
                    <p>{analysis.baths || "Unknown"}</p>
                  </div>
                </div>
              </div>

              {/* Market Analysis */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Market Analysis</h3>
                <p>
                  This property appears to be{" "}
                  <span className="font-medium">
                    {analysis.verdict === "over-priced"
                      ? "above market rate"
                      : analysis.verdict === "under-priced"
                      ? "below market rate"
                      : "priced at market rate"}
                  </span>
                  .
                </p>
                {analysis.marketAverage && (
                  <p className="mt-1">
                    Area average: {formatPrice(analysis.marketAverage)}
                  </p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="pt-2">
                <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant="outline" 
                    className="flex gap-1 items-center"
                    onClick={() => handleQuickAction("compareRents")}
                  >
                    <Search className="h-4 w-4" />
                    Compare nearby rents
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="flex gap-1 items-center"
                    onClick={() => handleQuickAction("negotiationTips")}
                  >
                    <BookOpen className="h-4 w-4" />
                    Negotiation tips
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MarketInsights;
