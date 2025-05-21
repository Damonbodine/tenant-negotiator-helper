
import { useState, Suspense } from "react";
import { FeatureCards } from "@/components/marketing/FeatureCards";
import { TestimonialCarousel } from "@/components/marketing/TestimonialCarousel";
import { Button } from "@/shared/ui/button";
import { Loader2, Search, LogIn } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";


// Types
type JourneyType = "market" | "negotiation" | "comparison" | null;
const Index = () => {
  const {
    user
  } = useAuth();
  const [addressInput, setAddressInput] = useState("");
  const navigate = useNavigate();

  const handleAddressAnalyze = (e: React.FormEvent) => {
    e.preventDefault();

    const encodedAddress = encodeURIComponent(addressInput);

    navigate("/market/" + encodedAddress);
  };

  return <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container flex flex-col items-center justify-center py-12 mb-16 md:mb-0">
          <div className="space-y-16 w-full max-w-4xl">
            <div className="text-center">
              <h2 className="text-5xl font-bold mb-6 gradient-heading">Stop Overpaying For Rent</h2>
              <p className="text-xl font-normal mb-8">Our AI helps you understand if you're paying too much, how to negotiate, spot red flags, and practice your negotiation skills. Never overpay for rent again</p>

              {!user && <div className="mb-8">
                  <Link to="/auth">
                    <Button variant="secondary">
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

            <FeatureCards />
            <TestimonialCarousel />
          </div>
      </main>
    </div>;
};
export default Index;
