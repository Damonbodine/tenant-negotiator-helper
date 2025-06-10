
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

    // Navigate to property analysis with address as query param
    navigate("/property-analysis?address=" + encodedAddress + "&tab=single");
  };

  return <main className="flex flex-col items-center justify-center mb-16">
            <div className="text-center relative w-full">
              <img src="/hero-banner.jpg" alt="Hero Banner" className="absolute inset-0 object-cover w-full h-full opacity-60" />
              <div className="relative w-full max-w-4xl mx-auto py-40 px-8 z-[1]">
                <h2 className="text-5xl font-bold mb-6 gradient-heading">Stop Overpaying For Rent</h2>
                <p className="text-xl font-normal mb-8">Our AI helps you understand if you're paying too much, how to negotiate, spot red flags, and practice your negotiation skills. Never overpay for rent again</p>


                {/* Quick address analysis form */}
                <form onSubmit={handleAddressAnalyze} className="max-w-lg mx-auto">
                  <div className="flex gap-2">
                    <Input type="text" placeholder="Enter an address to analyze price..." className="flex-1 bg-input" value={addressInput} onChange={e => setAddressInput(e.target.value)} />
                    <Button type="submit">
                      <Search className="mr-2 h-4 w-4" />
                      Analyze
                    </Button>
                  </div>
                </form>

                {!user && <div className="mt-8">
                    <Link to="/auth">
                      <Button variant="secondary">
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign In to Save Your Analysis
                      </Button>
                    </Link>
                  </div>}
              </div>
            </div>

            <div className="mt-16 space-y-16 w-full max-w-4xl">
              <FeatureCards />
              <TestimonialCarousel />
            </div>
        </main>;
};
export default Index;
