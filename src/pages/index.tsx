
import { useState, lazy, Suspense } from "react";
import { Header } from "@/shared/components/layout/Header";
import { FeatureCards } from "@/shared/components/marketing/FeatureCards";
import { NewsletterSignup } from "@/shared/components/marketing/NewsletterSignup";
import { Button } from "@/shared/ui/button";
import { Loader2 } from "lucide-react";

// Lazy-loaded components
const MarketInsights = lazy(() => import("@/listingAnalyzer/components/MarketInsights"));
const NegotiationChat = lazy(() => import("@/chat/components/NegotiationChat"));

// Types
type JourneyType = "market" | "negotiation" | null;

const Index = () => {
  const [activeJourney, setActiveJourney] = useState<JourneyType>(null);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container flex flex-col items-center justify-center py-12">
        {activeJourney ? (
          <Suspense fallback={
            <div className="w-full flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          }>
            {activeJourney === "market" && (
              <div className="w-full max-w-4xl h-[calc(100vh-10rem)]">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-blue-600">Market Tips</h2>
                  <button 
                    onClick={() => setActiveJourney(null)}
                    className="px-4 py-2 rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors text-blue-600"
                  >
                    Back to options
                  </button>
                </div>
                
                <MarketInsights />
              </div>
            )}
            
            {activeJourney === "negotiation" && (
              <div className="w-full max-w-4xl h-[calc(100vh-10rem)]">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-blue-600">Negotiation Tips</h2>
                  <button 
                    onClick={() => setActiveJourney(null)}
                    className="px-4 py-2 rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors text-blue-600"
                  >
                    Back to options
                  </button>
                </div>
                <NegotiationChat />
              </div>
            )}
          </Suspense>
        ) : (
          <div className="space-y-16 w-full max-w-4xl">
            <div className="text-center">
              <h2 className="text-5xl font-bold mb-6 gradient-heading">
                Don't overpay for your next apartment.
              </h2>
              <p className="text-xl text-cyan-400/90 font-medium">
                Arm yourself with data to get the best price on rent
              </p>
            </div>
            
            <FeatureCards setActiveJourney={setActiveJourney} />
            <NewsletterSignup />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
