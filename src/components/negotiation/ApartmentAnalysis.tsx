import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { 
  Loader2, ArrowDown, ArrowUp, DollarSign, 
  Home, MapPin, BedDouble, Bath, Info, AlertTriangle, Bug, 
  SquareIcon, ActivitySquare
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface PropertyDetails {
  address: string;
  zipCode: string;
  bedrooms: number | null;
  bathrooms: number | null;
  price: number | null;
  propertyType: string;
  squareFootage: number | null;
}

interface Comparable {
  address: string;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  propertyType: string;
  distance: number;
  url: string;
  squareFootage: number | null;
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
  const [testMode, setTestMode] = useState<string | null>(null);
  const [showTestControls, setShowTestControls] = useState(false);
  const [rawErrorResponse, setRawErrorResponse] = useState<string | null>(null);
  const [httpStatus, setHttpStatus] = useState<number | null>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [requestStartTime, setRequestStartTime] = useState<string | null>(null);
  const [requestEndTime, setRequestEndTime] = useState<string | null>(null);

  const formatPrice = (price: number | null) => {
    if (price === null) return "N/A";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatSqFt = (sqft: number | null) => {
    if (sqft === null) return "N/A";
    return new Intl.NumberFormat('en-US').format(sqft) + " sqft";
  };

  const toggleTestControls = () => {
    setShowTestControls(!showTestControls);
  };

  const toggleDebugInfo = () => {
    setShowDebugInfo(!showDebugInfo);
  };

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
    setRawErrorResponse(null);
    setHttpStatus(null);
    setRequestStartTime(new Date().toISOString());
    setRequestEndTime(null);

    try {
      console.log("Sending request to apartment-analysis function with URL:", zillowUrl);
      console.log("Test mode:", testMode || "disabled");
      
      console.log("Request started at:", requestStartTime);
      
      const response = await supabase.functions.invoke('apartment-analysis', {
        body: { 
          zillowUrl,
          testMode
        }
      });
      
      console.log("Full response from apartment-analysis function:", JSON.stringify(response, null, 2));
      
      const { data, error } = response;
      
      if (error) {
        console.error("Supabase function error:", error);
        setHttpStatus(error.context?.status || 500);
        setRawErrorResponse(JSON.stringify(error, null, 2));
        throw new Error("Failed to connect to analysis service. Please try again later.");
      }

      if (!data) {
        console.error("No data returned from function");
        setRawErrorResponse("No data returned from function call");
        throw new Error("No data returned from analysis service");
      }
      
      if (data.success === false) {
        console.error("Function returned error:", data.error);
        setRawErrorResponse(JSON.stringify(data, null, 2));
        throw new Error(data.error || "Failed to analyze apartment");
      }

      if (data.message) {
        setErrorMessage(data.message);
      }

      if (data.technicalError) {
        console.warn("Technical error from function:", data.technicalError);
        setRawErrorResponse(JSON.stringify({
          technicalError: data.technicalError,
          apiStatus: data.apiStatus
        }, null, 2));
      }

      if (data.analysis) {
        setAnalysis(data.analysis);
        toast({
          title: "Analysis Complete",
          description: data.message || "Analysis completed successfully",
          variant: data.message ? "default" : "default"
        });
      } else {
        console.error("No analysis data in response:", data);
        setRawErrorResponse(JSON.stringify(data, null, 2));
        throw new Error("No analysis data returned");
      }
    } catch (error) {
      console.error("Error analyzing apartment:", error);
      setErrorMessage(
        error instanceof Error 
          ? error.message 
          : "An unexpected error occurred while analyzing the apartment"
      );
      toast({
        title: "Analysis Error",
        description: "We encountered a problem analyzing this listing. See details below.",
        variant: "destructive"
      });
    } finally {
      const endTime = new Date().toISOString();
      setRequestEndTime(endTime);
      console.log("Request completed at:", endTime);
      setIsLoading(false);
    }
  };

  const handleCardDoubleClick = () => {
    toggleTestControls();
  };

  return (
    <Card className="h-full flex flex-col shadow-md border-blue-100 overflow-hidden" onDoubleClick={handleCardDoubleClick}>
      <CardContent className="p-6 flex-1 overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Apartment Price Analysis</h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleDebugInfo}
            className="flex gap-1 items-center"
          >
            <Bug className="h-4 w-4" />
            {showDebugInfo ? "Hide Debug" : "Show Debug"}
          </Button>
        </div>
        
        {showTestControls && (
          <div className="mb-4 p-3 bg-slate-50 border rounded-md">
            <h3 className="text-sm font-medium mb-2">Test Mode Controls</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="use-mock"
                  checked={testMode === "mock"}
                  onCheckedChange={(checked) => setTestMode(checked ? "mock" : null)}
                />
                <Label htmlFor="use-mock">Use Mock Data</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Toggle this switch to force using mock data instead of real API calls. Double-click anywhere on this card to hide these controls.
              </p>
            </div>
          </div>
        )}
        
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

        {isLoading && <LoadingState />}

        {showDebugInfo && !isLoading && (
          <Alert className="bg-gray-50 border-gray-200 text-gray-800 mb-4">
            <AlertTitle className="flex items-center gap-2">
              <Bug className="h-4 w-4" />
              Technical Debugging Information
            </AlertTitle>
            <AlertDescription>
              <div className="mt-2 space-y-2 text-xs">
                <div><strong>Test Mode:</strong> {testMode || "disabled"}</div>
                <div><strong>HTTP Status:</strong> {httpStatus || "N/A"}</div>
                <div><strong>URL:</strong> {zillowUrl || "N/A"}</div>
                <div><strong>Function:</strong> apartment-analysis</div>
                {requestStartTime && (
                  <div><strong>Request Start:</strong> {requestStartTime}</div>
                )}
                {requestEndTime && (
                  <div><strong>Request End:</strong> {requestEndTime}</div>
                )}
                {requestStartTime && requestEndTime && (
                  <div><strong>Duration:</strong> {
                    new Date(requestEndTime).getTime() - new Date(requestStartTime).getTime()
                  } ms</div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && errorMessage && (
          <Alert className="bg-amber-50 border-amber-200 text-amber-800 mb-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Analysis Note</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {!isLoading && rawErrorResponse && (
          <Alert className="bg-red-50 border-red-200 text-red-800 mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Details (Debug)</AlertTitle>
            <AlertDescription>
              <div className="mt-2 p-2 bg-red-100 rounded-md overflow-auto max-h-60">
                <pre className="text-xs whitespace-pre-wrap">{rawErrorResponse}</pre>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && analysis && (
          <AnalysisResults analysis={analysis} formatPrice={formatPrice} formatSqFt={formatSqFt} />
        )}

        {!isLoading && !analysis && !errorMessage && !rawErrorResponse && <EmptyState />}
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
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
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center p-8">
      <Home className="h-12 w-12 text-slate-300 mb-4" />
      <h3 className="font-medium text-lg">Enter a Zillow Rental Listing URL</h3>
      <p className="text-muted-foreground mt-2">
        Paste a Zillow URL to see how the price compares to similar rentals in the area.
      </p>
    </div>
  );
}

function AnalysisResults({ 
  analysis, 
  formatPrice,
  formatSqFt
}: { 
  analysis: AnalysisResult;
  formatPrice: (price: number | null) => string;
  formatSqFt: (sqft: number | null) => string;
}) {
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

function PropertyDetailsSection({ 
  property, 
  formatPrice,
  formatSqFt
}: { 
  property: PropertyDetails;
  formatPrice: (price: number | null) => string;
  formatSqFt: (sqft: number | null) => string;
}) {
  return (
    <div>
      <h3 className="font-medium text-lg mb-3">Subject Property</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium">Type:</span>
            <span className="text-sm">{property.propertyType || "N/A"}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium">Address:</span>
            <span className="text-sm truncate">{property.address || "N/A"}</span>
          </div>
          <div className="flex items-center gap-2">
            <BedDouble className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium">Bedrooms:</span>
            <span className="text-sm">{property.bedrooms || "N/A"}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Bath className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium">Bathrooms:</span>
            <span className="text-sm">{property.bathrooms || "N/A"}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium">Price:</span>
            <span className="text-sm">{formatPrice(property.price)}</span>
          </div>
          <div className="flex items-center gap-2">
            <ActivitySquare className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium">Size:</span>
            <span className="text-sm">{formatSqFt(property.squareFootage)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Zip Code:</span>
            <span className="text-sm">{property.zipCode || "N/A"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarketAnalysisSection({ 
  analysis,
  formatPrice
}: { 
  analysis: AnalysisResult;
  formatPrice: (price: number | null) => string;
}) {
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

function PriceRankIndicator({ priceRank }: { priceRank: number }) {
  return (
    <div className="mb-4">
      <h4 className="font-medium mb-2">Market Position</h4>
      <div className="relative h-4 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
          style={{ width: `${priceRank}%` }}
        />
        <div 
          className="absolute top-0 w-2 h-4 bg-black" 
          style={{ 
            left: `${Math.max(Math.min(priceRank, 98), 2)}%`, 
            transform: 'translateX(-50%)' 
          }}
        />
      </div>
      <div className="flex justify-between text-xs mt-1">
        <span>Lowest Price</span>
        <span>Highest Price</span>
      </div>
      <p className="text-sm mt-2">
        This rental is priced higher than {priceRank}% of similar rentals in the area.
      </p>
    </div>
  );
}

function NegotiationStrategySection({ strategy }: { strategy: string }) {
  return (
    <div>
      <h3 className="font-medium text-lg mb-2">Negotiation Strategy</h3>
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
        <p>{strategy}</p>
      </div>
    </div>
  );
}

function ComparablePropertiesSection({ 
  comparables,
  formatPrice,
  formatSqFt
}: { 
  comparables: Comparable[];
  formatPrice: (price: number | null) => string;
  formatSqFt: (sqft: number | null) => string;
}) {
  if (!comparables || comparables.length === 0) return null;
  
  return (
    <div>
      <h3 className="font-medium text-lg mb-3">Comparable Properties</h3>
      <div className="space-y-3">
        {comparables.slice(0, 5).map((comp, index) => (
          <div key={index} className="border rounded-lg p-3 bg-white">
            <div className="flex justify-between">
              <div className="truncate" style={{ maxWidth: '70%' }}>
                <div className="font-medium">{comp.address}</div>
                <div className="text-sm text-muted-foreground">
                  {comp.bedrooms} bed • {comp.bathrooms} bath • {formatSqFt(comp.squareFootage)}
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
  );
}
