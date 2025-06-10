import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useSearchParams } from "react-router-dom";
import { Home, BarChart3, Calculator } from "lucide-react";
import MarketInsights from "@/listingAnalyzer/components/MarketInsights";
import PropertyComparison from "@/propertyComparison/components/PropertyComparison";

const PropertyAnalysis = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "single";
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    // Update tab if URL param changes
    const tab = searchParams.get("tab");
    if (tab && (tab === "single" || tab === "compare")) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  return (
    <main className="container py-8">
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Property Analysis</h1>
            <p className="text-muted-foreground">
              Analyze rental properties to make informed decisions
            </p>
          </div>
          <Link 
            to="/" 
            className="px-4 py-2 rounded-lg text-muted-foreground border-muted-foreground border-[1px] hover:opacity-70 transition-opacity flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Back to home
          </Link>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="single" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Single Property Analysis
            </TabsTrigger>
            <TabsTrigger value="compare" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Compare Properties
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Analyze a Property</CardTitle>
                <CardDescription>
                  Get detailed market insights and pricing analysis for any rental property.
                  Enter an address or paste a listing URL to get started.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MarketInsights 
                  embedded={true} 
                  initialAddress={searchParams.get("address") || undefined} 
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compare" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Compare Multiple Properties</CardTitle>
                <CardDescription>
                  Compare up to 4 rental properties side-by-side with detailed analysis 
                  and cost breakdowns to find the best value.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PropertyComparison embedded={true} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
};

export default PropertyAnalysis;