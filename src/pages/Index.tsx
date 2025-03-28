
import { useState } from "react";
import { Header } from "@/components/Header";
import { AgentChat } from "@/components/AgentChat";
import { Link } from "react-router-dom";
import { Building } from "lucide-react";

const Index = () => {
  const [activeJourney, setActiveJourney] = useState<string | null>(null);
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-900 dark:to-slate-800">
      <header className="w-full bg-background/80 backdrop-blur-md border-b border-border py-3">
        <div className="container flex items-center justify-between">
          <div className="flex-1"></div>
          <div className="flex items-center gap-2">
            <Building className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold text-blue-600">RentCoach</h1>
          </div>
          <div className="flex-1"></div>
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
          <div className="space-y-12 w-full max-w-4xl">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-blue-600 mb-2">Start Your Rental Journey</h2>
              <p className="text-slate-600 dark:text-slate-300">Choose an option to get started</p>
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
                <div className="text-blue-500 text-4xl font-bold mb-2">Negotiation Tips</div>
                <p className="text-slate-600 dark:text-slate-300 text-center">Learn effective rental negotiation strategies</p>
              </button>
              
              <Link
                to="/practice"
                className="journey-bubble flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border-2 border-blue-200 dark:border-blue-800 rounded-full h-64 w-64 mx-auto transition-all hover:shadow-lg hover:scale-105"
              >
                <div className="text-blue-500 text-4xl font-bold mb-2">Practice Call</div>
                <p className="text-slate-600 dark:text-slate-300 text-center">Rehearse your negotiation with an AI landlord</p>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
