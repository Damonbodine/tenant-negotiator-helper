
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ArrowDown, ArrowUp, DollarSign, Home, MapPin, BedDouble, Bath } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PropertyDetails {
  address: string;
  zipCode: string;
  bedrooms: number | null;
  bathrooms: number | null;
  price: number | null;
  propertyType: string;
}

interface Comparable {
  address: string;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  propertyType: string;
  distance: number;
  url: string;
}

interface AnalysisResult {
  subjectProperty: PropertyDetails;
  averagePrice: number;
  higherPriced: number;
  lowerPriced: number;
  totalComparables: number;
  comparables: Comparable[];
  priceRank: number | null;
  priceAssessment: string;
  negotiationStrategy: string;
}

export function ApartmentAnalysis() {
  const { toast } = useToast();
  const [zillowUrl, setZillowUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!zillowUrl) {
      toast({
        title: "URL Required",
        description: "Please enter a Zillow listing URL",
        variant: "destructive"
      });
      return;
    }

    if (!zillowUrl.includes("zillow.com")) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid Zillow URL",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setAnalysis(null);

    try {
      const { data, error } = await supabase.functions.invoke('apartment-analysis', {
        body: { zillowUrl }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || "Failed to analyze apartment");
      }

      if (data.message) {
        // This is a case where we got property details but not enough comparables
        setErrorMessage(data.message);
      }

      if (data.analysis) {
        setAnalysis(data.analysis);
      }
    } catch (error) {
      console.error("Error analyzing apartment:", error);
      setErrorMessage(
        error instanceof Error 
          ? error.message 
          : "An unexpected error occurred while analyzing the apartment"
      );
      toast({
        title: "Analysis Failed",
        description: "Could not analyze the apartment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number | null) => {
    if (price === null) return "N/A";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <Card className="h-full flex flex-col shadow-md border-blue-100 overflow-hidden">
      <CardContent className="p-6 flex-1 overflow-hidden flex flex-col">
        <h2 className="text-xl font-semibold mb-4">Apartment Price Analysis</h2>
        
        <div className="flex gap-2 mb-6">
          <Input
            placeholder="Paste Zillow listing URL here..."
            value={zillowUrl}
            onChange={(e) => setZillowUrl(e.target.value)}
            className="flex-1"
            disabled={isLoading}
          />
          <Button 
            onClick={handleAnalyze} 
            disabled={isLoading || !zillowUrl}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                Analyzing
              </>
            ) : (
              "Analyze"
            )}
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-[200px] w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ) : errorMessage ? (
          <Alert className="bg-amber-50 border-amber-200 text-amber-800">
            <AlertTitle>Analysis Limited</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : analysis ? (
          <ScrollArea className="flex-1 pr-4 -mr-4">
            <div className="space-y-6">
              {/* Subject Property Section */}
              <div>
                <h3 className="font-medium text-lg mb-3">Subject Property</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-slate-500" />
                      <span className="text-sm font-medium">Type:</span>
                      <span className="text-sm">{analysis.subjectProperty.propertyType || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-500" />
                      <span className="text-sm font-medium">Address:</span>
                      <span className="text-sm truncate">{analysis.subjectProperty.address || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BedDouble className="h-4 w-4 text-slate-500" />
                      <span className="text-sm font-medium">Bedrooms:</span>
                      <span className="text-sm">{analysis.subjectProperty.bedrooms || "N/A"}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Bath className="h-4 w-4 text-slate-500" />
                      <span className="text-sm font-medium">Bathrooms:</span>
                      <span className="text-sm">{analysis.subjectProperty.bathrooms || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-slate-500" />
                      <span className="text-sm font-medium">Price:</span>
                      <span className="text-sm">{formatPrice(analysis.subjectProperty.price)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Zip Code:</span>
                      <span className="text-sm">{analysis.subjectProperty.zipCode || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Market Analysis Section */}
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
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Market Position</h4>
                    <div className="relative h-4 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                        style={{ width: `${analysis.priceRank}%` }}
                      />
                      <div 
                        className="absolute top-0 w-2 h-4 bg-black" 
                        style={{ 
                          left: `${Math.max(Math.min(analysis.priceRank, 98), 2)}%`, 
                          transform: 'translateX(-50%)' 
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span>Lowest Price</span>
                      <span>Highest Price</span>
                    </div>
                    <p className="text-sm mt-2">
                      This rental is priced higher than {analysis.priceRank}% of similar rentals in the area.
                    </p>
                  </div>
                )}
              </div>

              {/* Negotiation Strategy */}
              <div>
                <h3 className="font-medium text-lg mb-2">Negotiation Strategy</h3>
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                  <p>{analysis.negotiationStrategy}</p>
                </div>
              </div>

              {/* Comparable Properties */}
              {analysis.comparables && analysis.comparables.length > 0 && (
                <div>
                  <h3 className="font-medium text-lg mb-3">Comparable Properties</h3>
                  <div className="space-y-3">
                    {analysis.comparables.slice(0, 5).map((comp, index) => (
                      <div key={index} className="border rounded-lg p-3 bg-white">
                        <div className="flex justify-between">
                          <div className="truncate" style={{ maxWidth: '70%' }}>
                            <div className="font-medium">{comp.address}</div>
                            <div className="text-sm text-muted-foreground">
                              {comp.bedrooms} bed • {comp.bathrooms} bath • {comp.propertyType}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{formatPrice(comp.price)}</div>
                            <div className="text-xs text-muted-foreground">
                              {comp.distance.toFixed(1)} miles away
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 text-center p-8">
            <Home className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="font-medium text-lg">Enter a Zillow Rental Listing URL</h3>
            <p className="text-muted-foreground mt-2">
              Paste a Zillow URL to see how the price compares to similar rentals in the area.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
