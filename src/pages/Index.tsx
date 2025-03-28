
import { useState } from "react";
import { AgentChat } from "@/components/AgentChat";
import { Link } from "react-router-dom";
import { Building, Download, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

const Index = () => {
  const [activeJourney, setActiveJourney] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Success!",
      description: "Thank you for subscribing to our newsletter!",
    });
    setEmail("");
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-[#da7756]">
      <header className="w-full bg-background/80 backdrop-blur-md border-b border-border py-3">
        <div className="container flex items-center justify-between">
          <div className="flex-1 flex items-center gap-4">
            <a 
              href="/renters-playbook.pdf" 
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors text-white"
              download
            >
              <Download className="h-4 w-4" />
              <span>THE RENTERS PLAYBOOK</span>
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Building className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-blue-600 uppercase tracking-wider">RENTCOACH</h1>
          </div>
          <div className="flex-1 flex justify-end">
            <Button variant="outline" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>Contact Us</span>
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 container flex flex-col items-center justify-center py-6">
        {activeJourney ? (
          <>
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
                <AgentChat chatType="market" />
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
                <AgentChat chatType="negotiation" />
              </div>
            )}
          </>
        ) : (
          <div className="space-y-16 w-full max-w-4xl">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-white mb-4">Don't overpay for your next apartment.</h2>
              <p className="text-xl text-white font-semibold">Arm yourself with data to get the best price on rent</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button
                onClick={() => setActiveJourney("market")}
                className="journey-bubble flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border-2 border-blue-200 dark:border-blue-800 rounded-full h-64 w-64 mx-auto transition-all hover:shadow-lg hover:scale-105"
              >
                <div className="text-blue-500 text-4xl font-bold mb-2">Market Tips</div>
                <p className="text-slate-600 dark:text-slate-300 text-center">Get insights on rental prices and market trends</p>
              </button>
              
              <button
                onClick={() => setActiveJourney("negotiation")}
                className="journey-bubble flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border-2 border-blue-200 dark:border-blue-800 rounded-full h-64 w-64 mx-auto transition-all hover:shadow-lg hover:scale-105"
              >
                <div className="text-blue-500 text-4xl font-bold mb-2">Should I negotiate</div>
                <p className="text-slate-600 dark:text-slate-300 text-center">Learn effective rental negotiation strategies</p>
              </button>
              
              <Link
                to="/practice"
                className="journey-bubble flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border-2 border-blue-200 dark:border-blue-800 rounded-full h-64 w-64 mx-auto transition-all hover:shadow-lg hover:scale-105"
              >
                <div className="text-blue-500 text-4xl font-bold mb-2 text-center">Practice Call</div>
                <p className="text-slate-600 dark:text-slate-300 text-center">Rehearse your negotiation with an AI landlord</p>
              </Link>
            </div>
            
            <div className="mx-auto max-w-md w-full">
              <div className="text-center mb-4">
                <h3 className="text-lg font-medium text-white">Stay Updated</h3>
                <p className="text-sm text-white">Get the latest rental tips and market updates</p>
              </div>
              <form onSubmit={handleEmailSubmit} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit">Subscribe</Button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
