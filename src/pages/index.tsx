
import { useState, lazy, Suspense, useEffect } from "react";
import { FeatureCards } from "@/components/marketing/FeatureCards";
import { TestimonialCarousel } from "@/components/marketing/TestimonialCarousel";
import { Button } from "@/shared/ui/button";
import { Loader2, Search, LogIn } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useSearchParams } from "react-router-dom";

// Lazy-loaded components
const MarketInsights = lazy(() => import("@/listingAnalyzer/components/MarketInsights"));
const NegotiationChat = lazy(() => import("@/chat/components/NegotiationChat"));
const PropertyComparison = lazy(() => import("@/propertyComparison/components/PropertyComparison"));

// Types
type JourneyType = "market" | "negotiation" | "comparison" | null;
const Index = () => {
  const {
    user
  } = useAuth();
  const [activeJourney, setActiveJourney] = useState<JourneyType>(null);
  const [addressInput, setAddressInput] = useState("");
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    // Check URL parameters for journey type
    const journeyParam = searchParams.get("journey");
    if (journeyParam && ["market", "negotiation", "comparison"].includes(journeyParam)) {
      setActiveJourney(journeyParam as JourneyType);
    }
  }, [searchParams]);
  
  const handleAddressAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (addressInput.trim()) {
      setActiveJourney("market");
    }
  };
  
  return <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container flex flex-col items-center justify-center py-12 mb-16 md:mb-0">
        {activeJourney ? <Suspense fallback={<div className="w-full flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>}>
            {activeJourney === "market" && <div className="w-full max-w-4xl h-[calc(100vh-10rem)]">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-blue-600">Market Insights</h2>
                  <button onClick={() => setActiveJourney(null)} className="px-4 py-2 rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors text-blue-600">
                    Back to options
                  </button>
                </div>
                
                <MarketInsights initialAddress={addressInput} />
              </div>}
            
            {activeJourney === "negotiation" && <div className="w-full max-w-4xl h-[calc(100vh-10rem)]">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-blue-600">Negotiation Tips</h2>
                  <button onClick={() => setActiveJourney(null)} className="px-4 py-2 rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors text-blue-600">
                    Back to options
                  </button>
                </div>
                <NegotiationChat />
              </div>}

            {activeJourney === "comparison" && <div className="w-full max-w-4xl h-[calc(100vh-10rem)]">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-blue-600">Property Comparison</h2>
                  <button onClick={() => setActiveJourney(null)} className="px-4 py-2 rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors text-blue-600">
                    Back to options
                  </button>
                </div>
                <PropertyComparison />
              </div>}
          </Suspense> : <div className="space-y-16 w-full max-w-4xl">
            <div className="text-center">
              <h2 className="text-5xl font-bold mb-6 gradient-heading">Stop Overpaying For Rent</h2>
              <p className="text-xl text-cyan-400/90 font-medium mb-8">Our AI helps you understand if you're paying too much, how to negotiate, spot red flags, and practice your negotiation skills. Never overpay for rent again</p>
              
              {!user && <div className="mb-8">
                  <Link to="/auth">
                    <Button className="bg-cyan-400 text-cyan-950 hover:bg-cyan-500">
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In to Save Your Analysis
                    </Button>
                  </Link>
                </div>}
              
              {/* Quick address analysis form */}
              <form onSubmit={handleAddressAnalyze} className="max-w-lg mx-auto">
                <div className="flex gap-2">
                  <Input type="text" placeholder="Enter an address to analyze price..." className="flex-1" value={addressInput} onChange={e => setAddressInput(e.target.value)} />
                  <Button type="submit">
                    <Search className="mr-2 h-4 w-4" />
                    Analyze
                  </Button>
                </div>
              </form>
            </div>
            
            <FeatureCards setActiveJourney={setActiveJourney} />
            <TestimonialCarousel />
          </div>}
      </main>
    </div>;
};
export default Index;
